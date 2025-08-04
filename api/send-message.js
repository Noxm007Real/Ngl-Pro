import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './_firebase.js'; // <-- Impor dari file utilitas
import fetch from 'node-fetch'; // <-- Impor di atas

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }

    const { disguisedId, messageText } = req.body;
    if (!disguisedId || !messageText) {
        return res.status(400).json({ error: 'ID tautan dan pesan dibutuhkan.' });
    }

    try {
        const linkRef = doc(db, 'disguisedLinks', disguisedId);
        const linkDoc = await getDoc(linkRef);

        if (!linkDoc.exists()) {
            return res.status(404).json({ error: 'Tautan tidak valid atau sudah kedaluwarsa.' });
        }

        const linkData = linkDoc.data();
        const now = Date.now();

        if (now > linkData.expiresAt) {
            return res.status(400).json({ error: 'Tautan ini sudah kedaluwarsa.' });
        }

        const lastSent = linkData.lastSent || 0;
        const cooldown = 3 * 60 * 1000; // 3 menit
        if (now - lastSent < cooldown) {
            const remaining = Math.ceil((cooldown - (now - lastSent)) / 1000);
            return res.status(429).json({ error: `Anda hanya bisa mengirim satu pesan setiap 3 menit. Coba lagi dalam ${remaining} detik.` });
        }

        const nglApiUrl = 'https://ngl.link/api/submit';
        const payload = {
            question: messageText,
            username: linkData.nglUsername,
            deviceId: 'fake-device-id-' + Date.now() // Gunakan ID yang sedikit lebih unik
        };

        const nglResponse = await fetch(nglApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Origin': 'https://ngl.link'
            },
            body: JSON.stringify(payload)
        });

        if (!nglResponse.ok) {
            const errorData = await nglResponse.text();
            console.error('Error from NGL API:', errorData);
            return res.status(500).json({ error: 'Gagal mengirim pesan ke NGL.link.' });
        }

        await updateDoc(linkRef, {
            lastSent: now,
        });

        res.status(200).json({ message: 'Pesan berhasil dikirim!' });
    } catch (e) {
        console.error('Error sending message:', e);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengirim pesan.' });
    }
}
