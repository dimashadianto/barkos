(async () => {
    const u = await guard({ admin: true }); layout("Transaksi", "admin-orders", u);
    const lb = { requested: ["Menunggu penjual", "warn"], accepted: ["Disetujui", "warn"], completed: ["Selesai", "ok"], rejected: ["Ditolak", "bad"], cancelled: ["Dibatalkan", ""] };
    const ps = { unpaid: "Belum dibayar", pending: "Menunggu pembayaran", paid: "Sudah dibayar", released: "Dana dicairkan ke penjual" };
    const grp = s => s === "completed" ? "completed" : ["requested", "accepted"].includes(s) ? "running" : "failed";
    const FIL = [["", "Semua"], ["running", "Berjalan"], ["completed", "Selesai"], ["failed", "Ditolak / dibatalkan"]]; let f = "", all = [], M = {};
    function draw() {
        const L = all.filter(o => !f || grp(o.status) === f);
        $("#body").innerHTML = `<div class="stats">${statCard(M.total, "Total transaksi")}${statCard(M.transactions, "Selesai")}${statCard(M.running, "Sedang berjalan", "menunggu / disetujui")}${statCard(M.failed, "Ditolak / dibatalkan")}
 ${statCard(M.finished ? M.success_rate + "%" : "–", "Tingkat keberhasilan", "selesai ÷ (selesai + ditolak + dibatalkan)")}${statCard(M.repeat_buyers, "Pembeli berulang", "beli ≥ 2 kali sampai selesai")}${statCard(rp(M.gmv), "Nilai transaksi selesai")}${statCard(rp(M.revenue), "Pendapatan biaya layanan")}</div>
 <h3 class="sec-t">Riwayat transaksi</h3><div class="chips" role="group" aria-label="Filter status">${FIL.map(x => `<button class="chip ${f === x[0] ? "on" : ""}" data-f="${x[0]}" aria-pressed="${f === x[0]}">${x[1]}</button>`).join("")}</div>
 ${L.map(o => {
            const s = lb[o.status] || [o.status, ""], on = o.pay_method === "online";
            return `<div class="card"><div class="oh"><b>${esc(o.title)}</b><span class="st ${s[1]}">${s[0]}</span></div>
  <div class="meta">#${o.id} · ${esc(o.buyer)} (pembeli) → ${esc(o.seller)} (penjual)</div>
  <div class="amt"><span class="tag">${rp(o.price)}</span><span class="st">${on ? "Bayar online" : "COD"}</span>${on && ps[o.pay_status] ? `<span class="st">${ps[o.pay_status]}</span>` : ""}<span class="mut">biaya layanan ${rp(o.fee)}</span></div>
  <div class="meta">Diajukan ${fmtDate(o.ts)}${o.status === "completed" ? ` · Selesai ${fmtDate(o.done_ts)}` : ""}</div></div>`
        }).join("") || '<div class="card mut">Belum ada transaksi pada filter ini.</div>'}`;
        document.querySelectorAll(".chip").forEach(b => b.onclick = () => { f = b.dataset.f; draw() })
    }
    try { $("#body").innerHTML = '<p class="mut">Memuat…</p>';[M, all] = await Promise.all([api("GET", "/admin/metrics"), api("GET", "/admin/orders")]); draw() } catch (x) { toast(x.message) }
})();
