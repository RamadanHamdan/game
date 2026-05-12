# Ringkasan Pengembangan Sistem Update (OTA) EduQuiz
*Terakhir diperbarui: 12 Mei 2026*

## 1. Masalah Utama: Update Tidak Terdeteksi di Perangkat Lain
- **Masalah:** Aplikasi selalu mendeteksi "Sudah versi terbaru" meskipun ada perubahan pada source code lokal.
- **Penyebab:** Konfigurasi lama menggunakan `@capgo/capacitor-updater` dengan `autoUpdate: true`, yang bergantung pada server cloud Capgo. Karena developer tidak pernah mengupload bundle zip ke cloud Capgo, aplikasi tidak pernah mendeteksi versi baru.
- **Solusi:** Mengubah arsitektur menjadi **Self-Hosted Update** menggunakan Supabase Storage (public bucket).

## 2. Masalah Build saat `npm run cap:sync`
- **Masalah:** Error karena API route `/api/app-update` tidak kompatibel dengan `output: 'export'`.
- **Solusi:** Folder route dihapus. UpdateManager sekarang fetch langsung dari Supabase Storage public URL.

## 3. Masalah Tampilan Rollback & Ekstraksi ZIP
- **Masalah:** Update diterapkan sesaat lalu rollback — CSS/JS tidak termuat.
- **Penyebab:** (1) Format ZIP dari PowerShell tidak kompatibel. (2) Versi tersimpan sebelum restart.
- **Solusi:** (1) Gunakan adm-zip (Node.js). (2) Versi di-track via CapacitorUpdater.current() bukan localStorage.

## 4. Masalah Deploy: `Invalid Compact JWS`
- **Masalah:** Upload gagal dengan error auth.
- **Penyebab:** (1) dotenv hanya load `.env` tanpa `.env.local`. (2) Content-Type salah. (3) Self-referencing fallback.
- **Solusi:** Load kedua file env, kirim Content-Type yang benar per file.

## 5. Masalah: Bucket Private & Tombol Update Hilang
- **Masalah:** (1) version.json dan bundle.zip tidak bisa diakses publik. (2) Tombol update hilang dari UI.
- **Penyebab:** (1) Supabase bucket `app-bundles` private. (2) UpdateManager return null tanpa UI.
- **Solusi:** ✅ Bucket diubah ke public. ✅ UpdateManager ditulis ulang dengan UI lengkap.

---

## ✅ Status Saat Ini (RESOLVED)

### Arsitektur Final:
```
Developer edit code → node scripts/deploy-update.js 1.1.0
  → Build Next.js → Zip dengan adm-zip → Upload ke Supabase Storage
  → Upload version.json → SELESAI

Device buka app → UpdateManager mount → notifyAppReady()
  → Delay 3s → Fetch version.json (public URL)
  → Bandingkan versi → Download bundle zip → CapacitorUpdater.set()
  → App reload → Bundle baru → notifyAppReady() → Stabil
```

### File-file Kunci:
- `components/UpdateManager.jsx` — Komponen OTA dengan UI lengkap (tombol + toast)
- `scripts/deploy-update.js` — Script deploy: build → zip → upload Supabase
- `capacitor.config.ts` — autoUpdate: false (manual mode)
- `.env` / `.env.local` — SUPABASE_SERVICE_ROLE_KEY untuk deploy

### URL Publik:
- version.json: https://xqaxqjipgijsyxrweyal.supabase.co/storage/v1/object/public/app-bundles/version.json
- Bundle: https://xqaxqjipgijsyxrweyal.supabase.co/storage/v1/object/public/app-bundles/bundle-{version}.zip

### Cara Deploy Update:
```bash
node scripts/deploy-update.js 1.2.0
```

### Yang Perlu Dilakukan:
1. Build APK baru (`npm run cap:sync` sudah, tinggal build APK via Android Studio)
2. Install APK baru di device
3. Test: buka app → tombol update muncul di kiri bawah → cek update otomatis 3 detik setelah buka
