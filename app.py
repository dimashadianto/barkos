"""BarKos backend (Flask + SQLite). Jalankan: python app.py  -> http://localhost:5000"""

import sqlite3, math, time, os, json
from flask import Flask, request, jsonify, g, send_from_directory, redirect, abort
from urllib.parse import quote
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from services import ai_moderation, notifier, payment  # 3 layanan pihak ketiga (mock)

app = Flask(__name__, static_folder="static", static_url_path="")
tok = URLSafeTimedSerializer(os.environ.get("BARKOS_SECRET", "ganti-di-produksi"))
DB = "barkos.db"
FEE_RATE = 0.05
AREAS = {
    "Tanjung Duren": (-6.17, 106.78),
    "Grogol": (-6.16, 106.79),
    "Slipi": (-6.20, 106.80),
    "Kebon Jeruk": (-6.19, 106.77),
    "Kelapa Gading": (-6.16, 106.91),
    "Bekasi Barat": (-6.24, 106.99),
}


# ---------- DB ----------
def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close(_):
    d = g.pop("db", None)
    d and d.close()


def q(sql, a=(), one=False):
    r = db().execute(sql, a).fetchall()
    return (r[0] if r else None) if one else r


def ex(sql, a=()):
    c = db().execute(sql, a)
    db().commit()
    return c.lastrowid


