(async () => {
    const u = await guard({ user: true }); layout("Hapus akun", null, u, "profile");
    $("#body").innerHTML = `<div class="warn"><b>Tindakan ini permanen.</b><ul><li>Profil dan feedbackmu dihapus</li><li>Semua barang yang kamu jual dihapus</li><li>Chat, transaksi, dan notifikasi dihapus</li></ul></div>
<form id="f"><label>Masukkan password untuk konfirmasi<input name="password" type="password" required autocomplete="current-password"></label>
<label class="chk"><input type="checkbox" id="ok"> Saya paham akun tidak bisa dipulihkan</label><div class="err" id="err" role="alert"></div><button class="btn bad" id="go" disabled>Hapus akun saya</button></form>`;
    $("#ok").onchange = e => $("#go").disabled = !e.target.checked;
    $("#f").onsubmit = async e => { e.preventDefault(); try { await api("DELETE", "/me", { password: e.target.password.value }); localStorage.clear(); sessionStorage.clear(); await modal({ icon: "check", tone: "ok", title: "Akun berhasil dihapus", text: "Profil, barang, chat, dan transaksimu sudah dihapus permanen. Terima kasih sudah memakai BarKos.", actions: [{ label: "Kembali ke beranda", value: "home" }] }); location.href = "/" } catch (x) { $("#err").textContent = x.message } }
})();
