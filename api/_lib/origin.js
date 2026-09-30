const APEX = 'ametium.dev';

function rawHost(req) {
    return String(req.headers.host || '').split(':')[0].toLowerCase();
}

function isSiteHost(host) {
    return host === APEX || host === 'www.' + APEX || host.endsWith('.' + APEX);
}

function publicOrigin(req) {
    const host = rawHost(req);
    if (isSiteHost(host)) return `https://${host}`;
    return `https://${host || APEX}`;
}

function cookieDomain(req) {
    const host = rawHost(req);
    if (isSiteHost(host)) return '.' + APEX;
    return undefined;
}

module.exports = { APEX, rawHost, isSiteHost, publicOrigin, cookieDomain };
