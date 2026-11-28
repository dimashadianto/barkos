(async () => {
    const u = await guard(); let l; try { l = await api("GET", "/listings/" + qs.get("id")) } catch (x) { layout("Barang", null, u, "home"); $("#body").innerHTML = `<p class="err">${esc(x.message)}</p>`; return }
    layout("Detail barang", null, u, u.role === "admin" ? "admin" : l.mine ? "sell" : "home");
    const stat = { pending: ["Menunggu verifikasi admin", "warn"], active: ["Tayang", "ok"], rejected: ["Ditolak", "bad"], sold: ["Terjual", ""] }[l.status];
    const R = l.seller_rating, canSave = !l.mine && u.role !== "admin" && l.status === "active";
    let acts = "";
    if (l.mine) acts = `<div class="notice">Ini barang milikmu. Kamu tidak bisa membeli, chat, atau melaporkan barangmu sendiri.</div>${l.status !== "sold" ? `<a class="btn alt icbtn" style="justify-content:center" href="sell?edit=${l.id}">${ic("edit", 18)}Edit barang</a>` : ""}`;
    else if (u.role !== "admin" && l.status === "active") acts = `<div class="acts"><fieldset class="pm"><legend>Metode pembayaran</legend>
${l.cod ? '<label><input type="radio" name="pm" value="cod" checked> COD, bayar di tempat saat bertemu</label>' : ""}<label><input type="radio" name="pm" value="online" ${l.cod ? "" : "checked"}> Bayar online (transfer bank / e-wallet)</label></fieldset><button class="btn" id="buy">Ajukan beli</button>
<a class="btn alt" href="chatroom?l=${l.id}&w=${l.seller_id}&t=${encodeURIComponent(l.title)}">Chat penjual</a>
<details><summary>Laporkan barang ini</summary><textarea id="why" rows="3" placeholder="Jelaskan masalahnya"></textarea><button class="btn bad" id="rep">Kirim laporan</button></details></div>`;
    const P = l.photos || [];
    const gallery = P.length ? `<div class="gal"><div class="gtrack" id="gt">${P.map((p, i) => `<img class="pic" src="${p}" alt="Foto ${i + 1} dari ${P.length}: ${esc(l.title)}">`).join("")}</div>${P.length > 1 ? `<div class="dots" id="dots">${P.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Foto ${i + 1}"></button>`).join("")}</div>` : ""}</div>` : "";
    $("#body").innerHTML = `${gallery}<div class="ttl"><h2>${esc(l.title)}</h2>${canSave ? `<button class="save ${l.saved ? "on" : ""}" id="save" aria-pressed="${l.saved}" aria-label="Simpan barang">${ic("heart", 24)}</button>` : ""}</div>
<p class="mut">${esc(l.area)}${l.km !== undefined ? ` · ${l.km} km` : ""} · Kondisi ${esc(l.cond)}</p>
<a class="seller card" href="seller?id=${l.seller_id}"><div class="av" aria-hidden="true">${esc((l.seller[0] || "?").toUpperCase())}</div><div><b>${esc(l.seller)}</b><div class="mut">${R.count ? `${stars(R.avg)} ${R.avg} · ${R.count} ulasan` : "Belum ada ulasan"}</div></div>${ic("arrow", 20)}</a>
<p><span class="tag">${rp(l.price)}</span> ${l.cod ? '<span class="st">COD</span>' : ""} <span class="st ${stat[1]}">${stat[0]}</span></p>
<p>${esc(l.descr) || "Tidak ada deskripsi."}</p><p class="mut">${esc(l.ai_note)}</p>${l.reject_reason ? `<p class="err">Alasan penolakan: ${esc(l.reject_reason)}</p>` : ""}${acts}`;
    if ($("#dots")) {
        const gt = $("#gt"), D = [...document.querySelectorAll("#dots button")];
        D.forEach(b => b.onclick = () => gt.scrollTo({ left: gt.clientWidth * +b.dataset.i, behavior: "smooth" }));
        gt.onscroll = () => { const i = Math.round(gt.scrollLeft / gt.clientWidth); D.forEach((b, j) => b.classList.toggle("on", i === j)) };
    }
    if ($("#save")) $("#save").onclick = async () => {
        const b = $("#save"), on = !b.classList.contains("on");
        try { await api(on ? "POST" : "DELETE", "/wishlist/" + l.id); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); toast(on ? "Disimpan ke daftar simpanan" : "Dihapus dari simpanan") } catch (x) { toast(x.message) }
    };
    if ($("#buy")) $("#buy").onclick = async () => { try { await api("POST", "/orders", { listing_id: l.id, pay_method: document.querySelector("[name=pm]:checked").value }); toast("Pengajuan terkirim ke penjual"); setTimeout(() => location.href = "orders", 900) } catch (x) { toast(x.message) } };
    if ($("#rep")) $("#rep").onclick = async () => { try { await api("POST", "/reports", { listing_id: l.id, reason: $("#why").value }); toast("Laporan diterima tim verifikasi"); $("#why").value = "" } catch (x) { toast(x.message) } }
})();
