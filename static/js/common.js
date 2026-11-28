const AREAS = ["Tanjung Duren", "Grogol", "Slipi", "Kebon Jeruk", "Kelapa Gading", "Bekasi Barat"], CATS = ["Furniture", "Elektronik", "Dapur", "Kasur & Rak", "Lainnya"];
const $ = (s, r = document) => r.querySelector(s), qs = new URLSearchParams(location.search);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])), rp = n => "Rp" + Number(n).toLocaleString("id-ID");
/* ---- Set icon SVG (stroke 1.8, 24x24) menggantikan emoji ---- */
const ICONS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.2 5-5 2.2 2.2-5z"/>',
    tag: '<path d="M3 3.5h8.2L21 13.3 13.3 21 3 10.7z"/><circle cx="7.4" cy="7.4" r="1.3"/>',
    chat: '<path d="M4 5h16v11h-9.5L7 19.5V16H4z"/>',
    swap: '<path d="M4 8h14m0 0-3.5-3.5M18 8l-3.5 3.5"/><path d="M20 16H6m0 0 3.5-3.5M6 16l3.5 3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.5"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 21h4"/>',
    star: '<path d="m12 3.5 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z"/>',
    pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    wallet: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5z"/><path d="M16 13.5h.01"/>',
    box: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16 9.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    chart: '<path d="M4 20V11M10 20V4M16 20v-6M3 20h18"/>',
    back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sofa: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12.5a2 2 0 0 1 4 0V15h10v-2.5a2 2 0 0 1 4 0V18H3z"/><path d="M6 18v2M18 18v2"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    key: '<circle cx="8" cy="14" r="4"/><path d="m11 11 8.5-8.5M16 6l2.5 2.5M14 8l2 2"/>'
};
const ic = (n, s = 22) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
function hydrateIcons(r = document) { r.querySelectorAll("[data-ic]").forEach(e => { e.innerHTML = ic(e.dataset.ic, +e.dataset.s || 22); e.removeAttribute("data-ic") }) }
document.addEventListener("DOMContentLoaded", () => hydrateIcons());
const token = () => localStorage.getItem("bk_t");
async function api(m, u, b) {
    const r = await fetch("/api" + u, { method: m, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() }, body: b === undefined ? undefined : JSON.stringify(b) });
    const d = await r.json().catch(() => ({})); if (r.status === 401 && token()) { localStorage.removeItem("bk_t"); location.href = "login"; throw Error(d.error || "Sesi berakhir") }
    if (!r.ok) throw Error(d.error || "Terjadi kesalahan"); return d
}
function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.append(e); setTimeout(() => e.remove(), 2800) }
function logout() { localStorage.removeItem("bk_t"); sessionStorage.clear(); location.href = "login" }
async function guard(o = {}) {
    if (!token()) { location.href = "login"; throw 0 } const u = await api("GET", "/me");
    if (o.admin && u.role !== "admin") { location.href = "home"; throw 0 } if (o.user && u.role === "admin") { location.href = "admin"; throw 0 } return u
}
function layout(title, active, u, back) {
    const adm = u.role === "admin", L = adm ? [["admin", "admin", "Verifikasi", "shield"], ["admin-orders", "admin-orders", "Transaksi", "swap"], ["admin-feedback", "admin-feedback", "Feedback", "star"], ["notifications", "notifications", "Notifikasi", "bell"], ["profile", "profile", "Profil", "user"]]
        : [["home", "home", "Jelajah", "compass"], ["sell", "sell", "Jual", "tag"], ["chats", "chats", "Chat", "chat"], ["orders", "orders", "Transaksi", "swap"], ["profile", "profile", "Profil", "user"]];
    $("#app").className = "app"; $("#app").innerHTML = `<header class="hd">${back ? `<a class="back" href="${back}" aria-label="Kembali">${ic("back", 24)}</a>` : ""}<h1>${title}</h1><a class="bell" href="notifications" aria-label="Notifikasi">${ic("bell", 24)}<b id="nb" hidden>0</b></a></header><main class="scr" id="body"></main>
 ${active ? `<nav class="nav" aria-label="Menu utama">${L.map(l => `<a href="${l[1]}" class="${l[0] === active ? "on" : ""}" ${l[0] === active ? 'aria-current="page"' : ""}>${ic(l[3], 22)}<span>${l[2]}</span></a>`).join("")}</nav>` : ""}`; pollNotif()
}
async function pollNotif() {
    try {
        const c = await api("GET", "/notifications/count"), b = $("#nb"); if (b) { b.hidden = !c.unread; b.textContent = c.unread > 9 ? "9+" : c.unread }
        const last = +(sessionStorage.getItem("bk_ln") || 0); if (c.latest && c.latest.id > last) { if (last && "Notification" in window && Notification.permission === "granted") new Notification("BarKos", { body: c.latest.text }); sessionStorage.setItem("bk_ln", c.latest.id) }
    } catch { } setTimeout(pollNotif, 8000)
}

