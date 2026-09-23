require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  });

  if (existingAdmin) {
    console.log(`Admin user with email ${email} already exists.`);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'ADMIN'
    }
  });

  console.log(`Successfully created admin user: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
