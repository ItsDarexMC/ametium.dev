const { clearCookie } = require('../_lib/cookies');
const { destroySession, COOKIE_NAME } = require('../_lib/session');
const { cookieDomain } = require('../_lib/origin');
const { setSecurityHeaders } = require('../_lib/headers');

module.exports = async (req, res) => {
    setSecurityHeaders(res);
    await destroySession(req);
    clearCookie(res, COOKIE_NAME, { domain: cookieDomain(req) });
    if (req.method === 'POST') {
        res.status(200).json({ ok: true });
        return;
    }
    res.writeHead(302, { Location: '/' });
    res.end();
};
