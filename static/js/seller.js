(async () => {
    const u = await guard(); layout("Profil penjual", null, u, "javascript:history.back()");
    let S; try { S = await api("GET", `/users/${+qs.get("id")}/reviews`) } catch (x) { $("#body").innerHTML = `<p class="err">${esc(x.message)}</p>`; return }
    $("#body").innerHTML = `<div class="who"><div class="av" aria-hidden="true">${esc((S.name[0] || "?").toUpperCase())}</div><div><h2>${esc(S.name)}</h2><span class="mut">${S.sold} barang terjual lewat BarKos</span></div></div>
<div class="score card">${S.count ? `<b>${S.avg}</b><div>${stars(S.avg)}<div class="mut">dari ${S.count} ulasan pembeli</div></div>` : '<p class="mut" style="margin:0">Penjual ini belum punya ulasan.</p>'}</div>
<h3>Ulasan</h3>${S.items.map(r => `<div class="card rv"><div class="row"><b>${esc(r.reviewer)}</b><span class="mut" style="text-align:right">${fmtDate(r.ts)}</span></div>${stars(r.rating)}<div class="mut">Beli: ${esc(r.title)}</div>${r.comment ? `<p>${esc(r.comment)}</p>` : ""}</div>`).join("") || '<p class="mut">Belum ada ulasan.</p>'}`;
})();
