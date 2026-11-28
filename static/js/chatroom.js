(async () => {
    const u = await guard(), lid = qs.get("l"), wid = qs.get("w"), t = qs.get("t") || "Percakapan"; layout(esc(t), null, u, "chats");
    $("#body").innerHTML = `<div id="msgs" aria-live="polite"></div><form class="composer" id="f"><input name="body" placeholder="Tulis pesan" autocomplete="off" aria-label="Pesan"><button class="btn">Kirim</button></form>`;
    const jam = ts => new Date(ts * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
    const hari = ts => {
        const d = new Date(ts * 1000), n = new Date(), y = new Date(); y.setDate(n.getDate() - 1);
        const same = (a, b) => a.toDateString() === b.toDateString();
        return same(d, n) ? "Hari ini" : same(d, y) ? "Kemarin" : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: d.getFullYear() === n.getFullYear() ? undefined : "numeric" });
    };
    let last = "";
    const draw = M => {
        const sig = JSON.stringify(M); if (sig === last) return; last = sig; // tidak gambar ulang kalau tidak ada pesan baru
        const nearBottom = innerHeight + scrollY >= document.body.scrollHeight - 120;
        let out = "", prevDay = "";
        M.forEach((m, i) => {
            const day = m.ts ? hari(m.ts) : ""; if (day && day !== prevDay) { out += `<div class="day"><span>${day}</span></div>`; prevDay = day }
            const first = i === 0 || M[i - 1].mine !== m.mine || (M[i - 1].ts && hari(M[i - 1].ts) !== day); // pesan pertama dalam satu kelompok -> ada "ekor"
            out += `<div class="bub ${m.mine ? "me" : ""} ${first ? "first" : ""}"><span class="tx">${esc(m.body)}</span>${m.ts ? `<span class="tm">${jam(m.ts)}</span>` : ""}</div>`;
        });
        $("#msgs").innerHTML = M.length ? out : '<p class="mut">Mulai dengan menanyakan kondisi barang dan titik temu COD.</p>';
        if (nearBottom || !draw.done) window.scrollTo(0, document.body.scrollHeight); draw.done = true; // jangan paksa scroll kalau user sedang baca pesan lama
    };
    const load = async () => { try { draw(await api("GET", `/listings/${lid}/messages?with=${wid}`)) } catch (x) { $("#msgs").innerHTML = `<p class="err">${esc(x.message)}</p>`; $("#f").hidden = true; clearInterval(p) } };
    $("#f").onsubmit = async e => { e.preventDefault(); const i = e.target.body, v = i.value.trim(); if (!v) return; i.value = ""; try { await api("POST", `/listings/${lid}/messages`, { with: wid, body: v }); draw.done = false; load() } catch (x) { toast(x.message) } };
    await load(); const p = setInterval(load, 4000)
})();
