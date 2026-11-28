const OB = [["sofa", "Barang kos masih bagus, jangan dibuang", "Meja, kipas, rak, dan peralatan dapur dari penghuni lama bisa langsung dipakai penghuni baru."],
["pin", "Cari yang dekat denganmu", "Atur radius pencarian. Kamu hanya melihat area dan jarak, bukan alamat lengkap penjual."],
["wallet", "Bayar di tempat atau online", "Pilih COD dan cek barangnya langsung, atau bayar online lewat bank dan e-wallet. Dana baru cair setelah barang kamu terima."],
["shield", "Setiap barang diverifikasi admin", "Barang baru diperiksa AI lalu diputuskan tim verifikasi sebelum tayang, jadi pembeli lebih tenang."]];
let i = 0, x0 = null;
const done = () => { localStorage.setItem("bk_ob", "1"); location.href = token() ? "home" : "login" };
function draw() {
    const o = OB[i], last = i === OB.length - 1;
    $("#app").innerHTML = `<div class="ob"><div class="tile">${ic(o[0], 60)}</div><h1>${o[1]}</h1><p class="mut">${o[2]}</p>
 <div class="dots" role="img" aria-label="Langkah ${i + 1} dari ${OB.length}">${OB.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
 <div class="acts"><button class="btn alt" id="skip">${i > 0 ? "Kembali" : "Lewati"}</button><button class="btn" id="next">${last ? "Mulai" : "Lanjut"}</button></div></div>`;
    $("#skip").onclick = () => i > 0 ? (i--, draw()) : done(); $("#next").onclick = () => last ? done() : (i++, draw())
}
document.addEventListener("keydown", e => { if (e.key === "ArrowRight" && i < OB.length - 1) { i++; draw() } if (e.key === "ArrowLeft" && i > 0) { i--; draw() } });
document.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
document.addEventListener("touchend", e => { if (x0 === null) return; const d = e.changedTouches[0].clientX - x0; x0 = null; if (d < -60 && i < OB.length - 1) { i++; draw() } else if (d > 60 && i > 0) { i--; draw() } });
draw();
