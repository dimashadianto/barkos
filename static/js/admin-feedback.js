(async () => {
    const u = await guard({ admin: true }); layout("Feedback", "admin-feedback", u);
    const stars = n => `<span class="stars" role="img" aria-label="${n} dari 5">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
    let D, topic = "";
    function draw() {
        const T = [...new Set(D.items.map(i => i.category))], L = D.items.filter(i => !topic || i.category === topic), mx = Math.max(1, ...D.dist);
        $("#body").innerHTML = D.count ? `<div class="card sum"><div><div class="avg">${D.avg}<small> / 5</small></div>${stars(Math.round(D.avg))}<div class="mut">${D.count} feedback</div></div>
 <div class="dist">${[5, 4, 3, 2, 1].map(n => `<div class="dr"><span>${n}★</span><div class="bar"><i style="width:${D.dist[n - 1] / mx * 100}%"></i></div><span>${D.dist[n - 1]}</span></div>`).join("")}</div></div>
 <div class="chips" role="group" aria-label="Filter topik">${["", ...T].map(t => `<button class="chip ${topic === t ? "on" : ""}" data-t="${esc(t)}" aria-pressed="${topic === t}">${esc(t) || "Semua topik"}</button>`).join("")}</div>
 ${L.map(i => `<div class="card"><div class="fh"><b>${esc(i.name)}${i.segment ? ` <span class="mut">· ${esc(i.segment)}</span>` : ""}</b>${stars(i.rating)}</div>
 <div class="mut"><span class="st">${esc(i.category)}</span> ${fmtDate(i.ts)}</div><p class="fm">${esc(i.message)}</p></div>`).join("")}`
            : '<div class="card mut">Belum ada feedback dari pengguna.</div>';
        document.querySelectorAll(".chip").forEach(b => b.onclick = () => { topic = b.dataset.t; draw() })
    }
    try { $("#body").innerHTML = '<p class="mut">Memuat…</p>'; D = await api("GET", "/admin/feedback"); draw() } catch (x) { toast(x.message) }
})();
