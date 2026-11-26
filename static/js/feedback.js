(async () => {
    const u = await guard(); layout("Feedback", null, u, "profile.html"); let r = 5;
    $("#body").innerHTML = `<p class="mut">Ceritakan pengalamanmu supaya BarKos bisa lebih baik.</p><form id="f"><label id="lb">Penilaian</label><div class="stars" role="group" aria-labelledby="lb"></div>
<label>Topik<select name="category"><option>umum</option><option>pencarian</option><option>transaksi</option><option>verifikasi</option><option>keamanan</option></select></label>
<label>Pesan<textarea name="message" rows="4" required></textarea></label><div class="err" id="err" role="alert"></div><button class="btn">Kirim feedback</button></form>`;
    const draw = () => { $(".stars").innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" class="${n <= r ? "on" : ""}" data-n="${n}" aria-label="${n} bintang" aria-pressed="${n === r}">★</button>`).join(""); document.querySelectorAll(".stars button").forEach(b => b.onclick = () => { r = +b.dataset.n; draw() }) }; draw();
    $("#f").onsubmit = async e => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); b.rating = r; try { await api("POST", "/feedback", b); toast("Terima kasih, feedback terkirim"); setTimeout(() => location.href = "profile.html", 900) } catch (x) { $("#err").textContent = x.message } }
})();
