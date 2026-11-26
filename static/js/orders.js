(async () => {
    const u = await guard({ user: true }); layout("Transaksi", "orders", u);
    const lb = o => {
        const on = o.pay_method === "online", p = o.pay_status; if (o.status === "accepted" && on) return p === "paid" ? ["Dibayar, menunggu barang diterima", "ok"] : p === "pending" ? ["Menunggu pembayaran masuk", "warn"] : ["Disetujui, menunggu pembayaran", "warn"];
        return { requested: ["Menunggu persetujuan", "warn"], accepted: ["Disetujui, ketemu & COD", "ok"], completed: ["Selesai", "ok"], rejected: ["Ditolak", "bad"], cancelled: ["Dibatalkan", ""] }[o.status]
    };
    async function load() {
        $("#body").innerHTML = '<p class="mut">Memuat…</p>'; const O = await api("GET", "/orders");
        $("#body").innerHTML = O.length ? O.map(o => {
            const s = o.role === "penjual", on = o.pay_method === "online", a = [], L = lb(o);
            if (s && o.status === "requested") a.push(["accept", "Setujui", ""], ["reject", "Tolak", "alt"]);
            if (o.status === "accepted") { if (!on && s) a.push(["complete", "Tandai selesai", ""]); if (on && !s && o.pay_status === "paid") a.push(["complete", "Barang diterima", ""]) }
            if (["requested", "accepted"].includes(o.status) && !["paid", "released"].includes(o.pay_status)) a.push(["cancel", "Batalkan", "alt"]);
            const other = s ? o.buyer_id : o.seller_id, pay = o.status === "accepted" && on && !s && o.pay_status !== "paid" ? `<a class="btn sm" href="pay.html?order=${o.id}">${o.pay_status === "pending" ? "Lihat tagihan" : "Bayar sekarang"}</a>` : "";
            const note = o.status === "accepted" && on && s ? (o.pay_status === "paid" ? "Sudah dibayar. Serahkan barang; dana cair setelah pembeli konfirmasi." : "Menunggu pembeli membayar. Jangan serahkan barang sebelum dibayar.") : "";
            return `<div class="card ocard"><b>${esc(o.title)}</b> <span class="st ${L[1]}">${L[0]}</span><div class="mut">Kamu ${o.role} · ${rp(o.price)} · ${on ? "Bayar online" + (o.pay_info ? " (" + esc(o.pay_info.channel) + ")" : "") : "COD"}${s ? ` · biaya layanan ${rp(o.fee)} · kamu terima ${rp(o.payout)}` : ""}</div>${note ? `<p class="mut">${note}</p>` : ""}
 <div class="row">${pay}${a.map(x => `<button class="btn sm ${x[2]}" data-id="${o.id}" data-a="${x[0]}">${x[1]}</button>`).join("")}${["requested", "accepted"].includes(o.status) ? `<a class="btn sm alt" href="chatroom.html?l=${o.listing_id}&w=${other}&t=${encodeURIComponent(o.title)}">Chat</a>` : ""}</div></div>`
        }).join("") : '<div class="card mut">Belum ada transaksi. Ajukan beli dari halaman barang.</div>';
        document.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { try { await api("POST", `/orders/${b.dataset.id}/${b.dataset.a}`); load() } catch (x) { toast(x.message) } })
    }
    load()
})();
