# MOYA (Make Own Yarns) - Secure File Storage

## Deskripsi Aplikasi
MOYA adalah aplikasi penyimpanan berkas dan catatan berbasis web yang mengimplementasikan arsitektur *Zero-Knowledge*. Aplikasi ini dirancang untuk melindungi privasi pengguna menggunakan algoritma kriptografi modern **AES-256-GCM** yang dieksekusi langsung di sisi klien (*Client-Side Encryption*) menggunakan Web Crypto API. Kunci enkripsi diturunkan secara aman dari *Master Password* menggunakan algoritma **PBKDF2**. MOYA memisahkan metadata (*plaintext*) dan *payload* data (terenkripsi) agar kinerja basis data tetap efisien tanpa mengorbankan keamanan berkas.

## Anggota Kelompok
1. Sipa Nurul Azizah - 247006111030
2. Syaila Fa Agna - 247006111047
3. Sixta Tabia Ritawan - 247006111049

## Prasyarat
Sebelum menjalankan aplikasi, pastikan komputer Anda telah memasang:
- Node.js (versi 18.x atau lebih baru)
- Git

## Penggunaan Langsung
https://enkripsi-kel10.vercel.app/

## Cara Instalasi
1. Kloning repositori ini ke komputer lokal Anda:
   ```bash
   git clone [https://github.com/username-anda/moya.git](https://github.com/username-anda/moya.git)

### Masuk ke direktori proyek:

```bash
cd moya
Instal semua dependensi menggunakan NPM:

```bash
npm install
Konfigurasi Variabel Lingkungan
Untuk menjaga keamanan (tidak ada kunci yang ditulis langsung di kode sumber), buat berkas .env.local di folder utama (root) proyek dan isi dengan kredensial Supabase Anda:

Cuplikan kode
NEXT_PUBLIC_SUPABASE_URL=masukkan_url_proyek_supabase_anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=masukkan_anon_key_supabase_anda
Cara Menjalankan Aplikasi
Setelah instalasi dan pengaturan .env.local selesai, jalankan server pengembangan dengan perintah:

```bash
npm run dev
Buka peramban (browser) dan akses http://localhost:3000.

Contoh Penggunaan
- Registrasi & Login: Buat akun baru di halaman Register. (Autentikasi verifikasi email via SMTP saat ini dinonaktifkan di Supabase untuk mempercepat proses pengujian).
- Membuat Catatan Privat: Masuk ke menu "Private Notes", buat catatan baru. Judul akan disimpan sebagai teks biasa, sedangkan isi catatan akan dienkripsi menjadi teks sandi Base64.
- Unggah Berkas Privat: Masuk ke menu "Private Files", klik tombol tambah, lalu pilih gambar atau dokumen (PDF). Masukkan Master Password saat diminta. Berkas akan dienkripsi di peramban sebelum dikirim ke bucket Supabase.
- Unduh & Dekripsi: Pada berkas yang sudah diunggah, klik "Download & Decrypt", lalu masukkan Master Password yang benar untuk memulihkan dokumen ke bentuk aslinya tanpa kerusakan data (lossless).

- Laboratorium Kriptografi: Masuk ke menu "Crypto Lab" untuk melakukan pengujian integritas (Lossless), perhitungan waktu eksekusi enkripsi/dekripsi, kalkulasi Avalanche Effect, dan perhitungan Shannon Entropy.
