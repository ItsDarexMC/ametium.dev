const fs = require('fs');
const path = require('path');
module.exports = async (req, res) => {
  const file = path.join(process.cwd(), 'data', 'payload.dat');
  if (!fs.existsSync(file)) {
    return res.status(404).json({ error: 'no payload' });
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  return res.status(200).send(fs.readFileSync(file));
};
