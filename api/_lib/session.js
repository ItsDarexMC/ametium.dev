const crypto = require('crypto');
const db = require('./db');
const { parseCookies } = require('./cookies');

const COOKIE_NAME = 'ametium_session';
const SESSION_DAYS = 30;

function randomId() {
    return crypto.randomBytes(24).toString('hex');
}

// Guardamos un hash del id en la base de datos, no el valor crudo. Así, si
// alguna vez alguien lee la base de datos (un backup filtrado, un bug, etc.)
// no obtiene cookies de sesión listas para usar.
function hash(id) {
    return crypto.createHash('sha256').update(id).digest('hex');
}

async function createSession({ discordId, username, avatar }) {
    const id = randomId();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await db.query(
        `insert into comment_sessions (id, discord_id, username, avatar, expires_at)
         values ($1, $2, $3, $4, $5)`,
        [hash(id), discordId, username, avatar, expiresAt]
    );
    return { id, expiresAt }; // el id sin hashear es el que va en la cookie
}

/** Lee la cookie de la petición y devuelve la sesión (o null). */
async function getSession(req) {
    const cookies = parseCookies(req);
    const id = cookies[COOKIE_NAME];
    if (!id) return null;

    const { rows } = await db.query(
        `select * from comment_sessions where id = $1 and expires_at > now() limit 1`,
        [hash(id)]
    );
    if (rows.length === 0) return null;
    return rows[0];
}

async function destroySession(req) {
    const cookies = parseCookies(req);
    const id = cookies[COOKIE_NAME];
    if (!id) return;
    await db.query(`delete from comment_sessions where id = $1`, [hash(id)]);
}

module.exports = { COOKIE_NAME, SESSION_DAYS, createSession, getSession, destroySession };
