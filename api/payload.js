const fs = require('fs');
const path = require('path');

const SECRET = process.env.PAYLOAD_SECRET || "ametium-runtime-7f3c";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }
  if (req.headers["x-ametium"] !== SECRET) {
    return res.status(403).end();
  }
  const file = path.join(process.cwd(), "data", "payload.dat");
  if (!fs.existsSync(file)) return res.status(404).end();
  res.setHeader("Content-Type", "application/octet-stream");
  return res.status(200).send(fs.readFileSync(file));
};
