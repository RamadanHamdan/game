
// deploy-update.js — EduQuiz OTA Deploy (Windows compatible, NO tar/zip command)
//
// Penggunaan:
//   node scripts/deploy-update.js --version 1.0.3
//   node scripts/deploy-update.js --version 1.0.3 --notes "Fix bug tampilan"
//   node scripts/deploy-update.js                       (auto-increment versi patch)
//   node scripts/deploy-update.js --skip-build          (tanpa rebuild, auto-increment)
//
// Script ini TIDAK memakai tar, zip, atau PowerShell.
// Zip dibuat murni menggunakan Node.js (adm-zip).
// Install dulu: npm install adm-zip --save-dev

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load .env dan .env.local (keduanya mungkin punya key yang berbeda)
dotenv.config({ path: path.join(ROOT, '.env') });
dotenv.config({ path: path.join(ROOT, '.env.local') });

// ── Konfigurasi Supabase ──────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'app-bundles';
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
// ─────────────────────────────────────────────────────────────────────────────

// ── CLI Args Parser ──────────────────────────────────────────────────────────
function parseArgs(argv) {
    const args = argv.slice(2); // skip node & script path
    const result = {
        version: null,
        notes: null,
        skipBuild: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--version' || arg === '-v') {
            result.version = args[++i];
        } else if (arg === '--notes' || arg === '-n') {
            result.notes = args[++i];
        } else if (arg === '--skip-build') {
            result.skipBuild = true;
        } else if (!arg.startsWith('-') && !result.version) {
            // Bare arg tanpa flag → treat sebagai versi HANYA jika valid semver-ish
            if (/^\d+\.\d+/.test(arg)) {
                result.version = arg;
            } else {
                console.warn(`⚠️  Argumen "${arg}" diabaikan (bukan versi valid).`);
                console.warn(`   Gunakan: --version X.Y.Z`);
            }
        }
    }

    return result;
}

/**
 * Auto-increment versi dari version.json yang sudah ada, atau mulai dari 1.0.0
 */
function autoIncrementVersion() {
    const versionPath = path.join(ROOT, 'version.json');
    if (fs.existsSync(versionPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
            if (existing.version && /^\d+\.\d+\.\d+$/.test(existing.version)) {
                const parts = existing.version.split('.').map(Number);
                parts[2] += 1; // increment patch
                return parts.join('.');
            }
        } catch { /* ignore */ }
    }
    return '1.0.0';
}

