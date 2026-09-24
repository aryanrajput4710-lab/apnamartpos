const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5aLpvIE1dZcV@ep-summer-feather-b494jurx-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query('SELECT pg_advisory_unlock(72707369)');
    console.log('Unlock result:', res.rows);
    const res2 = await client.query('SELECT pg_advisory_unlock_all()');
    console.log('Unlock all result:', res2.rows);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}
run();
