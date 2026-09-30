const db = require('./_lib/db');
const { getSession } = require('./_lib/session');
const { containsBadWord } = require('./_lib/profanity');

const MAX_LEN = 500;

function parseRating(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const stepped = Math.round(n * 2) / 2;
    if (stepped < 0.5 || stepped > 5) return null;
    return stepped;
}

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        const { rows } = await db.query(
            `select id, username, avatar, body, rating, created_at
             from comments
             order by created_at desc
             limit 200`
        );
        res.status(200).json({
            comments: rows.map((r) => ({
                ...r,
                rating: r.rating == null ? null : Number(r.rating),
            })),
        });
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
        if (containsBadWord(text) || containsBadWord(session.username || '')) {
            res.status(400).json({ error: 'contenido_no_permitido' });
            return;
        }

        const rating = parseRating(data.rating);
        if (rating == null) {
            res.status(400).json({ error: 'falta_rating' });
            return;
        }

        try {
            const { rows } = await db.query(
                `insert into comments (discord_id, username, avatar, body, rating)
                 values ($1, $2, $3, $4, $5)
                 returning id, username, avatar, body, rating, created_at`,
                [session.discord_id, session.username, session.avatar, text, rating]
            );
            const comment = rows[0];
            comment.rating = Number(comment.rating);
            res.status(201).json({ comment });
        } catch (err) {
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
