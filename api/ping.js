export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };

    if (req.query.get === '1') {
        const now = Date.now();
        const cutoff = now - 30000;

        const response = await fetch(`${url}/keys/heartbeat:*`, { headers });
        const data = await response.json();
        const keys = data.result || [];

        let online = 0;
        for (const key of keys) {
            const r = await fetch(`${url}/get/${key}`, { headers });
            const d = await r.json();
            if (parseInt(d.result) > cutoff) online++;
        }

        return res.status(200).json({ value: online });
    }

    const uuid = req.query.uuid;
    if (!uuid) return res.status(400).json({ error: 'no uuid' });

    await fetch(`${url}/set/heartbeat:${uuid}/${Date.now()}`, { headers });
    await fetch(`${url}/expire/heartbeat:${uuid}/35`, { headers });

    return res.status(200).json({ ok: true });
}
