const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        const url = process.env.DATABASE_URL || '';
        pool = new Pool({
            connectionString: url,
            ssl: url.includes('localhost') ? false : { rejectUnauthorized: true },
            max: 3,
        });
    }
    return pool;
}

async function query(text, params) {
    return getPool().query(text, params);
}

module.exports = { query };
