# Patch kelola produk, akun, jenis konten, dan persetujuan

Untuk versi terbaru yang memakai tabel `kontenflow_`.

## Pasang tanpa membuat ulang akun

1. Jalankan `supabase/setup/002_account_management.sql` satu kali di Supabase SQL Editor. SQL `001_kontenflow_shared_project.sql` harus sudah terpasang. Jangan jalankan ulang SQL 001.
2. Timpa `index.html` dan `src/main.js` di GitHub sesuai foldernya.
3. Redeploy Vercel. ENV tidak berubah.

SQL 002 mempertahankan ID semua produk/akun/video, penugasan, dan riwayat yang sudah ada. Hanya menambah kolom jenis konten serta fungsi pengelolaan. Tidak perlu membuat ulang akun TikTok atau mendaftarkan ulang anggota.

## Persetujuan

Admin cukup pilih peran Editor/Sosmed. Penugasan akun saat menyetujui bersifat opsional. Anggota yang disetujui tanpa akun dapat masuk tetapi belum melihat konten akun mana pun. Penugasan dilakukan kemudian melalui Anggota Tim → Atur akses. Aturan wajib akun pada versi sebelumnya sudah dilepas di frontend dan database.

## Jenis konten pada akun yang sudah ada

Buka akun TikTok → Jenis konten → isi satu jenis per baris → Simpan. Contoh:

```
Edukasi
Testimoni
Promo
```

Editor memilih jenis saat tambah video. Daftar video dapat difilter menurut jenis. Video lama tetap ada dan belum memiliki jenis; kategori historis yang tidak lagi ada di pengaturan tetap terlihat pada videonya. Mengubah daftar jenis tidak menghapus konten. Jenis diatur per akun, bukan untuk semua akun sekaligus.

## Hapus

- Hapus akun: buka halaman akun → Hapus akun.
- Hapus produk: pilih tab produk tertentu (bukan Semua produk) → Hapus produk ini.
- Hanya admin yang dapat menghapus. Konfirmasi menampilkan jumlah video/akun terkait dan wajib mengetik `HAPUS`.
- Penghapusan akun menghapus video/riwayat Kontenflow di dalamnya serta penugasannya.
- Penghapusan produk menghapus semua akun, video/riwayat, dan penugasan akun di produk tersebut.
- Penghapusan bersifat permanen di database Kontenflow. File Google Drive dan akun TikTok aslinya tidak dihapus.

Patch mempertahankan tampilan mobile dan perbaikan reload sebelumnya. Build serta pengujian PostgreSQL lokal dilakukan; verifikasi browser pada deployment kamu belum dilakukan.
