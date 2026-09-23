const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Production Setup...');

  // 1. Create ADMIN Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@apnamart.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ERROR: ADMIN_PASSWORD environment variable is required.');
    process.exit(1);
  }

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Store Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isActive: true
      }
    });
    console.log(`Admin account created: ${adminEmail}`);
  } else {
    console.log(`Admin account already exists: ${adminEmail}`);
  }

  // 2. Configure Store Settings
  const settings = await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {
      storeName: 'Apna Mart',
      storeAddress: 'Gaya Bhagat Chowk, Golma, District - Saharsa, PIN-852107',
      receiptFooter: 'Best Quality Low Price',
    },
    create: {
      id: 'default',
      storeName: 'Apna Mart',
      storeAddress: 'Gaya Bhagat Chowk, Golma, District - Saharsa, PIN-852107',
      receiptFooter: 'Best Quality Low Price',
    }
  });
  console.log('Store settings configured:', settings.storeName);

  console.log('Production setup complete.');
}

main()
  .catch((e) => {
    console.error('Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
