# Kontenflow

Vite + Supabase Auth/Postgres + Vercel. Video tetap berada di Google Drive. Database hanya menyimpan link dan metadata.

## Setup Supabase

1. Buat project Supabase lalu jalankan `supabase/migrations/202611100001_workspace.sql` melalui SQL Editor atau Supabase CLI.
2. Di Authentication, matikan pendaftaran publik. Buat pengguna admin melalui dashboard Authentication (Add user), lalu jalankan SQL berikut dengan email admin sebenarnya:

```sql
insert into public.members(email,name,role) values ('EMAIL_ADMIN_HURUF_KECIL','Admin','admin');
```

Admin tidak diberikan otomatis kepada pengunjung pertama. Keanggotaan aplikasi dibedakan dari akun Authentication. Admin menambahkan email dan penugasan melalui aplikasi; pengguna dengan email yang sama dibuat/diundang di Supabase Authentication.

3. Konfigurasi Site URL dan Redirect URLs di Supabase Authentication ke domain Vercel. Untuk undangan/reset, arahkan email template ke `{{ .SiteURL }}` dengan token recovery standar Supabase. Atur SMTP produksi untuk email.
4. Isi environment berdasarkan `.env.example`. Gunakan publishable key atau legacy anon key; **jangan gunakan service_role key** di browser.

## Jalankan

```sh
npm ci
cp .env.example .env.local
# Isi URL dan publishable key project.
npm run dev
```

## GitHub dan Vercel

Push folder ini ke repository GitHub privat. Import repository melalui Vercel; preset Vite, build `npm run build`, output `dist`. Tambahkan dua environment dari `.env.example`, lalu deploy. Setelah deploy, atur URL auth Supabase sesuai domain final.

## Hak akses

- Admin: produk, akun, penugasan anggota, seluruh konten.
- Editor: membaca akun yang ditugaskan dan menambahkan video; tidak bisa menandai posting.
- Sosmed: membaca akun yang ditugaskan, menandai posting, mengembalikan ke siap posting.
- Pembatasan akses dijalankan lewat PostgreSQL RLS dan RPC berotorisasi; frontend bukan batas keamanan.
- Riwayat tetap disimpan. Konten yang sudah diposting hilang dari daftar Siap Posting.
- Preview mengikuti izin file Google Drive; bagikan file kepada tim yang sesuai.

## Status migrasi

Source sudah disiapkan untuk stack baru. Project Supabase, repository GitHub, deployment Vercel, serta migrasi data dari versi Sites belum dijalankan sampai akun layanan terhubung. Situs Sites lama tetap terpisah.
