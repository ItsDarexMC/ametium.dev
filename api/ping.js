export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
 
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
 
    const TTL = 1; 
 
    async function kv(commands) {
        const r = await fetch(`${url}/pipeline`, {
            method: 'POST',
            headers,
            body: JSON.stringify(commands)
        });
        return r.json();
    }
 
    if (req.query.get === '1') {
        const now = Date.now();
        const expiredBefore = now - TTL * 1000;
 
        const result = await kv([
            ['ZREMRANGEBYSCORE', 'active_users', '-inf', expiredBefore],
            ['ZCARD', 'active_users']
        ]);
 
        const count = result?.[1]?.result ?? 0;
        return res.status(200).json({ value: count });
    }
 
    const uuid = req.query.uuid;
    if (!uuid) return res.status(400).json({ error: 'no uuid' });
 
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) return res.status(400).json({ error: 'uuid invalido' });
 
    await kv([
        ['ZADD', 'active_users', Date.now(), uuid]
    ]);
 
    return res.status(200).json({ ok: true });
}
 
