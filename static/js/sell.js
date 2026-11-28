(async () => {
    const u = await guard({ user: true }); layout("Jual barang", "sell", u);
    $("#body").innerHTML = `<div class="hint">Setiap barang diperiksa AI lalu <b>diverifikasi admin</b> dulu. Barang baru tayang setelah disetujui.</div>
<form id="f"><label>Foto barang<input name="photo" id="pf" type="file" accept="image/*"></label><img id="pv" class="pv" alt="" hidden>
<label>Nama barang<input name="title" required></label><label>Kategori<select name="category">${CATS.map(c => `<option>${c}</option>`).join("")}</select></label>
<label>Harga (Rp)<input name="price" type="number" min="1000" required inputmode="numeric"></label>
<label>Kondisi<select name="cond"><option>Seperti baru</option><option selected>Baik</option><option>Cukup baik</option></select></label>
<label>Lokasi barang<select name="area">${AREAS.map(a => `<option ${a === u.area ? "selected" : ""}>${a}</option>`).join("")}</select></label>
<label>Deskripsi<textarea name="descr" rows="3"></textarea></label><label class="chk"><input type="checkbox" name="cod" checked> Bisa COD</label>
<div class="err" id="err" role="alert"></div><button class="btn">Kirim untuk diverifikasi</button></form><h3 style="margin:28px 0 8px">Barang saya</h3><div id="mine"></div>`;
    const shrink = f => new Promise(r => { if (!f || !f.size) return r(null); const i = new Image; i.onload = () => { const k = Math.min(1, 480 / i.width), c = document.createElement("canvas"); c.width = i.width * k; c.height = i.height * k; c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); r(c.toDataURL("image/jpeg", .7)) }; i.src = URL.createObjectURL(f) });
    $("#pf").onchange = async e => { const d = await shrink(e.target.files[0]); $("#pv").hidden = !d; if (d) $("#pv").src = d };
    const lab = { pending: ["Menunggu verifikasi", "warn"], active: ["Tayang", "ok"], rejected: ["Ditolak", "bad"], sold: ["Terjual", ""] };
    async function mine() {
        const L = await api("GET", "/my/listings"); $("#mine").innerHTML = L.length ? L.map(l => `<div class="card mine"><a href="product?id=${l.id}"><b>${esc(l.title)}</b> <span class="st ${lab[l.status][1]}">${lab[l.status][0]}</span>
<div class="mut">${rp(l.price)}${l.reject_reason ? ` · Ditolak: ${esc(l.reject_reason)}` : ""}</div></a></div>`).join("") : '<p class="mut">Belum ada barang yang kamu pasang.</p>'
    }
    $("#f").onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target), b = Object.fromEntries(fd); b.cod = fd.has("cod"); b.photo = await shrink(fd.get("photo")); delete b.photo_file;
        try { await api("POST", "/listings", b); toast("Terkirim. Menunggu verifikasi admin."); e.target.reset(); $("#pv").hidden = true; mine() } catch (x) { $("#err").textContent = x.message }
    }; mine()
})();
