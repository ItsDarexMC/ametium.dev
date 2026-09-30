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

    // Diagnóstico: el Client ID de Discord son solo dígitos (17-20).
    const clientId = (process.env.DISCORD_CLIENT_ID || '').trim();
    if (!clientId) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('Falta la variable DISCORD_CLIENT_ID en Vercel (o no se redesplegó después de crearla).');
    }
    if (!/^\d{17,20}$/.test(clientId)) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end(`DISCORD_CLIENT_ID no es válido: tiene ${clientId.length} caracteres y debe ser un número de 17 a 20 dígitos (Discord Developer Portal > OAuth2 > Client ID). Probablemente pegaste el Client Secret u otro valor.`);
    }

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
