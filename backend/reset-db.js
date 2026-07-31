const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('Cleaning database tables...');

  // Delete all transactional and application data
  await prisma.payout.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.quizScore.deleteMany({});
  await prisma.attendanceLog.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.bootcamp.deleteMany({});

  // Delete developer users
  await prisma.user.deleteMany({
    where: {
      role: 'DEVELOPER',
    },
  });

  console.log('Data tables cleared!');

  console.log('Ensuring default organizer accounts...');
  const salt = await bcrypt.genSalt(10);
  const knownOrganizers = [
    { email: 'organizer@afr.lightning', password: 'Organizer123!', name: 'AFR Lead Organizer', role: 'ORGANIZER' },
    { email: 'admin@afr.lightning', password: 'Admin123!', name: 'AFR Master Admin', role: 'ADMIN' },
  ];

  for (const org of knownOrganizers) {
    const hash = await bcrypt.hash(org.password, salt);
    await prisma.user.upsert({
      where: { email: org.email },
      update: { role: org.role, passwordHash: hash },
      create: {
        email: org.email,
        passwordHash: hash,
        name: org.name,
        role: org.role,
        lightningAddress: `${org.role.toLowerCase()}@getalby.com`,
      },
    });
  }

  console.log('SUCCESS: Database reset complete! You can start over with a fresh database.');
}

resetDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
