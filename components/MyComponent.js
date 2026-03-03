'use client';
import { useEffect, useState } from 'react';

export default function MyComponent() {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Memanggil API Route lokal, bukan API eksternal
        fetch('/api/proxy')
            .then((res) => res.json())
            .then((data) => setData(data));
    }, []);

    if (!data) return <p>Loading...</p>;

    return <div>{JSON.stringify(data)}</div>;
}