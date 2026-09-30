const crypto = require('crypto');
const { setCookie } = require('../_lib/cookies');

module.exports = async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    setCookie(res, 'ametium_oauth_state', state, { maxAge: 60 * 5 });

    const url = new URL(req.url, `https://${req.headers.host}`);
    let next = url.searchParams.get('next') || '/';
    if (!next.startsWith('/') || next.startsWith('//')) next = '/'; // evita open redirect
    setCookie(res, 'ametium_oauth_next', next, { maxAge: 60 * 5 });

    const redirectUri = `https://${req.headers.host}/api/auth/callback`;

    // Client ID de Discord (público, no es un secreto).
    const clientId = '1493461067735633970';

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'identify',
        state,
        prompt: 'consent',
    });

    res.writeHead(302, { Location: `https://discord.com/oauth2/authorize?${params.toString()}` });
    res.end();
};
