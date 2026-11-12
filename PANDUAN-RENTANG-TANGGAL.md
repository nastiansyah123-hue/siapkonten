# Pemilih rentang tanggal Performa Tim

1. Jalankan `supabase/setup/006_performance_date_range.sql` sekali di Supabase SQL Editor. Tidak perlu menjalankan ulang SQL 005 atau SQL lain.
2. Timpa `index.html` dan `src/main.js` sesuai folder di GitHub.
3. Redeploy Vercel. ENV tetap sama.

Menu Performa Tim → tombol tanggal → pilih preset atau klik tanggal awal/akhir → Terapkan.

Default pada pemuatan aplikasi adalah Bulan Ini: tanggal 1 sampai hari terakhir bulan berjalan berdasarkan WIB. Rentang tetap boleh mencakup hari mendatang di bulan itu, mengikuti contoh tampilan yang diminta.

Pilihan cepat: 7/14/30/90 Hari Terakhir (termasuk hari ini), Bulan Ini, Bulan Lalu, Hari Ini, Kemarin. Pilihan kalender bisa dipakai untuk satu hari atau rentang beberapa hari/bulan. Panah berpindah bulan. Memilih tanggal akhir sebelum awal akan mengurutkannya otomatis. Batal tidak mengubah filter aktif. Terapkan menghitung ulang laporan. Tanggal awal dan akhir sama-sama termasuk (00:00 WIB tanggal awal sampai sebelum 00:00 WIB setelah tanggal akhir).

Data tetap berasal dari tabel yang sama: editor berdasarkan waktu kirim, sosmed berdasarkan waktu penandaan Sudah Posting. Tidak ada reset, perubahan akun, atau pengiriman ulang WA. Rekap tetap khusus admin.

Build dan pengujian SQL rentang/WIB, data lebih dari 1.000 video, preset lintas bulan/tahun, serta Februari tahun kabisat lolos. Verifikasi tampilan browser produksi belum dilakukan.
