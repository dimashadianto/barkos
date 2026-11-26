const AREAS = ["Tanjung Duren", "Grogol", "Slipi", "Kebon Jeruk", "Kelapa Gading", "Bekasi Barat"], CATS = ["Furniture", "Elektronik", "Dapur", "Kasur & Rak", "Lainnya"];
const $ = (s, r = document) => r.querySelector(s), qs = new URLSearchParams(location.search);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])), rp = n => "Rp" + Number(n).toLocaleString("id-ID");
const token = () => localStorage.getItem("bk_t");
async function api(m, u, b) {
    const r = await fetch("/api" + u, { method: m, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() }, body: b === undefined ? undefined : JSON.stringify(b) });
    const d = await r.json().catch(() => ({})); if (r.status === 401 && token()) { localStorage.removeItem("bk_t"); location.href = "login.html"; throw Error(d.error || "Sesi berakhir") }
    if (!r.ok) throw Error(d.error || "Terjadi kesalahan"); return d
}
function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.append(e); setTimeout(() => e.remove(), 2800) }
function logout() { localStorage.removeItem("bk_t"); sessionStorage.clear(); location.href = "login.html" }
async function guard(o = {}) {
    if (!token()) { location.href = "login.html"; throw 0 } const u = await api("GET", "/me");
    if (o.admin && u.role !== "admin") { location.href = "home.html"; throw 0 } if (o.user && u.role === "admin") { location.href = "admin.html"; throw 0 } return u
}
function layout(title, active, u, back) {
    const adm = u.role === "admin", L = adm ? [["admin", "admin.html", "🛡️ Verifikasi"], ["notifications", "notifications.html", "🔔 Notifikasi"], ["profile", "profile.html", "👤 Profil"]]
        : [["home", "home.html", "🏠 Jelajah"], ["sell", "sell.html", "🏷️ Jual"], ["chats", "chats.html", "💬 Chat"], ["orders", "orders.html", "🤝 Transaksi"], ["profile", "profile.html", "👤 Profil"]];
    $("#app").className = "app"; $("#app").innerHTML = `<header class="hd">${back ? `<a class="back" href="${back}" aria-label="Kembali">←</a>` : ""}<h1>${title}</h1><a class="bell" href="notifications.html" aria-label="Notifikasi">🔔<b id="nb" hidden>0</b></a></header><main class="scr" id="body"></main>
 ${active ? `<nav class="nav" aria-label="Menu utama">${L.map(l => `<a href="${l[1]}" class="${l[0] === active ? "on" : ""}">${l[2]}</a>`).join("")}</nav>` : ""}`; pollNotif()
}
async function pollNotif() {
    try {
        const c = await api("GET", "/notifications/count"), b = $("#nb"); if (b) { b.hidden = !c.unread; b.textContent = c.unread > 9 ? "9+" : c.unread }
        const last = +(sessionStorage.getItem("bk_ln") || 0); if (c.latest && c.latest.id > last) { if (last && "Notification" in window && Notification.permission === "granted") new Notification("BarKos", { body: c.latest.text }); sessionStorage.setItem("bk_ln", c.latest.id) }
    } catch { } setTimeout(pollNotif, 8000)
}
