# Fonnte satu grup WhatsApp + filter status

Patch untuk versi terbaru dengan tabel `kontenflow_` dan SQL setup 001/002 sudah terpasang.

## Pasang

1. Jalankan `supabase/setup/003_notifications.sql` **sekali** di SQL Editor Supabase. Jangan jalankan ulang 001/002.
2. Timpa `index.html`, `src/main.js`, `vercel.json`, dan tambahkan `api/notify-video.js` ke repo GitHub sesuai foldernya. API adalah Vercel server function; jangan hanya mengunggah folder dist.
3. Di Vercel Settings → Environment Variables, pertahankan ENV Supabase dan tambahkan:

| ENV | Nilai |
| --- | --- |
| `FONNTE_TOKEN` | Token perangkat Fonnte yang sudah terhubung WhatsApp |
| `FONNTE_TARGET` | ID grup WhatsApp sosmed dari Fonnte, biasanya `120xxxxxxxx@g.us` |

Kedua ENV Fonnte hanya digunakan di server. Jangan awali token dengan `VITE_`, jangan masukkan token ke kode/browser atau chat. Pilih environment Production; isi terpisah untuk Preview bila ingin menguji notifikasi di Preview juga. Preview dengan target yang sama akan mengirim ke grup produksi yang sama.

4. Deploy ulang Vercel. Perangkat WA Fonnte harus aktif, tergabung dalam grup tujuan, dan kuota pengiriman tersedia.
5. Uji satu video setelah setup. Pesan berisi produk, akun, judul video, jenis konten, editor, dan link Drive. Seluruh produk/akun memakai satu grup `FONNTE_TARGET`.

## Perilaku notifikasi

- Editor/admin menyimpan video terlebih dahulu. Setelah berhasil, browser meminta server Vercel mengirim notifikasi melalui Fonnte.
- Gagal notifikasi tidak membatalkan video. Jangan input ulang videonya.
- Tombol `Notifikasi WA` di video yang belum diposting dapat dipakai editor pembuat video/admin untuk mengecek atau mencoba pengiriman ulang.
- Maksimal 3 percobaan per video. Notifikasi yang sudah diterima Fonnte tidak dikirim ulang oleh tombol tersebut. Setelah kegagalan tunggu minimal 1 menit; setelah timeout/permintaan masih berjalan tunggu 2 menit.
- Status diterima Fonnte berarti masuk antrean, belum menjamin pesan sudah sampai di WhatsApp. Cek dashboard Fonnte untuk status pengiriman.
- Bila terjadi timeout, cek dashboard Fonnte sebelum mencoba lagi karena pesan mungkin sudah diterima. Integrasi ini mengurangi kiriman ganda, tetapi tidak menjamin tepat satu pesan bila respons jaringan hilang.
- Pengiriman hanya berjalan untuk video baru yang disimpan melalui aplikasi ini atau lewat tombol notifikasi; penambahan video langsung melalui SQL tidak otomatis memicu WA. Video lama tidak dikirimi massal.
- Tanpa konfigurasi Fonnte, simpan video tetap berhasil dan aplikasi memberi informasi bahwa notifikasi belum aktif.
- Tidak membutuhkan service_role key Supabase. Server memvalidasi session dan memakai hak pengguna yang login. Tujuan WA hanya berasal dari ENV server.

## Filter

- Klik kartu ringkasan `Siap posting` atau `Sudah posting` untuk langsung membuka daftar sesuai status.
- Menu `Semua konten` menyediakan tab Semua / Siap posting / Riwayat, filter akun TikTok, dan pencarian judul.
- Di halaman akun, tab Semua / Siap posting / Riwayat tersedia bersama filter jenis konten.
- Data yang terlihat tetap mengikuti penugasan akun; anggota tidak dapat memakai filter untuk membuka konten akun lain.

Build, filter status, otorisasi API, kegagalan provider, dan deduplikasi SQL diuji. Pengiriman Fonnte diuji dengan mock; belum ada pesan WhatsApp sungguhan yang dikirim dari sesi ini. Verifikasi integrasi live setelah ENV dan perangkat terhubung.
