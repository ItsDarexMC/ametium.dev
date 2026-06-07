export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
 
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    const headers = { Authorization: `Bearer ${token}` };
 
    if (req.query.get === '1') {
        let cursor = 0;
        let count = 0;
 
        do {
            const response = await fetch(`${url}/scan/${cursor}?match=heartbeat:*&count=100`, { headers });
            const data = await response.json();
            cursor = data.result[0];
            count += data.result[1].length;
        } while (cursor !== '0' && cursor !== 0);
 
        return res.status(200).json({ value: count });
    }
 
    const uuid = req.query.uuid;
    if (!uuid) return res.status(400).json({ error: 'no uuid' });
 
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) return res.status(400).json({ error: 'uuid inválido' });
 
    await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify([
            ['SET', `heartbeat:${uuid}`, Date.now()],
            ['EXPIRE', `heartbeat:${uuid}`, 35]
        ])
    });
 
    return res.status(200).json({ ok: true });
} y aca?
