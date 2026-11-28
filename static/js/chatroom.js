(async () => {
    const u = await guard(), lid = qs.get("l"), wid = qs.get("w"), t = qs.get("t") || "Percakapan"; layout(esc(t), null, u, "chats");
    $("#body").innerHTML = `<div id="msgs" aria-live="polite"></div><form class="composer" id="f"><input name="body" placeholder="Tulis pesan" autocomplete="off" aria-label="Pesan"><button class="btn">Kirim</button></form>`;
    const draw = M => { $("#msgs").innerHTML = M.length ? M.map(m => `<div class="bub ${m.mine ? "me" : ""}">${esc(m.body)}</div>`).join("") : '<p class="mut">Mulai dengan menanyakan kondisi barang dan titik temu COD.</p>'; window.scrollTo(0, document.body.scrollHeight) };
    const load = async () => { try { draw(await api("GET", `/listings/${lid}/messages?with=${wid}`)) } catch (x) { $("#msgs").innerHTML = `<p class="err">${esc(x.message)}</p>`; $("#f").hidden = true; clearInterval(p) } };
    $("#f").onsubmit = async e => { e.preventDefault(); const i = e.target.body, v = i.value.trim(); if (!v) return; i.value = ""; try { await api("POST", `/listings/${lid}/messages`, { with: wid, body: v }); load() } catch (x) { toast(x.message) } };
    await load(); const p = setInterval(load, 4000)
})();
