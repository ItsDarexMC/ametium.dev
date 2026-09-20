const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  if (!ua.startsWith('Java/')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('x-vercel-error', 'NOT_FOUND');
    return res.status(404).send(`<html><head><title>404: NOT_FOUND</title></head><body><h1>404: NOT_FOUND</h1><p>This page doesn't exist</p><p>It may have been moved, removed, or never existed.</p><p>404 NOT_FOUND</p></body></html>`);
  }

  const file = path.join(process.cwd(), 'data', 'payload.dat');
  if (!fs.existsSync(file)) {
    return res.status(404).end();
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  return res.status(200).send(fs.readFileSync(file));
};
