const { getSession } = require('./_lib/session');
const db = require('./_lib/db');
const { setSecurityHeaders } = require('./_lib/headers');

module.exports = async (req, res) => {
    setSecurityHeaders(res);
    const session = await getSession(req);
    if (!session) {
        res.status(200).json({ authenticated: false });
        return;
    }

    const { rows } = await db.query(
        `select id from comments where discord_id = $1 limit 1`,
        [session.discord_id]
    );

    res.status(200).json({
        authenticated: true,
        user: { username: session.username, avatar: session.avatar },
        hasCommented: rows.length > 0,
    });
};
