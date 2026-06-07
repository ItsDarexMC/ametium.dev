import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.query.get === '1') {
        const count = await kv.get('addon-pings') || 0;
        return res.status(200).json({ value: count });
    }

    const count = await kv.incr('addon-pings');
    return res.status(200).json({ ok: true, value: count });
}