const crypto = require('crypto');
const { setCookie } = require('../_lib/cookies');
const { publicOrigin, cookieDomain } = require('../_lib/origin');
const { setSecurityHeaders } = require('../_lib/headers');
const { clientIp, tooMany } = require('../_lib/rate-limit');

module.exports = async (req, res) => {
    setSecurityHeaders(res);
    if (tooMany('login:' + clientIp(req), 20, 10 * 60 * 1000)) {
        res.status(429).end('Too many requests');
        return;
    }
    const state = crypto.randomBytes(16).toString('hex');
    const domain = cookieDomain(req);
    setCookie(res, 'ametium_oauth_state', state, { maxAge: 60 * 5, sameSite: 'Lax', domain });

    const url = new URL(req.url, `https://${req.headers.host}`);
    let next = url.searchParams.get('next') || '/';
    if (!next.startsWith('/') || next.startsWith('//')) next = '/';
    setCookie(res, 'ametium_oauth_next', next, { maxAge: 60 * 5, sameSite: 'Lax', domain });

    const redirectUri = `${publicOrigin(req)}/api/auth/callback`;

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
