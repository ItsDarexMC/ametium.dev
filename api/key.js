const { Client } = require('pg');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { license_key, hwid } = req.body || {};
  if (!license_key || !hwid) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(
      'SELECT * FROM licenses WHERE license_key = $1 AND active = true',
      [license_key]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'invalid license' });
    }

    let license = result.rows[0];

    if (!license.hwid) {
      await client.query('UPDATE licenses SET hwid = $1 WHERE id = $2', [hwid, license.id]);
    } else if (license.hwid !== hwid) {
      return res.status(403).json({ error: 'hwid mismatch' });
    }

    if (!license.secret) {
      const newSecret = crypto.randomBytes(32).toString('hex');
      await client.query('UPDATE licenses SET secret = $1 WHERE id = $2', [newSecret, license.id]);
      license.secret = newSecret;
    }

    return res.status(200).json({ ok: true, session_key: license.secret });
  } finally {
    await client.end();
  }
};
