(async () => {
    const u = await guard({ user: true }), MAX = 5, editId = qs.get("edit");
    layout(editId ? "Edit barang" : "Jual barang", "sell", u, editId ? "sell" : null);
    let P = [], L0 = null; // P = daftar foto (data URL); L0 = data barang yang sedang diedit
    if (editId) { try { L0 = await api("GET", "/listings/" + editId); if (!L0.mine) throw Error("Ini bukan barang milikmu"); P = [...L0.photos] } catch (x) { $("#body").innerHTML = `<p class="err">${esc(x.message)}</p>`; return } }
    const v = (k, d = "") => esc(L0 ? L0[k] : d), sel = (k, o, d) => (L0 ? L0[k] : d) === o ? "selected" : "";
    $("#body").innerHTML = `<div class="hint">${L0 ? "Setelah disimpan, barang akan <b>diverifikasi ulang</b> oleh admin dan pengajuan beli yang belum disetujui dibatalkan." : "Setiap barang diperiksa AI lalu <b>diverifikasi admin</b> dulu. Barang baru tayang setelah disetujui."}</div>
<form id="f"><span class="lbl">Foto barang <small class="mut">(maks ${MAX}, foto pertama jadi sampul)</small></span><div class="photos" id="ph"></div><input id="pf" type="file" accept="image/*" multiple hidden>
<label>Nama barang<input name="title" required maxlength="100" value="${v("title")}"></label><label>Kategori<select name="category">${CATS.map(c => `<option ${sel("category", c)}>${c}</option>`).join("")}</select></label>
<label>Harga (Rp)<input name="price" type="number" min="1000" required inputmode="numeric" value="${v("price")}"></label>
<label>Kondisi<select name="cond">${["Seperti baru", "Baik", "Cukup baik"].map(c => `<option ${sel("cond", c, "Baik")}>${c}</option>`).join("")}</select></label>
<label>Lokasi barang<select name="area">${AREAS.map(a => `<option ${sel("area", a, u.area)}>${a}</option>`).join("")}</select></label>
<label>Deskripsi<textarea name="descr" rows="3" maxlength="2000">${v("descr")}</textarea></label><label class="chk"><input type="checkbox" name="cod" ${!L0 || L0.cod ? "checked" : ""}> Bisa COD</label>
<div class="err" id="err" role="alert"></div><button class="btn" id="go">${L0 ? "Simpan & kirim ulang untuk verifikasi" : "Kirim untuk diverifikasi"}</button>${L0 ? '<a class="btn alt" href="sell" style="margin-top:8px">Batal</a>' : ""}</form>
${L0 ? "" : '<h3 style="margin:28px 0 8px">Barang saya</h3><div id="mine"></div>'}`;

    function drawPhotos() {
        $("#ph").innerHTML = P.map((p, i) => `<div class="pt"><img src="${p}" alt="Foto ${i + 1}">${i === 0 ? '<span class="cover">Sampul</span>' : ""}<button type="button" class="rm" data-i="${i}" aria-label="Hapus foto ${i + 1}">${ic("x", 16)}</button></div>`).join("")
            + (P.length < MAX ? `<button type="button" class="pt add" id="add" aria-label="Tambah foto">${ic("plus", 26)}<small>${P.length}/${MAX}</small></button>` : "");
        $("#ph").querySelectorAll(".rm").forEach(b => b.onclick = () => { P.splice(+b.dataset.i, 1); drawPhotos() });
        if ($("#add")) $("#add").onclick = () => $("#pf").click();
    }
    $("#pf").onchange = async e => {
        const files = [...e.target.files].slice(0, MAX - P.length); if (e.target.files.length > files.length) toast(`Maksimal ${MAX} foto`);
        for (const f of files) { const d = await shrinkImg(f); if (d) P.push(d) } e.target.value = ""; drawPhotos()
    };
    drawPhotos();

    const lab = { pending: ["Menunggu verifikasi", "warn"], active: ["Tayang", "ok"], rejected: ["Ditolak", "bad"], sold: ["Terjual", ""] };
    async function mine() {
        const L = await api("GET", "/my/listings");
        $("#mine").innerHTML = L.length ? L.map(l => `<div class="card mine"><a href="product?id=${l.id}" class="mi">${l.photo ? `<img src="${l.photo}" alt="">` : '<span class="noimg"></span>'}<div><b>${esc(l.title)}</b> <span class="st ${lab[l.status][1]}">${lab[l.status][0]}</span>
<div class="mut">${rp(l.price)}${l.reject_reason ? ` · Ditolak: ${esc(l.reject_reason)}` : ""}</div></div></a>
<div class="row acts">${l.status !== "sold" ? `<a class="btn sm alt icbtn" href="sell?edit=${l.id}">${ic("edit", 16)}Edit</a>` : ""}${l.status === "active" ? `<button class="btn sm alt icbtn" data-a="sold" data-id="${l.id}">${ic("check", 16)}Tandai terjual</button>` : ""}<button class="btn sm bad icbtn" data-a="del" data-id="${l.id}" data-t="${esc(l.title)}">${ic("trash", 16)}Hapus</button></div></div>`).join("")
            : '<p class="mut">Belum ada barang yang kamu pasang.</p>';
        $("#mine").querySelectorAll("[data-a]").forEach(b => b.onclick = async () => {
            const del = b.dataset.a === "del", ok = await modal(del
                ? { icon: "trash", tone: "bad", title: "Hapus barang ini?", text: `"${b.dataset.t}" akan dihapus dan pengajuan beli yang belum disetujui ikut dibatalkan.`, actions: [{ label: "Batal", value: false, cls: "alt" }, { label: "Hapus", value: true, cls: "bad" }] }
                : { icon: "check", title: "Tandai sudah terjual?", text: "Barang tidak tampil lagi di pencarian. Pakai ini kalau barang laku di luar BarKos.", actions: [{ label: "Batal", value: false, cls: "alt" }, { label: "Ya, sudah terjual", value: true }] });
            if (!ok) return;
            try { await api(del ? "DELETE" : "POST", `/listings/${b.dataset.id}${del ? "" : "/sold"}`); toast(del ? "Barang dihapus" : "Ditandai terjual"); mine() } catch (x) { toast(x.message) }
        });
    }

    $("#f").onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target), b = Object.fromEntries(fd); b.cod = fd.has("cod"); b.photos = P; $("#err").textContent = ""; $("#go").disabled = true;
        try {
            if (L0) { await api("PUT", "/listings/" + L0.id, b); toast("Perubahan disimpan. Menunggu verifikasi ulang."); setTimeout(() => location.href = "sell", 900) }
            else { await api("POST", "/listings", b); toast("Terkirim. Menunggu verifikasi admin."); e.target.reset(); P = []; drawPhotos(); mine() }
        } catch (x) { $("#err").textContent = x.message } finally { $("#go").disabled = false }
    };
    if (!L0) mine()
})();
