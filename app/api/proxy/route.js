import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const externalUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL;

    try {
        const response = await fetch(externalUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`, // Atau sesuaikan dengan format API-nya
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // Kirim data ke frontend tanpa menyertakan API Key
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
    }
}