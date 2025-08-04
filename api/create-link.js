import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from './_firebase.js'; // <-- Impor dari file utilitas

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan.' });
    }

    const { nglUsername } = req.body;
    if (!nglUsername) {
        return res.status(400).json({ error: 'Nama pengguna NGL dibutuhkan.' });
    }

    try {
        const { nanoid } = await import('nanoid');
        const disguisedId = nanoid(10);
        const expirationTimestamp = Date.now() + 48 * 60 * 60 * 1000; // 48 jam

        const linkRef = doc(db, 'disguisedLinks', disguisedId);
        await setDoc(linkRef, {
            nglUsername,
            createdAt: Date.now(),
            expiresAt: expirationTimestamp,
        });

        const counterRef = doc(db, 'stats', 'userCounter');
        const counterDoc = await getDoc(counterRef);

        if (!counterDoc.exists()) {
            await setDoc(counterRef, { count: 1 });
        } else {
            await updateDoc(counterRef, {
                count: increment(1),
            });
        }

        res.status(200).json({ disguisedId });
    } catch (e) {
        console.error('Error creating disguised link:', e);
        res.status(500).json({ error: 'Terjadi kesalahan saat membuat tautan.' });
    }
}
