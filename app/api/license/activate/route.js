// app/api/license/activate/route.js
// POST /api/license/activate
// Body: { key: "XXXX-XXXX-XXXX-XXXX", fingerprint: "abc123" }

import { NextResponse } from 'next/server';
import {
    findLicenseByKey,
    countActiveDevices,
    upsertActivation,
    signLicenseToken,
} from '@/lib/licenseServer';

export async function POST(request) {
    try {
        const body = await request.json();
        const { key, fingerprint } = body;

        // 1. Validasi input
        if (!key || !fingerprint) {
            return NextResponse.json(
                { success: false, error: 'Key dan fingerprint wajib diisi.' },
                { status: 400 }
            );
        }

        // 2. Cari lisensi di database
        const license = await findLicenseByKey(key);
        if (!license) {
            return NextResponse.json(
                { success: false, error: 'Kode lisensi tidak ditemukan. Periksa kembali kode Anda.' },
                { status: 404 }
            );
        }

        // 3. Cek apakah lisensi masih aktif
        if (!license.is_active) {
            return NextResponse.json(
                { success: false, error: 'Lisensi ini telah dinonaktifkan. Hubungi administrator.' },
                { status: 403 }
            );
        }

        // 4. Cek expiry
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return NextResponse.json(
                { success: false, error: `Lisensi sudah kadaluarsa sejak ${new Date(license.expires_at).toLocaleDateString('id-ID')}.` },
                { status: 403 }
            );
        }

        // 5. Cek batas device — kecuali device ini sudah pernah aktivasi
        const deviceCount = await countActiveDevices(license.id);
        // (upsertActivation akan handle jika device sudah ada)
        if (deviceCount >= license.max_devices) {
            // Cek dulu apakah fingerprint ini sudah terdaftar (returning device)
            // Ini ditangani di dalam upsertActivation dengan fallthrough
        }

        // 6. Upsert aktivasi device ini (juga validasi apakah melebihi limit)
        let activation;
        try {
            // Jika device baru dan sudah penuh, reject
            const isNewDevice = true; // kita cek di upsertActivation
            if (deviceCount >= license.max_devices) {
                // Coba upsert dulu — kalau device lama, akan berhasil
                // kalau device baru, kita tampilkan error
                activation = await upsertActivation(license.id, fingerprint);
                // Jika sampai sini berarti device ini sudah terdaftar sebelumnya (returning)
            } else {
                activation = await upsertActivation(license.id, fingerprint);
            }
        } catch (e) {
            if (e.message.includes('diblokir')) {
                return NextResponse.json({ success: false, error: e.message }, { status: 403 });
            }
            // Kemungkinan besar device baru tapi sudah penuh
            return NextResponse.json(
                {
                    success: false,
                    error: `Lisensi ini sudah mencapai batas maksimum ${license.max_devices} perangkat. Hubungi administrator untuk menambah kuota.`
                },
                { status: 403 }
            );
        }

        // 7. Sign JWT token
        const token = await signLicenseToken({
            licenseId: license.id,
            licenseKey: license.key,
            schoolName: license.school_name,
            fingerprint,
            licenseType: license.license_type,
        });

        // 8. Return token + info sekolah
        return NextResponse.json({
            success: true,
            token,
            school: {
                name: license.school_name,
                type: license.license_type,
                expiresAt: license.expires_at,
            },
        });

    } catch (error) {
        console.error('[License Activate Error]', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server. Coba lagi nanti.' },
            { status: 500 }
        );
    }
}
