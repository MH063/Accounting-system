
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function test() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE username = $1', ['寝室长']);
    client.release();

    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const user = result.rows[0];
    const passwordHash = user.password_hash;
    const password = 'Dormleader123.';

    console.log('Hash:', passwordHash);
    console.log('Password:', password);

    const match = await bcrypt.compare(password, passwordHash);
    console.log('Match result with bcryptjs:', match);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
