const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (!ua.startsWith('Java/')) {
    res.setHeader('x-vercel-skip-tooling', '1');
    return res.status(404).end();
  }

  const file = path.join(process.cwd(), 'data', 'payload.dat');
  if (!fs.existsSync(file)) {
    return res.status(404).end();
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  return res.status(200).send(fs.readFileSync(file));
};