const statCard = (v, l, s = "") => `<div class="stat"><b>${v}</b><span>${l}</span>${s ? `<small>${s}</small>` : ""}</div>`;
const fmtDate = ts => ts ? new Date(ts * 1000).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

/* Modal dialog (pengganti alert/confirm). Mengembalikan Promise berisi value tombol yang dipilih (undefined jika ditutup dengan Esc). */
function modal({ icon = "check", tone = "ok", title, text = "", actions = [{ label: "OK", value: true }] }) {
    return new Promise(res => {
        const d = document.createElement("dialog"); d.className = "modal"; d.setAttribute("aria-labelledby", "m-t"); d.setAttribute("aria-describedby", "m-x");
        d.innerHTML = `<div class="m-ic ${tone}">${ic(icon, 34)}</div><h2 id="m-t">${esc(title)}</h2><p id="m-x" class="mut">${esc(text)}</p><div class="m-act">${actions.map((a, i) => `<button class="btn ${a.cls || ""}" data-i="${i}">${esc(a.label)}</button>`).join("")}</div>`;
        document.body.append(d); let val;
        d.querySelectorAll("button").forEach(b => b.onclick = () => { val = actions[+b.dataset.i].value; d.close() });
        d.addEventListener("close", () => { d.remove(); res(val) });
        d.showModal();
    });
}

/* Bintang rating: stars(4.5) -> ★★★★☆ (dibulatkan), dipakai di produk, profil penjual, ulasan */
const stars = n => { const r = Math.round(n); return `<span class="stars" aria-label="${n} dari 5 bintang">${"★".repeat(r)}<span class="off">${"★".repeat(5 - r)}</span></span>` };
/* Perkecil foto di HP sebelum diupload (sisi terpanjang maks `max` px, JPEG) */
const shrinkImg = (f, max = 1080) => new Promise(res => {
    if (!f || !f.size) return res(null); const i = new Image;
    i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas"); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k); c.getContext("2d").drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(i.src); res(c.toDataURL("image/jpeg", .78)) };
    i.onerror = () => res(null); i.src = URL.createObjectURL(f)
});

function openFeedback() {
    const d = document.createElement("dialog"); d.className = "modal rvm"; d.setAttribute("aria-labelledby", "fb-t"); let r = 0;
    d.innerHTML = `<h2 id="fb-t">Kirim feedback</h2><p class="mut">Ceritakan pengalamanmu supaya BarKos bisa lebih baik.</p>
<div class="pick" role="radiogroup" aria-label="Penilaian">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" aria-label="${n} bintang" data-n="${n}">★</button>`).join("")}</div>
<select id="fbc" aria-label="Topik"><option>umum</option><option>pencarian</option><option>transaksi</option><option>verifikasi</option><option>keamanan</option></select>
<textarea id="fbm" rows="4" maxlength="500" placeholder="Tulis pesanmu"></textarea><div class="err" id="fbe" role="alert"></div>
<div class="m-act"><button class="btn alt" data-x>Batal</button><button class="btn" data-ok>Kirim feedback</button></div>`;
    document.body.append(d); const B = [...d.querySelectorAll(".pick button")], err = d.querySelector("#fbe");
    B.forEach(b => b.onclick = () => { r = +b.dataset.n; B.forEach(x => { x.classList.toggle("on", +x.dataset.n <= r); x.setAttribute("aria-checked", +x.dataset.n === r) }) });
    d.querySelector("[data-x]").onclick = () => d.close();
    d.querySelector("[data-ok]").onclick = async () => {
        const m = d.querySelector("#fbm").value.trim();
        if (!r) { err.textContent = "Pilih jumlah bintang dulu"; return }
        if (!m) { err.textContent = "Tulis pesan dulu"; return }
        try { await api("POST", "/feedback", { rating: r, category: d.querySelector("#fbc").value, message: m }); d.close(); toast("Terima kasih, feedback terkirim") } catch (x) { err.textContent = x.message }
    };
    d.addEventListener("close", () => d.remove()); d.showModal();
}