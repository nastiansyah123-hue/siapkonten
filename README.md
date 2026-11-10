# Kontenflow

Vite + Supabase + Vercel. Kode aplikasi `kontenflow`, dengan tabel dan RPC berawalan `kontenflow_` agar dapat berbagi satu project Supabase dengan aplikasi lain.

Panduan setup terbaru: [PANDUAN-PROJECT-BERSAMA.md](PANDUAN-PROJECT-BERSAMA.md).

Gunakan `supabase/setup/001_kontenflow_shared_project.sql` untuk setup terbaru, bukan SQL generik dalam folder migrations lama. SQL lama disimpan sebagai riwayat. Data lama tidak dihapus/disalin otomatis.

```sh
npm ci
cp .env.example .env.local
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
npm run build
```

Import repository GitHub di Vercel menggunakan preset Vite, output `dist`. Gunakan publishable/anon key, jangan service_role key di frontend.

Akun Supabase Auth tetap bersama. Akses Kontenflow hanya diberikan melalui tabel keanggotaan Kontenflow oleh admin. Email admin awal: adsyorder@gmail.com.
