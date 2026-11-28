(async () => {
    const u = await guard(); layout("Profil", "profile", u);
    $("#body").innerHTML = `<div class="who"><div class="av" aria-hidden="true">${esc(u.name[0] || "?").toUpperCase()}</div><div><h2>${esc(u.name)}</h2><span class="mut">${esc(u.email)} · ${esc(u.segment)}</span></div></div>
<form id="f"><label>Nama<input name="name" value="${esc(u.name)}" required></label><label>No. HP<input name="phone" type="tel" value="${esc(u.phone || "")}"></label>
<label>Area tinggal<select name="area">${AREAS.map(a => `<option ${a === u.area ? "selected" : ""}>${a}</option>`).join("")}</select></label><button class="btn">Simpan perubahan</button></form>
<div class="links">${u.role === "admin" ? "" : '<a class="btn alt" href="feedback">Kirim feedback</a>'}<button class="btn alt" id="out">Keluar</button>${u.role === "admin" ? "" : '<a class="btn bad" href="delete-account">Hapus akun saya</a>'}</div>`;
    $("#f").onsubmit = async e => { e.preventDefault(); try { await api("PUT", "/me", Object.fromEntries(new FormData(e.target))); toast("Profil disimpan") } catch (x) { toast(x.message) } }; $("#out").onclick = logout
})();
