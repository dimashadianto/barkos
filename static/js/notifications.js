(async () => {
    const u = await guard(); layout("Notifikasi", null, u, u.role === "admin" ? "admin" : "home");
    $("#body").innerHTML = '<div class="bar"><button class="btn alt sm" id="perm">Aktifkan notifikasi browser</button></div><div id="list"><p class="mut">Memuat…</p></div>';
    const perm = $("#perm"); if (!("Notification" in window) || Notification.permission === "granted") perm.hidden = true;
    perm.onclick = async () => { const r = await Notification.requestPermission(); perm.hidden = r === "granted"; toast(r === "granted" ? "Notifikasi browser aktif" : "Izin notifikasi ditolak") };
    try {
        const N = await api("GET", "/notifications"); $("#list").innerHTML = N.length ? N.map(n => `<a class="card n ${n.read ? "" : "new"}" href="${esc((n.link || "#").replace(/\.html(?=\?|$)/, ""))}">${esc(n.text)}<small>${new Date(n.ts * 1000).toLocaleString("id-ID")}</small></a>`).join("") : '<div class="card mut">Belum ada notifikasi.</div>';
        await api("POST", "/notifications/read"); const b = $("#nb"); if (b) b.hidden = true
    } catch (x) { toast(x.message) }
})();
