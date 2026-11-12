# Performa Tim

Menu baru khusus admin, responsif untuk HP dan desktop.

## Pasang

1. Jalankan `supabase/setup/005_team_performance.sql` sekali di Supabase SQL Editor. Tabel `kontenflow_` dari setup sebelumnya harus sudah tersedia. Jangan menjalankan ulang SQL lama.
2. Timpa `index.html` dan `src/main.js` di repo GitHub sesuai foldernya.
3. Redeploy Vercel. Tidak ada ENV baru. Pengaturan grup, Fonnte, akun, anggota, dan video tetap dipakai.

## Gunakan

Login admin → Performa Tim → pilih Harian/Bulanan → pilih tanggal/bulan. Awalnya menampilkan bulan berjalan menurut WIB. Tombol Perbarui mengambil ulang rekap.

- Video dikirim: jumlah record video yang dibuat oleh editor/anggota, berdasarkan `created`, bukan saat diposting.
- Video diposting: jumlah video berstatus Sudah Posting berdasarkan `posted`, dikelompokkan menurut orang yang menandai (`posted_by`). Ini bukan statistik posting yang ditarik dari TikTok.
- Editor/sosmed aktif: jumlah orang dengan aktivitas di periode tersebut.
- Anggota berperan editor/sosmed tanpa aktivitas tetap muncul dengan angka 0. Pengirim/pelaku posting yang telah berganti peran atau tidak ada di roster tetap muncul jika punya aktivitas di periode tersebut. Admin yang melakukan pekerjaan editor/sosmed juga tercatat sebagai pelakunya.
- Tanggal menggunakan Asia/Jakarta (WIB), dari 00:00 hingga sebelum 00:00 hari/bulan berikutnya.
- Rekap dihitung langsung dalam PostgreSQL, tidak tergantung batas 1.000 baris hasil query frontend.
- Berdasarkan record yang masih tersimpan. Menghapus video/akun/produk atau membatalkan status Sudah Posting akan mengubah rekap. Rekap ini bukan buku audit aktivitas permanen; klik posting berulang pada video yang sama tidak dihitung sebagai video tambahan.
- Tidak mengubah data lama atau mengirim ulang notifikasi.

Pengujian: build produksi; periode harian/bulanan pada batas WIB; lebih dari 1.000 video; tanggal kirim dan posting terpisah; anggota dengan aktivitas 0; penolakan akses laporan untuk nonadmin. Tampilan browser produksi belum diverifikasi.
