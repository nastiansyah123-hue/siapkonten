# Pilih grup WhatsApp dari Kontenflow

Patch untuk versi Fonnte + filter yang sudah memakai SQL 001, 002, 003.

## Pasang

1. Jalankan `supabase/setup/004_whatsapp_groups.sql` **sekali** di Supabase SQL Editor. Jangan jalankan ulang SQL 001–003.
2. Timpa `src/main.js`, `api/notify-video.js`, `vercel.json`, lalu tambahkan `api/whatsapp-groups.js` ke GitHub.
3. Pastikan ENV Vercel `FONNTE_TOKEN` berisi token perangkat Fonnte. Jangan pakai awalan VITE_. ENV Supabase tetap sama.
4. Redeploy Vercel.

## Pilih grup

Login admin → Produk & akun → tombol **Grup WhatsApp** → **Sinkronkan grup** → pilih nama grup → Simpan.

- `Sinkronkan grup` memanggil `fetch-group`, kemudian `get-whatsapp-group` melalui server Vercel.
- Jika grup baru belum muncul, tunggu sebentar lalu klik **Muat ulang daftar**. Sinkronisasi di Fonnte dapat berlangsung setelah API menerima permintaan.
- Grup bisa dicari berdasarkan nama atau ID. Daftar hanya mencakup grup yang diikuti nomor WA perangkat Fonnte tersebut.
- Hanya admin Kontenflow yang bisa melihat daftar dan mengubah grup tujuan.
- Pilihan tersimpan di tabel `kontenflow_wa_settings`. Semua editor/akun menggunakan satu grup yang sama.
- Grup tersimpan di web lebih diprioritaskan daripada ENV `FONNTE_TARGET`. Bila belum ada pilihan tersimpan, ENV lama tetap dipakai.
- Tidak perlu mengubah ENV atau redeploy setiap mengganti grup setelah patch ini terpasang.

## Jika daftar masih kosong/gagal

Pastikan token merujuk perangkat yang benar, WhatsApp berstatus terhubung, dan nomor tersebut sudah bergabung di grup sosmed. Klik Sinkronkan lalu Muat ulang daftar. Web bergantung pada API Fonnte; jika API sinkronisasi gagal, web tidak dapat mengambil daftar langsung dari WhatsApp. Pesan kesalahan tampil di dialog tanpa membocorkan token.

Pengujian: build produksi, aturan akses database, prioritas tujuan tersimpan, API daftar/sinkronisasi/simpan serta penolakan akses nonadmin diuji secara lokal dengan mock. Tidak ada sinkronisasi atau pesan WhatsApp sungguhan yang dijalankan dari sesi ini; uji setelah token perangkat di Vercel siap.