async function main() {
    const { version: argVersion, notes, skipBuild } = parseArgs(process.argv);

    if (!SUPABASE_KEY) {
        console.error('❌  SUPABASE_SERVICE_ROLE_KEY kosong. Cek file .env kamu.');
        process.exit(1);
    }

    // Tentukan versi: dari arg, atau auto-increment
    const version = argVersion || autoIncrementVersion();

    // Validasi versi: harus mengandung angka dan titik (semver-ish)
    if (!/^\d+\.\d+/.test(version)) {
        console.error(`❌  Versi "${version}" tidak valid.`);
        console.error(`    Gunakan format semver: 1.0.0, 2.1.3, dll.`);
        console.error(`    Contoh: node scripts/deploy-update.js --version 1.0.3`);
        process.exit(1);
    }

    const bundleName = `bundle-${version}.zip`;
    const bundlePath = path.join(ROOT, bundleName);
    const outDir = path.join(ROOT, 'out');

    console.log('\n==========================================');
    console.log(`  EduQuiz OTA Deploy — v${version}`);
    if (notes) console.log(`  Notes   : ${notes}`);
    if (skipBuild) console.log(`  Mode    : Skip Build`);
    console.log('==========================================\n');

    // ── 1. Build ─────────────────────────────────────────────────────────────
    if (!skipBuild) {
        console.log('[1/4] Building Next.js...');
        execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
        if (!fs.existsSync(outDir)) {
            console.error("❌  Folder 'out' tidak ada. Pastikan next.config.js punya output: 'export'");
            process.exit(1);
        }
        console.log('      ✓ Build selesai\n');
    } else {
        console.log('[1/4] Skip build (menggunakan output yang sudah ada)');
        if (!fs.existsSync(outDir)) {
            console.error("❌  Folder 'out' tidak ada. Jalankan build dulu atau hapus --skip-build.");
            process.exit(1);
        }
        console.log('');
    }

    // ── 2. Zip pakai adm-zip (pure Node, tanpa perintah OS apapun) ───────────
    console.log(`[2/4] Zipping → ${bundleName} ...`);
    const AdmZip = await loadAdmZip();
    const zip = new AdmZip();
    addDir(zip, outDir, '');
    zip.writeZip(bundlePath);
    const sizeMB = (fs.statSync(bundlePath).size / 1_048_576).toFixed(2);
    console.log(`      ✓ Zip selesai (${sizeMB} MB)\n`);

    // ── 3. version.json ───────────────────────────────────────────────────────
    console.log('[3/4] Membuat version.json...');
    const versionJson = {
        version,
        url: `${PUBLIC_BASE}/${bundleName}`,
        updatedAt: new Date().toISOString(),
        notes: notes || `Update v${version}`,
    };
    const versionPath = path.join(ROOT, 'version.json');
    fs.writeFileSync(versionPath, JSON.stringify(versionJson, null, 2), 'utf8');
    console.log('      Isi:', JSON.stringify(versionJson, null, 6).replace(/\n/g, '\n      '));
    console.log('      ✓ version.json selesai\n');

    // ── 4. Upload ke Supabase ─────────────────────────────────────────────────
    console.log('[4/4] Upload ke Supabase Storage...');
    await upload(bundlePath, bundleName, 'application/zip');
    await upload(versionPath, 'version.json', 'application/json');

    // ── Cleanup zip lokal (tetap simpan version.json untuk referensi) ─────────
    if (fs.existsSync(bundlePath)) {
        fs.unlinkSync(bundlePath);
    }

    console.log('\n==========================================');
    console.log('  ✅ DEPLOY BERHASIL!');
    console.log('==========================================\n');
    console.log(`  Versi   : ${version}`);
    console.log(`  Notes   : ${notes || `Update v${version}`}`);
    console.log(`  Bundle  : ${PUBLIC_BASE}/${bundleName}`);
    console.log(`  Check   : ${PUBLIC_BASE}/version.json`);
    console.log('\n  Device yang online akan auto-update saat buka app.\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Load adm-zip, kasih pesan jelas kalau belum diinstall */
async function loadAdmZip() {
    try {
        const mod = await import('adm-zip');
        return mod.default ?? mod;
    } catch {
        console.error('\n❌  adm-zip belum diinstall!');
        console.error('    Jalankan dulu: npm install adm-zip --save-dev\n');
        process.exit(1);
    }
}

/** Rekursif tambah semua file dalam folder ke zip */
function addDir(zip, dirPath, zipFolder) {
    for (const name of fs.readdirSync(dirPath)) {
        if (name === '.DS_Store' || name === 'Thumbs.db') continue;
        const full = path.join(dirPath, name);
        if (fs.statSync(full).isDirectory()) {
            addDir(zip, full, zipFolder ? `${zipFolder}/${name}` : name);
        } else {
            zip.addLocalFile(full, zipFolder);
        }
    }
}

/** Upload satu file ke Supabase Storage, overwrite kalau sudah ada */
async function upload(filePath, remoteName, contentType) {
    const buf = fs.readFileSync(filePath);
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${remoteName}`;

    console.log(`      Mengupload ${remoteName} (${(buf.length / 1024).toFixed(0)} KB)...`);

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': contentType,
            'x-upsert': 'true',
        },
        body: buf,
    });

    const text = await res.text();
    if (!res.ok) {
        let detail;
        try { detail = JSON.parse(text); } catch { detail = text; }
        throw new Error(`Upload '${remoteName}' gagal (${res.status}): ${JSON.stringify(detail)}`);
    }
    console.log(`      ✓ ${remoteName} uploaded`);
}

// ─────────────────────────────────────────────────────────────────────────────
main().catch(err => {
    console.log("URL:", process.env.SUPABASE_URL);
    console.log("Key Length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.error('\n❌  Deploy gagal:', err.message ?? err);
    process.exit(1);
});