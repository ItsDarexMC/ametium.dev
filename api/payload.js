const GITHUB_RAW_DAT = 'https://raw.githubusercontent.com/ItsDarexMC/AmetiumDevelopment/main/data/payload.dat';
const GITHUB_RAW_SIG = 'https://raw.githubusercontent.com/ItsDarexMC/AmetiumDevelopment/main/data/payload.dat.sig';

module.exports = async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (!ua.startsWith('Java/')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send('Not found');
  }

  const wantsSig = req.query && (req.query.sig === '1' || req.query.sig === 'true');
  const upstreamUrl = wantsSig ? GITHUB_RAW_SIG : GITHUB_RAW_DAT;

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: { 'User-Agent': 'ametium-payload-proxy' },
      cache: 'no-store'
    });
  } catch (err) {
    return res.status(502).end();
  }

  if (!upstream.ok) {
    return res.status(upstream.status === 404 ? 404 : 502).end();
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  res.setHeader('Content-Type', 'application/octet-stream');
  return res.status(200).send(buf);
};
