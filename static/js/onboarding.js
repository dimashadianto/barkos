const OB = [["🪑", "Barang kos masih bagus, jangan dibuang", "Meja, kipas, rak, dan peralatan dapur dari penghuni lama bisa langsung dipakai penghuni baru."],
["📍", "Cari yang dekat denganmu", "Atur radius pencarian. Kamu hanya melihat area dan jarak, bukan alamat lengkap penjual."],
["🤝", "Ketemu langsung, bayar di tempat", "Pilih COD, cek barangnya sendiri, lalu selesaikan transaksi di aplikasi."],
["🛡️", "Setiap barang diverifikasi admin", "Barang baru diperiksa AI lalu diputuskan tim verifikasi sebelum tayang, jadi pembeli lebih tenang."]];
let i = 0; const done = () => { localStorage.setItem("bk_ob", "1"); location.href = "login.html" };
function draw() {
    const o = OB[i]; $("#app").innerHTML = `<div class="ob"><div class="big" aria-hidden="true">${o[0]}</div><h1>${o[1]}</h1><p class="mut">${o[2]}</p>
<div class="dots">${OB.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div><div class="row"><button class="btn alt" id="skip">Lewati</button><button class="btn" id="next">${i === OB.length - 1 ? "Mulai" : "Lanjut"}</button></div></div>`;
    $("#skip").onclick = done; $("#next").onclick = () => i < OB.length - 1 ? (i++, draw()) : done()
}
draw();
