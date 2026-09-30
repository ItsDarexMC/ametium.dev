const { parseCookies, setCookie, clearCookie } = require('../_lib/cookies');
const { createSession, COOKIE_NAME, SESSION_DAYS } = require('../_lib/session');
const { publicOrigin, cookieDomain } = require('../_lib/origin');

function redirectTo(res, path, query) {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    res.writeHead(302, { Location: `${path}${qs}` });
    res.end();
}

module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const cookies = parseCookies(req);
        const domain = cookieDomain(req);

        let next = cookies.ametium_oauth_next || '/';
        if (!next.startsWith('/') || next.startsWith('//')) next = '/';

        clearCookie(res, 'ametium_oauth_state', { domain });
        clearCookie(res, 'ametium_oauth_next', { domain });

        if (!code || !state || state !== cookies.ametium_oauth_state) {
            return redirectTo(res, next, { comment_error: 'estado_invalido' });
        }

        const redirectUri = `${publicOrigin(req)}/api/auth/callback`;

        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: '1493461067735633970',
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });
        if (!tokenRes.ok) return redirectTo(res, next, { comment_error: 'token' });
        const token = await tokenRes.json();

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!userRes.ok) return redirectTo(res, next, { comment_error: 'usuario' });
        const user = await userRes.json();

        const avatar = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
            : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

        const session = await createSession({
            discordId: user.id,
            username: user.global_name || user.username,
            avatar,
        });

        setCookie(res, COOKIE_NAME, session.id, {
            maxAge: SESSION_DAYS * 24 * 60 * 60,
            sameSite: 'Lax',
            domain,
        });

        return redirectTo(res, next);
    } catch (err) {
        console.error('Error en /api/auth/callback:', err);
        return redirectTo(res, '/', { comment_error: 'inesperado' });
    }
};
