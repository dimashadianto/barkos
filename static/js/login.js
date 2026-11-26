$("#app").innerHTML = `<div class="auth"><h1 class="logo">Bar<span class="tag">Kos</span></h1><p class="mut">Masuk untuk lanjut jual-beli barang kos.</p>
<form id="f"><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label>
<div class="err" id="err" role="alert"></div><button class="btn">Masuk</button></form><p class="sw"><a href="register.html">Belum punya akun? Daftar</a></p>
<p class="mut" style="text-align:center">Demo tim verifikasi: admin@barkos.id / admin123</p></div>`;
$("#f").onsubmit = async e => { e.preventDefault(); try { const d = await api("POST", "/login", Object.fromEntries(new FormData(e.target))); localStorage.setItem("bk_t", d.token); sessionStorage.clear(); location.href = d.user.role === "admin" ? "admin.html" : "home.html" } catch (x) { $("#err").textContent = x.message } };
