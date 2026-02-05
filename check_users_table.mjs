import { getDb } from './server/db.ts';

const db = await getDb();
const result = await db.execute('DESCRIBE users');
console.log(JSON.stringify(result, null, 2));
