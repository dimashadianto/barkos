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
            const other = s ? o.buyer_id : o.seller_id, pay = o.status === "accepted" && on && !s && o.pay_status !== "paid" ? `<a class="btn sm" href="pay?order=${o.id}">${o.pay_status === "pending" ? "Lihat tagihan" : "Bayar sekarang"}</a>` : "";
            const note = o.status === "accepted" && on && s ? (o.pay_status === "paid" ? "Sudah dibayar. Serahkan barang; dana cair setelah pembeli konfirmasi." : "Menunggu pembeli membayar. Jangan serahkan barang sebelum dibayar.") : "";
            return `<div class="card ocard"><b>${esc(o.title)}</b> <span class="st ${L[1]}">${L[0]}</span><div class="mut">Kamu ${o.role} · ${rp(o.price)} · ${on ? "Bayar online" + (o.pay_info ? " (" + esc(o.pay_info.channel) + ")" : "") : "COD"}${s ? ` · biaya layanan ${rp(o.fee)} · kamu terima ${rp(o.payout)}` : ""}</div>${note ? `<p class="mut">${note}</p>` : ""}
 <div class="row">${pay}${a.map(x => `<button class="btn sm ${x[2]}" data-id="${o.id}" data-a="${x[0]}">${x[1]}</button>`).join("")}${["requested", "accepted"].includes(o.status) ? `<a class="btn sm alt" href="chatroom?l=${o.listing_id}&w=${other}&t=${encodeURIComponent(o.title)}">Chat</a>` : ""}${o.status === "completed" && !s ? (o.reviewed ? '<span class="mut">Ulasan terkirim ✓</span>' : `<button class="btn sm" data-rv="${o.id}" data-t="${esc(o.title)}">${ic("star", 16)} Beri ulasan</button>`) : ""}</div></div>`
        }).join("") : '<div class="card mut">Belum ada transaksi. Ajukan beli dari halaman barang.</div>';
        document.querySelectorAll("[data-rv]").forEach(b => b.onclick = () => review(b.dataset.rv, b.dataset.t));
        document.querySelectorAll("[data-a]").forEach(b => b.onclick = async () => { try { await api("POST", `/orders/${b.dataset.id}/${b.dataset.a}`); load() } catch (x) { toast(x.message) } })
    }
    /* Form ulasan penjual (pembeli, setelah transaksi selesai) */
    function review(id, title) {
        const d = document.createElement("dialog"); d.className = "modal rvm"; d.setAttribute("aria-labelledby", "rv-t"); let r = 0;
        d.innerHTML = `<h2 id="rv-t">Beri ulasan</h2><p class="mut">${esc(title)}</p><div class="pick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(n => `<button type="button" role="radio" aria-checked="false" aria-label="${n} bintang" data-n="${n}">★</button>`).join("")}</div>
<textarea id="rvc" rows="3" maxlength="500" placeholder="Ceritakan pengalamanmu dengan penjual (opsional)"></textarea><div class="err" id="rve" role="alert"></div><div class="m-act"><button class="btn alt" data-x>Nanti</button><button class="btn" data-ok>Kirim ulasan</button></div>`;
        document.body.append(d); const B = [...d.querySelectorAll(".pick button")];
        B.forEach(b => b.onclick = () => { r = +b.dataset.n; B.forEach(x => { const on = +x.dataset.n <= r; x.classList.toggle("on", on); x.setAttribute("aria-checked", +x.dataset.n === r) }) });
        d.querySelector("[data-x]").onclick = () => d.close();
        d.querySelector("[data-ok]").onclick = async () => {
            if (!r) { d.querySelector("#rve").textContent = "Pilih jumlah bintang dulu"; return }
            try { await api("POST", `/orders/${id}/review`, { rating: r, comment: d.querySelector("#rvc").value }); d.close(); toast("Terima kasih, ulasanmu terkirim"); load() } catch (x) { d.querySelector("#rve").textContent = x.message }
        };
        d.addEventListener("close", () => d.remove()); d.showModal()
    }
    load()
})();