def init():
    c = sqlite3.connect(DB)
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name, email UNIQUE, pw, phone, segment, role DEFAULT 'user', area);
    CREATE TABLE IF NOT EXISTS listings(id INTEGER PRIMARY KEY, seller_id, title, descr, category, price INT, cond, cod INT,
      area, lat REAL, lng REAL, photo, status, ai_note, ts INT);
    CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, listing_id, from_id, to_id, body, ts INT);
    CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, listing_id, buyer_id, seller_id, price INT, fee INT, status, ts INT);
    CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY, listing_id, reporter_id, reason, ts INT);
    CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY, user_id, rating INT, category, message, ts INT);
    CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, user_id, text, link, read INT DEFAULT 0, ts INT);
    """)
    for t, col in [
        ("listings", "reject_reason"),
        ("orders", "pay_method"),
        ("orders", "pay_channel"),
        ("orders", "pay_status"),
        ("orders", "pay_ref"),
        ("orders", "pay_info"),
        ("orders", "done_ts"),
    ]:
        try:
            c.execute(
                f"ALTER TABLE {t} ADD COLUMN {col}"
            )  # migrasi untuk database lama
        except sqlite3.OperationalError:
            pass
    if not c.execute("SELECT 1 FROM users WHERE role='admin'").fetchone():
        c.execute(
            "INSERT INTO users(name,email,pw,role,area,segment) VALUES('Tim Verifikasi','admin@barkos.id',?,'admin','Grogol','admin')",
            (generate_password_hash("admin123"),),
        )
    c.commit()
    c.close()


def notify(user_id, text, link="notifications"):
    ex(
        "INSERT INTO notifications(user_id,text,link,ts) VALUES(?,?,?,?)",
        (user_id, text, link, int(time.time())),
    )
    notifier.send(user_id, text)


def notify_admins(text, link="admin"):
    for a in q("SELECT id FROM users WHERE role='admin'"):
        notify(a["id"], text, link)


# ---------- Auth ----------
def user_json(u):
    return {
        k: u[k] for k in ("id", "name", "email", "phone", "segment", "role", "area")
    }


def auth(admin=False):
    def deco(f):
        def w(*a, **k):
            try:
                uid = tok.loads(
                    request.headers.get("Authorization", "").replace("Bearer ", ""),
                    max_age=7 * 86400,
                )
            except (BadSignature, SignatureExpired):
                return jsonify(error="Sesi berakhir, silakan masuk lagi"), 401
            g.user = q("SELECT * FROM users WHERE id=?", (uid,), one=True)
            if not g.user:
                return jsonify(error="Akun tidak ditemukan"), 401
            if admin and g.user["role"] != "admin":
                return jsonify(error="Khusus tim verifikasi"), 403
            return f(*a, **k)

        w.__name__ = f.__name__
        return w

    return deco


def body():
    return request.get_json(silent=True) or {}


@app.post("/api/register")
def register():
    d = body()
    name, email, pw = (
        d.get("name", "").strip(),
        d.get("email", "").strip().lower(),
        d.get("password", ""),
    )
    if not (name and "@" in email and len(pw) >= 6):
        return (
            jsonify(error="Isi nama, email valid, dan password minimal 6 karakter"),
            400,
        )
    if d.get("segment") not in ("mahasiswa", "pekerja"):
        return jsonify(error="Pilih tipe: mahasiswa atau pekerja"), 400
    if d.get("area") not in AREAS:
        return jsonify(error="Pilih area tinggal"), 400
    if q("SELECT 1 FROM users WHERE email=?", (email,)):
        return jsonify(error="Email sudah terdaftar"), 409
    uid = ex(
        "INSERT INTO users(name,email,pw,phone,segment,area) VALUES(?,?,?,?,?,?)",
        (
            name,
            email,
            generate_password_hash(pw),
            d.get("phone", ""),
            d["segment"],
            d["area"],
        ),
    )
    notify(
        uid,
        "Selamat datang di BarKos! Barang yang kamu pasang akan diverifikasi admin dulu sebelum tayang.",
    )
    return jsonify(
        token=tok.dumps(uid),
        user=user_json(q("SELECT * FROM users WHERE id=?", (uid,), one=True)),
    )


@app.post("/api/login")
def login():
    d = body()
    u = q(
        "SELECT * FROM users WHERE email=?",
        (d.get("email", "").strip().lower(),),
        one=True,
    )
    if not u or not check_password_hash(u["pw"], d.get("password", "")):
        return jsonify(error="Email atau password salah"), 401
    return jsonify(token=tok.dumps(u["id"]), user=user_json(u))


# ---------- Profil, hapus akun, feedback ----------
@app.get("/api/me")
@auth()
def me():
    return jsonify(user_json(g.user))


@app.put("/api/me")
@auth()
def me_update():
    d = body()
    area = d.get("area", g.user["area"])
    if area not in AREAS:
        return jsonify(error="Area tidak valid"), 400
    ex(
        "UPDATE users SET name=?, phone=?, area=? WHERE id=?",
        (
            d.get("name", "").strip() or g.user["name"],
            d.get("phone", ""),
            area,
            g.user["id"],
        ),
    )
    return jsonify(
        user_json(q("SELECT * FROM users WHERE id=?", (g.user["id"],), one=True))
    )


@app.delete("/api/me")
@auth()
def me_delete():
    if g.user["role"] == "admin":
        return jsonify(error="Akun admin tidak bisa dihapus"), 403
    if not check_password_hash(g.user["pw"], body().get("password", "")):
        return jsonify(error="Password salah"), 403
    i = g.user["id"]
    if q(
        "SELECT 1 FROM orders WHERE (buyer_id=? OR seller_id=?) AND status='accepted'",
        (i, i),
    ):
        return (
            jsonify(
                error="Selesaikan atau batalkan transaksi COD yang sedang berjalan dulu"
            ),
            409,
        )
    for s in (
        "DELETE FROM messages WHERE from_id=? OR to_id=?",
        "DELETE FROM orders WHERE buyer_id=? OR seller_id=?",
    ):
        ex(s, (i, i))
    for s in (
        "DELETE FROM reports WHERE reporter_id=?",
        "DELETE FROM listings WHERE seller_id=?",
        "DELETE FROM feedback WHERE user_id=?",
        "DELETE FROM notifications WHERE user_id=?",
        "DELETE FROM users WHERE id=?",
    ):
        ex(s, (i,))
    return jsonify(ok=True)


@app.post("/api/feedback")
@auth()
def feedback():
    if g.user["role"] == "admin":
        return jsonify(error="Admin tidak perlu mengirim feedback"), 403
    d = body()
    try:
        rating = int(d.get("rating", 0))
    except (TypeError, ValueError):
        rating = 0
    msg = (d.get("message") or "").strip()[:1000]
    if not (1 <= rating <= 5 and msg):
        return jsonify(error="Beri bintang 1-5 dan tulis pesan"), 400
    ex(
        "INSERT INTO feedback(user_id,rating,category,message,ts) VALUES(?,?,?,?,?)",
        (g.user["id"], rating, d.get("category", "umum"), msg, int(time.time())),
    )
    notify_admins(
        f"Feedback baru dari {g.user['name']} ({rating}/5): {msg[:60]}",
        "admin-feedback",
    )
    return jsonify(ok=True)


# ---------- Notifikasi ----------
@app.get("/api/notifications")
@auth()
def notifs():
    return jsonify(
        [
            dict(r)
            for r in q(
                "SELECT id,text,link,read,ts FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50",
                (g.user["id"],),
            )
        ]
    )


@app.get("/api/notifications/count")
@auth()
def notif_count():
    i = g.user["id"]
    last = q(
        "SELECT id,text FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 1",
        (i,),
        one=True,
    )
    return jsonify(
        unread=q(
            "SELECT COUNT(*) FROM notifications WHERE user_id=? AND read=0",
            (i,),
            one=True,
        )[0],
        latest=dict(last) if last else None,
    )


@app.post("/api/notifications/read")
@auth()
def notif_read():
    ex("UPDATE notifications SET read=1 WHERE user_id=?", (g.user["id"],))
    return jsonify(ok=True)


# ---------- Barang: pasang (wajib diverifikasi admin) & cari berbasis radius ----------
def dist(a, b, c, d):
    p = math.pi / 180
    h = (
        math.sin((c - a) * p / 2) ** 2
        + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    )
    return 12742 * math.asin(math.sqrt(h))


def listing_json(r, area=None):  # koordinat TIDAK dikirim; hanya area & jarak
    d = {
        k: r[k]
        for k in (
            "id",
            "seller_id",
            "title",
            "descr",
            "category",
            "price",
            "cond",
            "area",
            "photo",
            "status",
            "ai_note",
            "reject_reason",
        )
    }
    d["cod"] = bool(r["cod"])
    d["seller"] = (
        q("SELECT name FROM users WHERE id=?", (r["seller_id"],), one=True)
        or {"name": "Pengguna"}
    )["name"]
    d["mine"] = r["seller_id"] == g.user["id"]
    if area:
        d["km"] = round(dist(AREAS[area][0], AREAS[area][1], r["lat"], r["lng"]), 1)
    return d


@app.post("/api/listings")
@auth()
def create_listing():
    if g.user["role"] == "admin":
        return jsonify(error="Admin tidak bisa menjual barang"), 403
    d = body()
    t = d.get("title", "").strip()
    try:
        price = int(d.get("price", 0))
    except ValueError:
        price = 0
    if not t or price <= 0:
        return jsonify(error="Isi nama barang dan harga"), 400
    area = d.get("area") if d.get("area") in AREAS else g.user["area"]
    lat, lng = AREAS[area]
    ai = ai_moderation.check_listing(t, d.get("descr", ""), d.get("photo"))
    lid = ex(
        "INSERT INTO listings(seller_id,title,descr,category,price,cond,cod,area,lat,lng,photo,status,ai_note,ts) VALUES(?,?,?,?,?,?,?,?,?,?,?,'pending',?,?)",
        (
            g.user["id"],
            t,
            d.get("descr", ""),
            d.get("category", "Lainnya"),
            price,
            d.get("cond", "Baik"),
            int(bool(d.get("cod", True))),
            area,
            lat,
            lng,
            d.get("photo"),
            ai["note"],
            int(time.time()),
        ),
    )
    notify_admins(f"Barang baru menunggu verifikasi: {t}")
    return jsonify(id=lid, status="pending")


@app.get("/api/listings")
@auth()
def listings():
    a = request.args
    sql, p = "SELECT * FROM listings WHERE status='active' AND seller_id<>?", [
        g.user["id"]
    ]  # barang sendiri tidak ditampilkan
    if a.get("q"):
        sql += " AND (title LIKE ? OR descr LIKE ?)"
        p += [f"%{a['q']}%"] * 2
    if a.get("category"):
        sql += " AND category=?"
        p.append(a["category"])
    rows = [listing_json(r, g.user["area"]) for r in q(sql + " ORDER BY ts DESC", p)]
    try:
        rad = float(a.get("radius") or 0)
    except ValueError:
        rad = 0
    if rad:
        rows = [r for r in rows if r["km"] <= rad]
    if a.get("sort") == "near":
        rows.sort(key=lambda r: r["km"])
    return jsonify(rows)


@app.get("/api/listings/<int:lid>")
@auth()
def listing_detail(lid):
    r = q("SELECT * FROM listings WHERE id=?", (lid,), one=True)
    if not r or (
        r["status"] != "active"
        and r["seller_id"] != g.user["id"]
        and g.user["role"] != "admin"
    ):
        return jsonify(error="Barang tidak ditemukan"), 404
    return jsonify(listing_json(r, g.user["area"]))


@app.get("/api/my/listings")
@auth()
def my_listings():
    return jsonify(
        [
            listing_json(r)
            for r in q(
                "SELECT * FROM listings WHERE seller_id=? ORDER BY ts DESC",
                (g.user["id"],),
            )
        ]
    )


# ---------- Chat ----------
@app.get("/api/chats")
@auth()
def chats():
    i = g.user["id"]
    out = {}
    for m in q("SELECT * FROM messages WHERE from_id=? OR to_id=? ORDER BY ts", (i, i)):
        other = m["to_id"] if m["from_id"] == i else m["from_id"]
        l = q("SELECT title FROM listings WHERE id=?", (m["listing_id"],), one=True)
        u = q("SELECT name FROM users WHERE id=?", (other,), one=True)
        out[(m["listing_id"], other)] = dict(
            listing_id=m["listing_id"],
            with_id=other,
            title=l["title"] if l else "(barang dihapus)",
            name=u["name"] if u else "Pengguna",
            last=m["body"],
        )
    return jsonify(list(out.values())[::-1])


@app.route("/api/listings/<int:lid>/messages", methods=["GET", "POST"])
@auth()
def messages(lid):
    i = g.user["id"]
    l = q("SELECT * FROM listings WHERE id=?", (lid,), one=True)
    if not l:
        return jsonify(error="Barang tidak ada"), 404
    try:
        other = int(request.args.get("with") or body().get("with") or l["seller_id"])
    except ValueError:
        return jsonify(error="Lawan bicara tidak valid"), 400
    if other == i:
        return jsonify(error="Kamu tidak bisa chat dengan dirimu sendiri"), 400
    if l["seller_id"] not in (i, other):
        return jsonify(error="Chat hanya antara pembeli dan penjual barang ini"), 403
    if request.method == "POST":
        t = body().get("body", "").strip()
        if t:
            ex(
                "INSERT INTO messages(listing_id,from_id,to_id,body,ts) VALUES(?,?,?,?,?)",
                (lid, i, other, t, int(time.time())),
            )
            notify(
                other,
                f"Pesan baru dari {g.user['name']} tentang {l['title']}",
                f"chatroom?l={lid}&w={i}&t={quote(l['title'])}",
            )
    rows = q(
        "SELECT * FROM messages WHERE listing_id=? AND ((from_id=? AND to_id=?) OR (from_id=? AND to_id=?)) ORDER BY ts",
        (lid, i, other, other, i),
    )
    return jsonify([{"mine": m["from_id"] == i, "body": m["body"]} for m in rows])


# ---------- Transaksi: COD atau bayar online (bank / e-wallet, mock) ----------
def order_json(r, i):
    d = dict(r)
    d["role"] = "pembeli" if r["buyer_id"] == i else "penjual"
    d["title"] = d.get("title") or "(dihapus)"
    d["pay_method"] = d.get("pay_method") or "cod"
    d["pay_status"] = d.get("pay_status") or "none"
    d["pay_info"] = json.loads(d["pay_info"]) if d.get("pay_info") else None
    d["payout"] = d["price"] - d["fee"]
    return d


@app.get("/api/payment/channels")
@auth()
def pay_channels():
    return jsonify(payment.CHANNELS)


@app.post("/api/orders")
@auth()
def order_create():
    d = body()
    l = q(
        "SELECT * FROM listings WHERE id=? AND status='active'",
        (d.get("listing_id"),),
        one=True,
    )
    if not l:
        return jsonify(error="Barang tidak tersedia"), 404
    if l["seller_id"] == g.user["id"]:
        return jsonify(error="Kamu tidak bisa membeli barangmu sendiri"), 403
    pm = d.get("pay_method", "cod")
    if pm not in ("cod", "online"):
        return jsonify(error="Metode pembayaran tidak valid"), 400
    if pm == "cod" and not l["cod"]:
        return jsonify(error="Barang ini tidak bisa COD, pilih bayar online"), 400
    if q(
        "SELECT 1 FROM orders WHERE listing_id=? AND buyer_id=? AND status IN ('requested','accepted')",
        (l["id"], g.user["id"]),
    ):
        return jsonify(error="Kamu sudah mengajukan barang ini"), 409
    ex(
        "INSERT INTO orders(listing_id,buyer_id,seller_id,price,fee,status,ts,pay_method,pay_status) VALUES(?,?,?,?,?,'requested',?,?,?)",
        (
            l["id"],
            g.user["id"],
            l["seller_id"],
            l["price"],
            round(l["price"] * FEE_RATE),
            int(time.time()),
            pm,
            "none" if pm == "cod" else "unpaid",
        ),
    )
    notify(
        l["seller_id"],
        f"{g.user['name']} ingin membeli {l['title']} ({'COD' if pm == 'cod' else 'bayar online'})",
        "orders",
    )
    return jsonify(ok=True)


@app.get("/api/orders")
@auth()
def orders():
    i = g.user["id"]
    rows = q(
        "SELECT o.*, l.title FROM orders o LEFT JOIN listings l ON l.id=o.listing_id WHERE o.buyer_id=? OR o.seller_id=? ORDER BY o.ts DESC, o.id DESC",
        (i, i),
    )
    return jsonify([order_json(r, i) for r in rows])


@app.get("/api/orders/<int:oid>")
@auth()
def order_one(oid):
    i = g.user["id"]
    r = q(
        "SELECT o.*, l.title FROM orders o LEFT JOIN listings l ON l.id=o.listing_id WHERE o.id=? AND (o.buyer_id=? OR o.seller_id=?)",
        (oid, i, i),
        one=True,
    )
    return (
        jsonify(order_json(r, i))
        if r
        else (jsonify(error="Transaksi tidak ditemukan"), 404)
    )


@app.post(
    "/api/orders/<int:oid>/pay"
)  # pembeli memilih bank / e-wallet -> gateway (mock) membuat tagihan
@auth()
def order_pay(oid):
    o = q(
        "SELECT * FROM orders WHERE id=? AND buyer_id=?", (oid, g.user["id"]), one=True
    )
    if not o:
        return jsonify(error="Transaksi tidak ditemukan"), 404
    if o["pay_method"] != "online" or o["status"] != "accepted":
        return (
            jsonify(
                error="Pembayaran hanya bisa setelah penjual menyetujui pesanan online"
            ),
            400,
        )
    if o["pay_status"] in ("paid", "released"):
        return jsonify(error="Pesanan ini sudah dibayar"), 409
    ch = payment.create_charge(oid, o["price"], body().get("channel"))
    if not ch:
        return jsonify(error="Pilih bank atau e-wallet yang tersedia"), 400
    ex(
        "UPDATE orders SET pay_status='pending', pay_channel=?, pay_ref=?, pay_info=? WHERE id=?",
        (ch["channel"], ch["ref"], json.dumps(ch["info"]), oid),
    )
    return jsonify(ok=True)


@app.post(
    "/api/orders/<int:oid>/pay/simulate"
)  # tombol "simulasi bayar": meniru webhook lunas dari gateway
@auth()
def order_pay_sim(oid):
    o = q(
        "SELECT * FROM orders WHERE id=? AND buyer_id=?", (oid, g.user["id"]), one=True
    )
    if not o or o["pay_status"] != "pending":
        return jsonify(error="Belum ada tagihan yang menunggu pembayaran"), 400
    payment.confirm(o["pay_ref"])
    ex("UPDATE orders SET pay_status='paid' WHERE id=?", (oid,))
    notify(
        o["seller_id"],
        f"Pembayaran transaksi #{oid} sudah masuk. Silakan serahkan barang ke pembeli.",
        "orders",
    )
    return jsonify(ok=True)


@app.post("/api/orders/<int:oid>/<act>")
@auth()
def order_act(oid, act):
    o = q("SELECT * FROM orders WHERE id=?", (oid,), one=True)
    i = g.user["id"]
    if not o or i not in (o["buyer_id"], o["seller_id"]):
        return jsonify(error="Transaksi tidak ditemukan"), 404
    seller = i == o["seller_id"]
    s = o["status"]
    online = (o["pay_method"] or "cod") == "online"
    ps = o["pay_status"] or "none"
    if act in ("accept", "reject") and seller and s == "requested":
        ns = "accepted" if act == "accept" else "rejected"
    elif (
        act == "complete" and s == "accepted" and not online and seller
    ):  # COD: penjual menandai selesai
        ns = "completed"
        payment.charge_fee(oid, o["fee"])
    elif (
        act == "complete" and s == "accepted" and online and not seller
    ):  # online: pembeli konfirmasi barang diterima -> dana cair
        if ps != "paid":
            return jsonify(error="Kamu belum membayar pesanan ini"), 400
        ns = "completed"
        payment.payout(oid, o["price"] - o["fee"])
        ex("UPDATE orders SET pay_status='released' WHERE id=?", (oid,))
    elif act == "cancel" and s in ("requested", "accepted"):
        if ps in ("paid", "released"):
            return (
                jsonify(
                    error="Pesanan sudah dibayar, tidak bisa dibatalkan sendiri. Hubungi admin."
                ),
                400,
            )
        ns = "cancelled"
    else:
        return jsonify(error="Aksi tidak valid untuk status saat ini"), 400
    if ns == "completed":
        ex("UPDATE listings SET status='sold' WHERE id=?", (o["listing_id"],))
    ex(
        "UPDATE orders SET status=?, done_ts=? WHERE id=?",
        (ns, int(time.time()) if ns == "completed" else None, oid),
    )
    lab = {
        "accepted": "disetujui"
        + (
            ", silakan bayar lewat menu Transaksi"
            if online
            else ", silakan atur titik temu COD lewat chat"
        ),
        "rejected": "ditolak",
        "completed": "selesai",
        "cancelled": "dibatalkan",
    }[ns]
    notify(
        o["buyer_id"] if seller else o["seller_id"], f"Transaksi #{oid} {lab}", "orders"
    )
    return jsonify(status=ns)


# ---------- Laporan & verifikasi admin ----------
@app.post("/api/reports")
@auth()
def report():
    d = body()
    l = q("SELECT * FROM listings WHERE id=?", (d.get("listing_id"),), one=True)
    if not l:
        return jsonify(error="Barang tidak ditemukan"), 404
    if l["seller_id"] == g.user["id"]:
        return jsonify(error="Kamu tidak bisa melaporkan barangmu sendiri"), 403
    if not d.get("reason", "").strip():
        return jsonify(error="Tulis alasan laporan"), 400
    ex(
        "INSERT INTO reports(listing_id,reporter_id,reason,ts) VALUES(?,?,?,?)",
        (l["id"], g.user["id"], d["reason"].strip(), int(time.time())),
    )
    notify_admins(f"Laporan baru untuk barang: {l['title']}")
    return jsonify(ok=True)


@app.get("/api/admin/queue")
@auth(admin=True)
def queue_():
    return jsonify(
        pending=[
            listing_json(r, "Grogol")
            for r in q("SELECT * FROM listings WHERE status='pending' ORDER BY ts")
        ],
        reports=[
            dict(r)
            for r in q(
                "SELECT r.*, l.title, l.status FROM reports r LEFT JOIN listings l ON l.id=r.listing_id ORDER BY r.ts DESC LIMIT 20"
            )
        ],
    )


@app.post("/api/admin/listings/<int:lid>/<act>")
@auth(admin=True)
def admin_act(lid, act):
    l = q("SELECT * FROM listings WHERE id=?", (lid,), one=True)
    if not l or act not in ("approve", "reject"):
        return jsonify(error="Aksi tidak valid"), 400
    reason = body().get("reason", "").strip()
    if act == "reject" and not reason:
        return jsonify(error="Tulis alasan penolakan"), 400
    ex(
        "UPDATE listings SET status=?, reject_reason=? WHERE id=?",
        (
            "active" if act == "approve" else "rejected",
            None if act == "approve" else reason,
            lid,
        ),
    )
    notify(
        l["seller_id"],
        (
            f"Barang '{l['title']}' disetujui dan sekarang tayang"
            if act == "approve"
            else f"Barang '{l['title']}' ditolak: {reason}"
        ),
        "sell",
    )
    return jsonify(ok=True)


@app.get("/api/admin/metrics")
@auth(admin=True)
def metrics():
    n = lambda sql, a=(): q(sql, a, one=True)[0] or 0
    cnt = lambda st: n(
        "SELECT COUNT(*) FROM orders WHERE status IN (%s)" % ",".join("?" * len(st)), st
    )
    done, running, failed = (
        cnt(["completed"]),
        cnt(["requested", "accepted"]),
        cnt(["rejected", "cancelled"]),
    )
    finished = done + failed  # transaksi yang sudah ada hasil akhirnya
    fb = q("SELECT COUNT(*) AS c, AVG(rating) AS a FROM feedback", one=True)
    return jsonify(
        transactions=done,
        running=running,
        failed=failed,
        total=done + running + failed,
        finished=finished,
        success_rate=(
            round(100 * done / finished) if finished else 0
        ),  # selesai / (selesai + ditolak + dibatalkan)
        repeat_buyers=n(
            "SELECT COUNT(*) FROM (SELECT buyer_id FROM orders WHERE status='completed' GROUP BY buyer_id HAVING COUNT(*)>1)"
        ),
        buyers=n(
            "SELECT COUNT(DISTINCT buyer_id) FROM orders WHERE status='completed'"
        ),
        revenue=n("SELECT SUM(fee) FROM orders WHERE status='completed'"),
        gmv=n("SELECT SUM(price) FROM orders WHERE status='completed'"),
        users=n("SELECT COUNT(*) FROM users WHERE role='user'"),
        feedback_count=fb["c"],
        feedback_avg=round(fb["a"], 1) if fb["a"] else 0,
    )


@app.get("/api/admin/orders")
@auth(admin=True)
def admin_orders():
    rows = q(
        """SELECT o.*, l.title, b.name AS buyer, s.name AS seller FROM orders o LEFT JOIN listings l ON l.id=o.listing_id
                LEFT JOIN users b ON b.id=o.buyer_id LEFT JOIN users s ON s.id=o.seller_id ORDER BY o.id DESC LIMIT 200"""
    )
    return jsonify(
        [
            dict(
                id=r["id"],
                title=r["title"] or "(dihapus)",
                buyer=r["buyer"] or "(dihapus)",
                seller=r["seller"] or "(dihapus)",
                price=r["price"],
                fee=r["fee"],
                status=r["status"],
                pay_method=r["pay_method"] or "cod",
                pay_status=r["pay_status"] or "none",
                ts=r["ts"],
                done_ts=r["done_ts"],
            )
            for r in rows
        ]
    )


@app.get("/api/admin/feedback")
@auth(admin=True)
def admin_feedback():
    rows = q(
        "SELECT f.*, u.name, u.segment FROM feedback f LEFT JOIN users u ON u.id=f.user_id ORDER BY f.id DESC LIMIT 200"
    )
    dist = {
        r["rating"]: r["c"]
        for r in q("SELECT rating, COUNT(*) AS c FROM feedback GROUP BY rating")
    }
    avg = q("SELECT AVG(rating) FROM feedback", one=True)[0]
    return jsonify(
        count=sum(dist.values()),
        avg=round(avg, 1) if avg else 0,
        dist=[dist.get(k, 0) for k in (1, 2, 3, 4, 5)],
        items=[
            dict(
                id=r["id"],
                name=r["name"] or "(akun dihapus)",
                segment=r["segment"],
                rating=r["rating"],
                category=r["category"],
                message=r["message"],
                ts=r["ts"],
            )
            for r in rows
        ],
    )


# ---------- URL bersih: /home (bukan /home.html), landing di "/" ----------
STATIC = os.path.join(app.root_path, "static")
PAGES = {f[:-5] for f in os.listdir(STATIC) if f.endswith(".html")} - {"index"}


@app.before_request
def strip_html():  # link lama /home.html?x=1 -> /home?x=1 ; /index.html -> /
    n = request.path.lstrip("/")
    if n.endswith(".html") and "/" not in n and (n[:-5] in PAGES or n == "index.html"):
        qs = request.query_string.decode()
        return redirect(
            ("/" if n == "index.html" else "/" + n[:-5]) + ("?" + qs if qs else ""), 302
        )


@app.get("/")
def index():
    return send_from_directory(STATIC, "index.html")


@app.get("/<page>")
def page(page):
    if page in PAGES:
        return send_from_directory(STATIC, page + ".html")
    if page == "index":
        return redirect("/")
    if os.path.isfile(os.path.join(STATIC, page)):
        return send_from_directory(STATIC, page)  # icon.svg, manifest.json, dll
    abort(404)


init()
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
