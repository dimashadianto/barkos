(async () => {
    const u = await guard(); let l; try { l = await api("GET", "/listings/" + qs.get("id")) } catch (x) { layout("Barang", null, u, "home.html"); $("#body").innerHTML = `<p class="err">${esc(x.message)}</p>`; return }
    layout("Detail barang", null, u, u.role === "admin" ? "admin.html" : l.mine ? "sell.html" : "home.html");
    const stat = { pending: ["Menunggu verifikasi admin", "warn"], active: ["Tayang", "ok"], rejected: ["Ditolak", "bad"], sold: ["Terjual", ""] }[l.status];
    let acts = "";
    if (l.mine) acts = `<div class="notice">Ini barang milikmu. Kamu tidak bisa membeli, chat, atau melaporkan barangmu sendiri.</div>`;
    else if (u.role !== "admin" && l.status === "active") acts = `<div class="acts"><fieldset class="pm"><legend>Metode pembayaran</legend>
${l.cod ? '<label><input type="radio" name="pm" value="cod" checked> COD, bayar di tempat saat bertemu</label>' : ""}<label><input type="radio" name="pm" value="online" ${l.cod ? "" : "checked"}> Bayar online (transfer bank / e-wallet)</label></fieldset><button class="btn" id="buy">Ajukan beli</button>
<a class="btn alt" href="chatroom.html?l=${l.id}&w=${l.seller_id}&t=${encodeURIComponent(l.title)}">Chat penjual</a>
<details><summary>Laporkan barang ini</summary><textarea id="why" rows="3" placeholder="Jelaskan masalahnya"></textarea><button class="btn bad" id="rep">Kirim laporan</button></details></div>`;
    $("#body").innerHTML = `${l.photo ? `<img class="pic" src="${l.photo}" alt="Foto ${esc(l.title)}">` : ""}<h2>${esc(l.title)}</h2>
<p class="mut">${esc(l.area)}${l.km !== undefined ? ` · ${l.km} km` : ""} · Kondisi ${esc(l.cond)} · Penjual: ${esc(l.seller)}</p>
<p><span class="tag">${rp(l.price)}</span> ${l.cod ? '<span class="st">COD</span>' : ""} <span class="st ${stat[1]}">${stat[0]}</span></p>
<p>${esc(l.descr) || "Tidak ada deskripsi."}</p><p class="mut">${esc(l.ai_note)}</p>${l.reject_reason ? `<p class="err">Alasan penolakan: ${esc(l.reject_reason)}</p>` : ""}${acts}`;
    if ($("#buy")) $("#buy").onclick = async () => { try { await api("POST", "/orders", { listing_id: l.id, pay_method: document.querySelector("[name=pm]:checked").value }); toast("Pengajuan terkirim ke penjual"); setTimeout(() => location.href = "orders.html", 900) } catch (x) { toast(x.message) } };
    if ($("#rep")) $("#rep").onclick = async () => { try { await api("POST", "/reports", { listing_id: l.id, reason: $("#why").value }); toast("Laporan diterima tim verifikasi"); $("#why").value = "" } catch (x) { toast(x.message) } }
})();
