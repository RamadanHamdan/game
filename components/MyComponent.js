'use client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const externalUrl = process.env.NEXT_PUBLIC_GEMINI_API_URL;

        if (externalUrl) {
            fetch(externalUrl, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            })
                .then((res) => res.json())
                .then((data) => setData(data))
                .catch((error) => console.error("Gagal load API:", error));
        } else {
            console.warn("NEXT_PUBLIC_GEMINI_API_URL belum disetel di .env");
        }
    }, []);

    if (!data) return <p>Loading...</p>;

    return <div>{JSON.stringify(data)}</div>;
}