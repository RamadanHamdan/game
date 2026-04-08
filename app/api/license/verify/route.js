// app/api/license/verify/route.js
// POST /api/license/verify  (heartbeat + initial check)
// Header: Authorization: Bearer <token>

import { NextResponse } from 'next/server';
import { verifyLicenseToken, findLicenseByKey } from '@/lib/licenseServer';

export async function POST(request) {
    try {
        // 1. Ambil token dari Authorization header
        const authHeader = request.headers.get('authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
            return NextResponse.json({ valid: false, error: 'Token tidak ditemukan.' }, { status: 401 });
        }

        // 2. Verifikasi JWT signature + expiry
        const { valid, payload, error } = await verifyLicenseToken(token);
        if (!valid) {
            return NextResponse.json(
                { valid: false, error: 'Token tidak valid atau sudah kadaluarsa. Silakan aktivasi ulang.' },
                { status: 401 }
            );
        }

        // 3. Double-check: pastikan lisensi masih aktif di database
        // (backend bisa revoke kapan saja, meski token masih belum expired)
        const license = await findLicenseByKey(payload.licenseKey);

        if (!license || !license.is_active) {
            return NextResponse.json(
                { valid: false, error: 'Lisensi telah dinonaktifkan oleh administrator.' },
                { status: 403 }
            );
        }

        // 4. Cek expiry dari database (lebih akurat dari JWT)
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return NextResponse.json(
                { valid: false, error: 'Lisensi sekolah Anda telah kadaluarsa. Silakan perbarui lisensi.' },
                { status: 403 }
            );
        }

        // 5. Semua OK
        return NextResponse.json({
            valid: true,
            school: {
                name: license.school_name,
                type: license.license_type,
                expiresAt: license.expires_at,
            },
        });

    } catch (error) {
        console.error('[License Verify Error]', error);
        return NextResponse.json(
            { valid: false, error: 'Terjadi kesalahan server.' },
            { status: 500 }
        );
    }
}
