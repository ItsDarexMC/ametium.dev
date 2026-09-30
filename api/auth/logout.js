const { clearCookie } = require('../_lib/cookies');
const { destroySession, COOKIE_NAME } = require('../_lib/session');
const { cookieDomain } = require('../_lib/origin');

module.exports = async (req, res) => {
    await destroySession(req);
    clearCookie(res, COOKIE_NAME, { domain: cookieDomain(req) });
    res.writeHead(302, { Location: '/' });
    res.end();
};
