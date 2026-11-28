(async () => {
    const u = await guard({ user: true }); layout("Chat", "chats", u); $("#body").innerHTML = '<p class="mut">Memuat…</p>';
    try { const C = await api("GET", "/chats"); $("#body").innerHTML = C.length ? C.map(c => `<a class="card convo" href="chatroom?l=${c.listing_id}&w=${c.with_id}&t=${encodeURIComponent(c.title)}"><b>${esc(c.name)}</b> <span class="mut">· ${esc(c.title)}</span><div class="mut">${esc(c.last)}</div></a>`).join("") : '<div class="card mut">Belum ada percakapan. Buka sebuah barang lalu pilih Chat penjual.</div>' } catch (x) { toast(x.message) }
})();
