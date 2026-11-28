/* Landing: arahkan pengguna yang sudah login, animasi muncul saat scroll, bayangan header. */
(async () => {
    if (!token()) return;
    try {
        const r = await fetch("/api/me", { headers: { Authorization: "Bearer " + token() } });
        if (r.ok) { const u = await r.json(); location.replace(u.role === "admin" ? "admin" : "home") }
        else localStorage.removeItem("bk_t")
    } catch { }
})();
const bar = $(".sbar"), onScroll = () => bar.classList.toggle("sh", scrollY > 8); addEventListener("scroll", onScroll, { passive: true }); onScroll();
const rv = document.querySelectorAll(".rv");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target) } }), { threshold: .15 });
    rv.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(e) });
} else rv.forEach(e => e.classList.add("in"));

/* Menu Cara kerja / Fitur / Keamanan: scroll halus TANPA menambah #hash di address bar (URL tetap "/"). */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, beh = reduce ? "auto" : "smooth";
function goTo(id, focus) {
    if (id === "top") { scrollTo({ top: 0, behavior: beh }); return true }
    const t = document.getElementById(id); if (!t) return false;
    t.scrollIntoView({ behavior: beh, block: "start" });
    if (focus) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }) } return true
}
document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    if (goTo(a.getAttribute("href").slice(1), a.classList.contains("skip"))) e.preventDefault()
});
if (location.hash) {
    const id = location.hash.slice(1);   // link lama /#aman: scroll lalu bersihkan URL
    setTimeout(() => { goTo(id); history.replaceState(null, "", location.pathname + location.search) }, 60)
}
