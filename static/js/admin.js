(async () => {
    const u = await guard({ admin: true }); layout("Verifikasi", "admin", u);
    async function load() {
        $("#body").innerHTML = '<p class="mut">Memuat…</p>'; const [Q, M] = await Promise.all([api("GET", "/admin/queue"), api("GET", "/admin/metrics")]);
        $("#body").innerHTML = `<div class="stats">${statCard(M.transactions, "Transaksi selesai", M.total + " transaksi tercatat")}${statCard(M.finished ? M.success_rate + "%" : "–", "Transaksi berhasil", M.finished ? "dari " + M.finished + " yang sudah ada hasilnya" : "belum ada yang selesai/ditolak")}${statCard(M.repeat_buyers, "Pembeli berulang", "dari " + M.buyers + " pembeli yang pernah selesai")}${statCard(M.users, "Pengguna", "terdaftar")}</div>
 <p><a href="admin-orders">Lihat semua transaksi →</a> · <a href="admin-feedback">Lihat feedback (${M.feedback_count}) →</a></p>
 <h3>Antrean verifikasi (${Q.pending.length})</h3>${Q.pending.map(l => `<div class="card q">${l.photo ? `<img src="${l.photo}" alt="">` : ""}<b>${esc(l.title)}</b> · ${rp(l.price)}<div class="mut">${esc(l.seller)} · ${esc(l.area)} · ${esc(l.cond)}<br>${esc(l.descr)}</div>
 <p><span class="st ${l.ai_note.startsWith("Aman") ? "ok" : "warn"}">AI</span> ${esc(l.ai_note)}</p><input placeholder="Alasan (wajib jika menolak)" id="r${l.id}" aria-label="Alasan penolakan">
 <div class="row"><button class="btn sm" data-id="${l.id}" data-a="approve">Setujui</button><button class="btn sm bad" data-id="${l.id}" data-a="reject">Tolak</button></div></div>`).join("") || '<p class="mut">Tidak ada antrean. Semua barang sudah diverifikasi.</p>'}
 <h3>Laporan pengguna</h3>${Q.reports.map(r => `<div class="card q"><b>${esc(r.title || "(barang dihapus)")}</b> <span class="st">${esc(r.status || "")}</span><div class="mut">${esc(r.reason)}</div>${r.status === "active" ? `<input placeholder="Alasan menurunkan barang" id="r${r.listing_id}" aria-label="Alasan"><div class="row"><button class="btn sm bad" data-id="${r.listing_id}" data-a="reject">Turunkan barang</button></div>` : ""}</div>`).join("") || '<p class="mut">Belum ada laporan.</p>'}`;
        document.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { try { await api("POST", `/admin/listings/${b.dataset.id}/${b.dataset.a}`, { reason: ($("#r" + b.dataset.id) || {}).value || "" }); load() } catch (x) { toast(x.message) } })
    }
    load()
})();
