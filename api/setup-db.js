const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./_lib/db');
const { setSecurityHeaders } = require('./_lib/headers');

function safeEqual(a, b) {
    const ba = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
}

module.exports = async (req, res) => {
    setSecurityHeaders(res);
    if (process.env.SETUP_DB_DISABLED === '1') {
        res.status(404).end();
        return;
    }

    const url = new URL(req.url, `https://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers['x-setup-token'];
    const expected = process.env.SETUP_DB_TOKEN;

    if (!expected || !safeEqual(token, expected)) {
        res.status(404).end();
        return;
    }

    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <body style="background:#0d0d0d;color:#f5f5f5;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;">
                <form method="POST">
                    <input type="hidden" name="token" value="">
                    <p>Crear/actualizar las tablas de comentarios.</p>
                    <button style="padding:12px 20px;border-radius:8px;border:0;background:#5a0096;color:#fff;font-size:1rem;cursor:pointer;">
                        Ejecutar
                    </button>
                </form>
            </body>
        `);
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'metodo_no_permitido' });
        return;
    }

    try {
        const sql = fs.readFileSync(path.join(__dirname, '_lib', 'schema.sql'), 'utf8');
        await db.query(sql);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <body style="background:#0d0d0d;color:#f5f5f5;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;">
                <p>Listo, las tablas ya existen (o ya existian).</p>
            </body>
        `);
    } catch (err) {
        console.error('Error en /api/setup-db:', err);
        res.status(500).json({ error: 'fallo_migracion' });
    }
};
