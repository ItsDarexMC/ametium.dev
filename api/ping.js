export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };

    if (req.query.get === '1') {
        const response = await fetch(`${url}/dbsize`, { headers });
        const data = await response.json();
        return res.status(200).json({ value: data.result || 0 });
    }

    const uuid = req.query.uuid;
    if (!uuid) return res.status(400).json({ error: 'no uuid' });

    await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify([
            ['SET', `heartbeat:${uuid}`, Date.now()],
            ['EXPIRE', `heartbeat:${uuid}`, 35]
        ])
    });

    return res.status(200).json({ ok: true });
}
