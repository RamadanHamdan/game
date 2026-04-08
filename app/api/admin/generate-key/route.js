// app/api/admin/generate-key/route.js
// POST /api/admin/generate-key
// Header: x-admin-secret: <ADMIN_SECRET dari .env.local>
// Body: { schoolName, schoolEmail, licenseType, maxDevices, expiresAt }
//
// Contoh request via Postman / curl:
// curl -X POST http://localhost:3000/api/admin/generate-key \
//   -H "Content-Type: application/json" \
//   -H "x-admin-secret: PASSWORD_ADMIN_ANDA" \
//   -d '{"schoolName":"SMA Negeri 1 Jakarta","schoolEmail":"admin@sman1jkt.sch.id","licenseType":"annual","maxDevices":10,"expiresAt":"2026-12-31"}'

import { NextResponse } from 'next/server';
import { createLicense } from '@/lib/licenseServer';

export async function POST(request) {
    try {
        // 1. Autentikasi admin
        const adminSecret = request.headers.get('x-admin-secret');
        if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse body
        const body = await request.json();
        const {
            schoolName,
            schoolEmail,
            licenseType = 'annual',   // trial | annual | permanent
            maxDevices = 5,
            expiresAt = null,         // format: "2026-12-31" atau null
        } = body;

        if (!schoolName) {
            return NextResponse.json(
                { success: false, error: 'schoolName wajib diisi.' },
                { status: 400 }
            );
        }

        // 3. Buat lisensi baru
        const license = await createLicense({
            schoolName,
            schoolEmail,
            licenseType,
            maxDevices: parseInt(maxDevices),
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        });

        return NextResponse.json({
            success: true,
            license: {
                key: license.key,
                schoolName: license.school_name,
                schoolEmail: license.school_email,
                type: license.license_type,
                maxDevices: license.max_devices,
                expiresAt: license.expires_at,
                createdAt: license.created_at,
            },
            message: `Lisensi berhasil dibuat untuk ${schoolName}. Kirimkan key ini: ${license.key}`,
        });

    } catch (error) {
        console.error('[Admin Generate Key Error]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Terjadi kesalahan server.' },
            { status: 500 }
        );
    }
}
