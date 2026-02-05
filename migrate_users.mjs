import { createConnection } from 'mysql2/promise';
import fs from 'fs';

const connection = await createConnection(process.env.DATABASE_URL);

const sql = fs.readFileSync('recreate_users_table.sql', 'utf8');
const statements = sql.split(';').filter(s => s.trim());

for (const stmt of statements) {
  if (stmt.trim()) {
    console.log('Executing:', stmt.trim().substring(0, 50) + '...');
    await connection.execute(stmt);
  }
}

console.log('✅ Users table recreated successfully!');
await connection.end();
