$("#app").innerHTML = `<div class="auth"><h1>Buat akun BarKos</h1><p class="mut">Gratis. Pilih tipe penggunamu.</p>
<form id="f"><label>Nama<input name="name" required autocomplete="name"></label>
<label>Saya seorang<select name="segment"><option value="mahasiswa">Mahasiswa</option><option value="pekerja">Pekerja</option></select></label>
<label>Area tinggal<select name="area">${AREAS.map(a => `<option>${a}</option>`).join("")}</select></label>
<label>No. HP (opsional)<input name="phone" type="tel" autocomplete="tel"></label>
<label>Email<input name="email" type="email" required autocomplete="email"></label>
<label>Password (min. 6 karakter)<input name="password" type="password" minlength="6" required autocomplete="new-password"></label>
<div class="err" id="err" role="alert"></div><button class="btn">Daftar</button></form><p class="sw"><a href="login.html">Sudah punya akun? Masuk</a></p></div>`;
$("#f").onsubmit = async e => { e.preventDefault(); try { const d = await api("POST", "/register", Object.fromEntries(new FormData(e.target))); localStorage.setItem("bk_t", d.token); sessionStorage.clear(); location.href = "home.html" } catch (x) { $("#err").textContent = x.message } };
