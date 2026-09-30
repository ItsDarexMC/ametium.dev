const APEX = 'ametium.dev';
const CANONICAL_HOST = 'www.ametium.dev';

function rawHost(req) {
    return String(req.headers.host || '').split(':')[0].toLowerCase();
}

function isSiteHost(host) {
    return host === APEX || host === CANONICAL_HOST || host.endsWith('.' + APEX);
}

function publicOrigin(req) {
    const host = rawHost(req);
    if (isSiteHost(host)) return `https://${CANONICAL_HOST}`;
    return `https://${host || CANONICAL_HOST}`;
}

function cookieDomain(req) {
    const host = rawHost(req);
    if (isSiteHost(host)) return '.' + APEX;
    return undefined;
}

module.exports = { APEX, CANONICAL_HOST, rawHost, isSiteHost, publicOrigin, cookieDomain };
