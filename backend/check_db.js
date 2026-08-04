import { db } from './src/config/prisma.js';

async function check() {
  const users = await db.user.findMany({ include: { repositories: true } });
  console.log(JSON.stringify(users, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
  process.exit(0);
}

check();
