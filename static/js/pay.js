(async () => {
    const u = await guard({ user: true }); layout("Pembayaran", null, u, "orders"); const id = qs.get("order"); let ch, o, pick = null;
    const demo = '<div class="demo">Simulasi payment gateway. Tidak ada uang, bank, atau e-wallet sungguhan yang digunakan.</div>';
    function qr(seed) {
        let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; const r = () => (h = (h * 1664525 + 1013904223) >>> 0) / 2 ** 32, F = [[0, 0], [14, 0], [0, 14]]; let s = "";
        for (let y = 0; y < 21; y++)for (let x = 0; x < 21; x++)if (!F.some(f => x >= f[0] && x < f[0] + 7 && y >= f[1] && y < f[1] + 7) && r() > .5) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
        for (const f of F) s += `<rect x="${f[0]}" y="${f[1]}" width="7" height="7"/><rect x="${f[0] + 1}" y="${f[1] + 1}" width="5" height="5" fill="#fff"/><rect x="${f[0] + 2}" y="${f[1] + 2}" width="3" height="3"/>`;
        return `<svg class="qr" viewBox="-1 -1 23 23" role="img" aria-label="Kode QR contoh" fill="#18213A">${s}</svg>`
    }
    const sum = () => `<div class="card sum"><div><b>${esc(o.title)}</b><div class="mut">Transaksi #${o.id}</div></div><span class="tag">${rp(o.price)}</span></div>`;
    async function load() { o = await api("GET", "/orders/" + id); ch = await api("GET", "/payment/channels"); draw() }
    function draw() {
        const B = $("#body");
        if (o.pay_method !== "online" || o.role !== "pembeli") { B.innerHTML = demo + '<p class="err">Halaman ini hanya untuk pembeli pesanan online.</p>'; return }
        if (o.pay_status === "paid" || o.pay_status === "released") { B.innerHTML = demo + `<div class="ok"><div class="big" style="color:var(--ok)">${ic("check", 72)}</div><h2>Pembayaran diterima</h2><p class="mut">Penjual sudah diberi tahu. Setelah barang kamu terima, tekan <b>Barang diterima</b> di halaman Transaksi agar dana diteruskan ke penjual.</p><a class="btn" href="orders">Ke Transaksi</a></div>`; return }
        if (o.status !== "accepted") { B.innerHTML = demo + sum() + '<p class="mut">Pembayaran dibuka setelah penjual menyetujui pesananmu.</p>'; return }
        if (o.pay_status === "pending" && o.pay_info) {
            const i = o.pay_info, bank = i.kind === "bank";
            B.innerHTML = demo + sum() + `<h3>${esc(i.channel)}</h3>${bank ? `<p class="mut">Nomor Virtual Account</p><div class="va" id="va">${esc(i.va)}</div><button class="btn alt sm" id="cp">Salin nomor</button>
  <ol class="steps"><li>Buka m-banking atau ATM</li><li>Pilih Transfer > Virtual Account</li><li>Masukkan nomor di atas dan bayar ${rp(i.amount)}</li></ol>`
                : `${qr(i.qr)}<ol class="steps"><li>Buka aplikasi ${esc(i.channel)}</li><li>Pindai kode QR di atas</li><li>Konfirmasi pembayaran ${rp(i.amount)}</li></ol>`}
  <p class="mut">Berlaku sampai ${new Date(i.expires * 1000).toLocaleString("id-ID")}</p><button class="btn" id="sim">Simulasi bayar sekarang</button><button class="btn alt" style="margin-top:8px" id="chg">Ganti metode</button>`;
            $("#sim").onclick = async () => { try { await api("POST", `/orders/${id}/pay/simulate`); toast("Pembayaran berhasil (simulasi)"); await load() } catch (x) { toast(x.message) } };
            $("#chg").onclick = () => { o.pay_status = "unpaid"; draw() }; if (bank) $("#cp").onclick = () => { navigator.clipboard?.writeText(i.va); toast("Nomor disalin") }; return
        }
        const opts = (L) => L.map(c => `<button class="opt ${pick === c.code ? "on" : ""}" data-c="${c.code}" aria-pressed="${pick === c.code}">${esc(c.name)}</button>`).join("");
        B.innerHTML = demo + sum() + `<div class="grp">Transfer bank</div><div class="opts">${opts(ch.bank)}</div><div class="grp">E-wallet</div><div class="opts">${opts(ch.ewallet)}</div>
  <p class="mut" style="margin-top:16px">Dana ditahan dulu dan baru diteruskan ke penjual setelah kamu konfirmasi barang diterima. Biaya layanan ${rp(o.fee)} dipotong dari penjual.</p><div class="err" id="err" role="alert"></div><button class="btn" id="go" ${pick ? "" : "disabled"}>Buat pembayaran</button>`;
        document.querySelectorAll(".opt").forEach(b => b.onclick = () => { pick = b.dataset.c; draw() });
        const go = $("#go"); go.onclick = async () => { try { await api("POST", `/orders/${id}/pay`, { channel: pick }); await load() } catch (x) { $("#err").textContent = x.message } }
    }
    try { await load() } catch (x) { $("#body").innerHTML = `<p class="err">${esc(x.message)}</p>` }
})();
