(async () => {
    const u = await guard(); layout("Profil", "profile", u); const adm = u.role === "admin";
    $("#body").innerHTML = `<div class="who"><div class="av" aria-hidden="true">${esc(u.name[0] || "?").toUpperCase()}</div><div><h2>${esc(u.name)}</h2><span class="mut">${esc(u.email)} · ${esc(u.segment)}</span></div></div>
<form id="f"><label>Nama<input name="name" value="${esc(u.name)}" required></label><label>No. HP<input name="phone" type="tel" value="${esc(u.phone || "")}"></label>
<label>Area tinggal<select name="area">${AREAS.map(a => `<option ${a === u.area ? "selected" : ""}>${a}</option>`).join("")}</select></label><button class="btn">Simpan perubahan</button></form>
<details class="pwbox card"><summary>${ic("key", 18)} Ganti password</summary><form id="pw"><label>Password lama<input name="old" type="password" autocomplete="current-password" required></label>
<label>Password baru<input name="new" type="password" autocomplete="new-password" minlength="6" required></label><label>Ulangi password baru<input name="new2" type="password" autocomplete="new-password" minlength="6" required></label>
<div class="err" id="pwerr" role="alert"></div><button class="btn">Ganti password</button></form></details>
<div class="links">${adm ? "" : `<a class="btn alt" href="seller?id=${u.id}">Lihat ulasan saya sebagai penjual</a><a class="btn alt" href="wishlist">Barang disimpan</a><a class="btn alt" href="feedback">Kirim feedback</a>`}<button class="btn alt" id="out">Keluar</button>${adm ? "" : '<a class="btn bad" href="delete-account">Hapus akun saya</a>'}</div>`;
    $("#f").onsubmit = async e => { e.preventDefault(); try { await api("PUT", "/me", Object.fromEntries(new FormData(e.target))); toast("Profil disimpan") } catch (x) { toast(x.message) } };
    $("#pw").onsubmit = async e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); $("#pwerr").textContent = "";
        if (d.new !== d.new2) { $("#pwerr").textContent = "Ulangi password baru dengan benar"; return }
        try { await api("PUT", "/me/password", { old: d.old, new: d.new }); e.target.reset(); $(".pwbox").open = false; await modal({ title: "Password diganti", text: "Pakai password baru saat masuk berikutnya." }) } catch (x) { $("#pwerr").textContent = x.message }
    };
    $("#out").onclick = logout
})();
