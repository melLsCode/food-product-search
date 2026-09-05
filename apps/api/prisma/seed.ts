import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * The application has exactly one demo user. Seeding is an upsert so it can be
 * run repeatedly against an existing database without creating duplicates.
 */
const DEMO_USER = {
  email: 'demo@food-product-search.local',
  name: 'Demo User',
};

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: { name: DEMO_USER.name },
    create: DEMO_USER,
  });

  console.log(`Seeded demo user ${user.email} (id: ${user.id})`);
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
