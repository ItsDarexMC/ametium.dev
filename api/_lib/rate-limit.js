const buckets = new Map();

function prune(now) {
    if (buckets.size < 4000) return;
    for (const [k, hits] of buckets) {
        const next = hits.filter((t) => now - t < 15 * 60 * 1000);
        if (next.length) buckets.set(k, next);
        else buckets.delete(k);
    }
}

function clientIp(req) {
    const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return xf || String(req.headers['x-real-ip'] || '') || '0.0.0.0';
}

function tooMany(key, limit, windowMs) {
    const now = Date.now();
    prune(now);
    const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
    if (hits.length >= limit) {
        buckets.set(key, hits);
        return true;
    }
    hits.push(now);
    buckets.set(key, hits);
    return false;
}

module.exports = { clientIp, tooMany };
