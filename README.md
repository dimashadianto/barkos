# BarKos (web, responsif untuk HP)
1. `pip install flask`
2. `python app.py`  -> buka http://localhost:5000
3. Dari HP (Wi-Fi sama): buka `http://<IP-laptop>:5000` (cek IP dengan `ipconfig`)
Admin demo: admin@barkos.id / admin123. Jika sebelumnya sudah punya `barkos.db` lama, boleh dipakai (otomatis dimigrasi) atau dihapus agar bersih.

Struktur: app.py (API) · services/ (3 layanan pihak ketiga MOCK: ai_moderation, notifier, payment bank/e-wallet) · static/*.html + css/ + js/ (satu halaman = satu html, css, js; base.css & common.js dipakai bersama)
Pembayaran online hanya simulasi: tidak ada uang/bank sungguhan.

## Perubahan terbaru
- **Landing page** (`index.html`) untuk pengunjung baru; pengguna yang sudah login otomatis diarahkan ke beranda / halaman admin.
- **Onboarding** (`onboarding.html`) dipusatkan di tengah layar, tampil sekali setelah daftar (bisa digeser / panah keyboard).
- **Admin**: menu Verifikasi · Transaksi · Feedback · Notifikasi · Profil.
  - `admin-orders.html`: metrik (selesai, berhasil, berulang, berjalan, ditolak/batal, nilai transaksi, pendapatan biaya layanan) + riwayat semua transaksi dengan filter status.
  - `admin-feedback.html`: rata-rata rating, sebaran bintang, filter topik, dan isi feedback. Admin dapat notifikasi saat ada feedback baru.
  - Admin tidak bisa mengirim feedback (tombol disembunyikan dan API menolak dengan 403).
- Definisi metrik: **berhasil** = selesai ÷ (selesai + ditolak + dibatalkan); **pembeli berulang** = pembeli dengan ≥ 2 transaksi selesai.
- Ikon: set SVG di `js/common.js` (fungsi `ic("nama")`), logo `icon.svg`, ikon PNG + `manifest.json` untuk "Add to Home Screen".

## URL bersih
- Halaman dibuka tanpa `.html`: `/home`, `/login`, `/admin-orders`, dst. Landing ada di `/`.
- Link lama (`/home.html?x=1`, `/index.html`) otomatis diarahkan ke URL bersih (302), jadi bookmark lama tetap jalan.
- Menu landing (Cara kerja / Fitur / Keamanan) scroll halus tanpa menambah `#hash`, URL tetap `/`.
- Halaman baru: cukup tambah `static/nama.html` (otomatis tersedia di `/nama`; daftar halaman dibaca saat server start).

## Modal
`modal({title, text, icon, tone, actions})` di `static/js/common.js` (pengganti `alert`/`confirm`), mengembalikan Promise. Dipakai di konfirmasi akun berhasil dihapus.

## Update dari Samuel (branch `samuel`)
- **Kelola barang sendiri** (`/sell`): Edit, Tandai terjual, dan Hapus (pakai modal konfirmasi). Barang yang diedit otomatis **diverifikasi ulang** admin, dan pengajuan beli yang belum disetujui dibatalkan + pembeli dapat notifikasi. Edit/hapus ditolak kalau ada transaksi yang sudah disetujui.
- **Multi-foto**: maks 5 foto per barang (foto pertama = sampul), diperkecil otomatis di HP ke 1080px. Halaman barang punya galeri geser. Kolom baru `listings.photos` (JSON); kolom `photo` tetap diisi foto sampul supaya halaman lama tetap jalan.
- **Rating & ulasan penjual**: pembeli bisa kasih bintang 1–5 + komentar setelah transaksi **selesai** (1x per transaksi). Rating tampil di halaman barang; halaman baru `/seller?id=` berisi semua ulasan.
- **Barang disimpan (wishlist)**: tombol hati di halaman barang, daftar di `/wishlist` (link di Jelajah & Profil).
- **Ganti password** di halaman Profil.
- **Keamanan**:
  - Secret key tidak lagi default: pakai env `BARKOS_SECRET`, atau otomatis dibuat acak di file `.barkos_secret` (sudah di-.gitignore, jangan di-commit).
  - Mode debug mati secara default. Nyalakan hanya saat develop: `set BARKOS_DEBUG=1` (CMD) / `$env:BARKOS_DEBUG="1"` (PowerShell).
  - Login dikunci 5 menit setelah 5x salah password.
  - Batas ukuran request 8 MB.
- Database lama otomatis dimigrasi (tabel `reviews`, `wishlist`, kolom `listings.photos`).
