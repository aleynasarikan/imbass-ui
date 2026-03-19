const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/Users/aleyn/OneDrive/Masaüstü/imbass-ui/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
