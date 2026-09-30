const db = require('./_lib/db');
const { getSession } = require('./_lib/session');

const MAX_LEN = 500;

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        const { rows } = await db.query(
            `select id, username, avatar, body, created_at
             from comments
             order by created_at desc
             limit 200`
        );
        res.status(200).json({ comments: rows });
        return;
    }

    const session = await getSession(req);
    if (!session) {
        res.status(401).json({ error: 'no_autenticado' });
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        let data;
        try {
            data = JSON.parse(body || '{}');
        } catch {
            res.status(400).json({ error: 'json_invalido' });
            return;
        }

        const text = (data.body || '').trim();
        if (!text) {
            res.status(400).json({ error: 'falta_texto' });
            return;
        }
        if (text.length > MAX_LEN) {
            res.status(400).json({ error: 'muy_largo' });
            return;
        }

        try {
            const { rows } = await db.query(
                `insert into comments (discord_id, username, avatar, body)
                 values ($1, $2, $3, $4)
                 returning id, username, avatar, body, created_at`,
                [session.discord_id, session.username, session.avatar, text]
            );
            res.status(201).json({ comment: rows[0] });
        } catch (err) {
            // 23505 = unique_violation: la tabla "comments" tiene un unique(discord_id),
            // así que esto es lo que de verdad impide más de un comentario por cuenta,
            // aunque lleguen dos peticiones al mismo tiempo.
            if (err.code === '23505') {
                res.status(409).json({ error: 'ya_comentaste' });
                return;
            }
            console.error('Error en POST /api/comments:', err);
            res.status(500).json({ error: 'error_servidor' });
        }
        return;
    }

    if (req.method === 'DELETE') {
        await db.query(`delete from comments where discord_id = $1`, [session.discord_id]);
        res.status(200).json({ ok: true });
        return;
    }

    res.status(405).json({ error: 'metodo_no_permitido' });
};
