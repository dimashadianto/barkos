(async () => {
    const u = await guard({ user: true }); layout("Barang disimpan", null, u, "home");
    async function load() {
        const L = await api("GET", "/wishlist");
        $("#body").innerHTML = L.length ? `<div class="grid">${L.map(l => `<div class="card item"><a class="lnk" href="product?id=${l.id}">${l.photo ? `<img class="ph" src="${l.photo}" alt="">` : '<div class="ph"></div>'}<div><b>${esc(l.title)}</b><div class="mut">${esc(l.area)} · ${l.km} km</div><span class="tag">${rp(l.price)}</span> ${l.status === "sold" ? '<span class="st">Terjual</span>' : ""}</div></a>
<button class="unsave" data-id="${l.id}" aria-label="Hapus ${esc(l.title)} dari simpanan">${ic("heart", 22)}</button></div>`).join("")}</div>`
            : `<div class="card mut">Belum ada barang yang disimpan. Tekan ikon ${ic("heart", 16)} di halaman barang untuk menyimpan.</div><a class="btn" href="home">Jelajah barang</a>`;
        document.querySelectorAll(".unsave").forEach(b => b.onclick = async () => { try { await api("DELETE", "/wishlist/" + b.dataset.id); toast("Dihapus dari simpanan"); load() } catch (x) { toast(x.message) } });
    }
    load()
})();
