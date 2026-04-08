// app/api/admin/revoke-key/route.js
// POST /api/admin/revoke-key
// Header: x-admin-secret: <ADMIN_SECRET>
// Body: { key: "XXXX-XXXX-XXXX-XXXX" }
//
// Contoh curl:
// curl -X POST http://localhost:3000/api/admin/revoke-key \
//   -H "x-admin-secret: PASSWORD_ADMIN_ANDA" \
//   -H "Content-Type: application/json" \
//   -d '{"key":"ABCD-EFGH-IJKL-MNOP"}'

import { NextResponse } from 'next/server';
import { revokeLicense } from '@/lib/licenseServer';

export async function POST(request) {
    try {
        // 1. Autentikasi admin
        const adminSecret = request.headers.get('x-admin-secret');
        if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse body
        const { key } = await request.json();
        if (!key) {
            return NextResponse.json({ success: false, error: 'key wajib diisi.' }, { status: 400 });
        }

        // 3. Revoke
        await revokeLicense(key);

        return NextResponse.json({
            success: true,
            message: `Lisensi ${key} berhasil dinonaktifkan. Device yang masih login akan otomatis keluar pada heartbeat berikutnya (maks 10 menit).`,
        });

    } catch (error) {
        console.error('[Admin Revoke Key Error]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Terjadi kesalahan server.' },
            { status: 500 }
        );
    }
}
