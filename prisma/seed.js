const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({});

async function main() {
  console.log('Starting database seed...');

  // Create default Super Admin if it doesn't exist
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { username: 'superadmin' },
  });

  if (!existingSuperAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
      data: {
        username: 'superadmin',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log('Created default Super Admin user (superadmin / admin123)');
  } else {
    console.log('Super Admin user already exists.');
  }

  // Create default GN Divisions if none exist
  const count = await prisma.gnDivision.count();
  if (count === 0) {
    await prisma.gnDivision.createMany({
      data: [
        { name: 'GND-001 Colombo' },
        { name: 'GND-002 Kandy' },
        { name: 'GND-003 Galle' },
      ],
    });
    console.log('Created sample GN Divisions.');
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
