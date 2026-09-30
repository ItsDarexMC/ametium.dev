const db = require('./_lib/db');
const { getSession } = require('./_lib/session');
const { containsBadWord } = require('./_lib/profanity');
const { setSecurityHeaders } = require('./_lib/headers');
const { clientIp, tooMany } = require('./_lib/rate-limit');

const MAX_LEN = 500;
let ratingReady = false;

function parseRating(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const stepped = Math.round(n * 2) / 2;
    if (stepped < 0.5 || stepped > 5) return null;
    return stepped;
}

async function ensureRatingColumn() {
    if (ratingReady) return;
    await db.query(`alter table comments add column if not exists rating numeric(2,1)`);
    ratingReady = true;
}

function mapComments(rows, myDiscordId) {
    return rows.map((r) => ({
        id: r.id,
        username: r.username,
        avatar: r.avatar,
        body: r.body,
        rating: r.rating == null ? null : Number(r.rating),
        created_at: r.created_at,
        mine: Boolean(myDiscordId && r.discord_id === myDiscordId),
    }));
}

module.exports = async (req, res) => {
    setSecurityHeaders(res);

    if (req.method === 'GET') {
        try {
            await ensureRatingColumn();
            const session = await getSession(req);
            const { rows } = await db.query(
                `select id, discord_id, username, avatar, body, rating, created_at
                 from comments
                 order by created_at desc
                 limit 200`
            );
            res.status(200).json({ comments: mapComments(rows, session && session.discord_id) });
        } catch (err) {
            console.error('Error en GET /api/comments:', err);
            res.status(500).json({ error: 'error_servidor' });
        }
        return;
    }

    const ip = clientIp(req);
    const session = await getSession(req);
    if (!session) {
        res.status(401).json({ error: 'no_autenticado' });
        return;
    }

    if (req.method === 'POST') {
        if (tooMany('post:ip:' + ip, 8, 10 * 60 * 1000) ||
            tooMany('post:user:' + session.discord_id, 3, 10 * 60 * 1000)) {
            res.status(429).json({ error: 'rate_limit' });
            return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        if (body.length > 8000) {
            res.status(413).json({ error: 'muy_largo' });
            return;
        }
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
            await ensureRatingColumn();
            const { rows } = await db.query(
                `insert into comments (discord_id, username, avatar, body, rating)
                 values ($1, $2, $3, $4, $5)
                 returning id, discord_id, username, avatar, body, rating, created_at`,
                [session.discord_id, session.username, session.avatar, text, rating]
            );
            const comment = mapComments(rows, session.discord_id)[0];
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
        if (tooMany('del:ip:' + ip, 10, 10 * 60 * 1000)) {
            res.status(429).json({ error: 'rate_limit' });
            return;
        }
        await db.query(`delete from comments where discord_id = $1`, [session.discord_id]);
        res.status(200).json({ ok: true });
        return;
    }

    res.status(405).json({ error: 'metodo_no_permitido' });
};
