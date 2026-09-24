const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_5aLpvIE1dZcV@ep-summer-feather-b494jurx-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function run() {
  try {
    console.log('Connecting to DB...');
    const res = await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock(72707369)');
    console.log('Unlock 72707369:', res);
    const res2 = await prisma.$executeRawUnsafe('SELECT pg_advisory_unlock_all()');
    console.log('Unlock all:', res2);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
