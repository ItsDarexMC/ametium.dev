export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    if (req.query.get === '1') {
        const response = await fetch(`${url}/get/addon-pings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        return res.status(200).json({ value: parseInt(data.result) || 0 });
    }

    await fetch(`${url}/incr/addon-pings`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.status(200).json({ ok: true });
}
