(async () => {
    const u = await guard({ user: true }); layout("Jelajah", "home", u); const f = { q: "", category: "", radius: "", sort: "near" };
    $("#body").innerHTML = `<p class="mut">Jarak dihitung dari ${esc(u.area)}. Hanya barang yang sudah diverifikasi admin yang tampil.</p>
<a class="saved-link" href="wishlist">${ic("heart", 18)} Barang disimpan</a>
<input id="q" type="search" placeholder="Cari kipas, meja, rak…" aria-label="Cari barang"><div class="chips" id="chips"></div>
<div class="row"><select id="rad" aria-label="Radius">${[["", "Semua jarak"], [3, "≤ 3 km"], [8, "≤ 8 km"], [15, "≤ 15 km"]].map(r => `<option value="${r[0]}">${r[1]}</option>`).join("")}</select>
<select id="sort" aria-label="Urutan"><option value="near">Terdekat</option><option value="">Terbaru</option></select></div><div id="list" class="grid" style="margin-top:12px"></div>`;
    const chips = () => { $("#chips").innerHTML = ["", ...CATS].map(c => `<button class="chip ${f.category === c ? "on" : ""}" data-c="${c}">${c || "Semua"}</button>`).join(""); document.querySelectorAll(".chip").forEach(b => b.onclick = () => { f.category = b.dataset.c; chips(); load() }) };
    async function load() {
        $("#list").innerHTML = '<p class="mut">Memuat…</p>'; try {
            const L = await api("GET", "/listings?" + new URLSearchParams(f));
            $("#list").innerHTML = L.length ? L.map(l => `<a class="card item" href="product?id=${l.id}">${l.photo ? `<img class="ph" src="${l.photo}" alt="">` : '<div class="ph"></div>'}<div><b>${esc(l.title)}</b><div class="mut">${esc(l.area)} · ${l.km} km · ${esc(l.cond)}</div><span class="tag">${rp(l.price)}</span> ${l.cod ? '<span class="st">COD</span>' : ""}</div></a>`).join("") : '<div class="card mut">Belum ada barang yang cocok. Perbesar radius atau coba kata kunci lain.</div>'
        } catch (x) { toast(x.message) }
    }
    $("#q").onchange = e => { f.q = e.target.value; load() }; $("#rad").onchange = e => { f.radius = e.target.value; load() }; $("#sort").onchange = e => { f.sort = e.target.value; load() }; chips(); load()
})();
