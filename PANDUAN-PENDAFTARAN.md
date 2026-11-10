# Patch pendaftaran mandiri + persetujuan admin

Patch ini mencakup tampilan login terbaru dan pendaftaran. Tidak perlu memasang patch tampilan sebelumnya secara terpisah.

## Pasang patch

1. Timpa `index.html` dan `src/main.js` di repo GitHub sesuai foldernya.
2. Tambahkan file SQL di `supabase/migrations/202611100002_signup_approval.sql`.
3. Di Supabase SQL Editor, jalankan **SQL 202611100002 tersebut satu kali**. SQL dasar `202611100001_workspace.sql` dari ZIP awal harus sudah dijalankan. Tidak perlu menjalankan ulang SQL dasar.
4. Supabase → Authentication → Sign In / Providers: aktifkan email/password dan **Allow new users to sign up**. Biarkan verifikasi email aktif.
5. Authentication → URL Configuration: isi Site URL dengan URL Vercel aplikasi dan tambahkan URL tersebut pada Redirect URLs. Konfigurasikan SMTP untuk pengiriman email produksi.
6. Commit/push perubahan ke GitHub, lalu tunggu deploy Vercel. ENV tetap sama, tidak ada service_role key di frontend.

## Cara anggota daftar

Buka URL Vercel → Daftar sekarang → isi nama, email, password (minimal 8 karakter) → konfirmasi email → masuk → tunggu persetujuan admin. Konfirmasi email belum memberi akses konten.

Admin membuka Anggota Tim → Menunggu persetujuan → Setujui → pilih Editor/Sosmed dan minimal satu akun TikTok → Simpan. Persetujuan membutuhkan email pendaftar sudah diverifikasi. Tombol Tolak tidak memberikan akses konten. Pendaftar klik Cek status setelah disetujui.

## Admin pertama

Jika admin sudah dibuat sebelumnya, gunakan akun itu. Tidak perlu membuat ulang.

Jika belum ada admin: daftar melalui aplikasi, verifikasi email, lalu jalankan SQL berikut sekali di Supabase SQL Editor. Ganti alamat dengan email milik pemilik/admin yang benar (huruf kecil):

```sql
insert into public.members(email,name,role,accounts)
values ('ganti-dengan-email-admin@example.com','Admin','admin','{}')
on conflict(email) do update set role='admin',accounts='{}';
```

Setelah itu login ulang/klik Cek status. Admin dapat membuat produk dan akun TikTok sebelum menyetujui anggota. Pengunjung tidak bisa memilih peran admin atau menyetujui dirinya sendiri.

## Catatan

- Database dan data yang lama tetap dipakai; migrasi hanya menambah tabel permintaan, trigger pendaftaran, dan RPC persetujuan.
- Anggota yang sudah memiliki akses tetap bisa masuk.
- Pengguna lama tanpa akses mendapat permintaan pending saat login berikutnya.
- Penolakan tetap tersimpan; mendaftar/login ulang tidak mengubahnya menjadi pending.
- Tampilan dan SQL diuji build serta PostgreSQL lokal (PGlite). Email, login, dan redirect pada project Supabase/Vercel kamu perlu dicek setelah setup.
