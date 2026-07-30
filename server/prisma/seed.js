import { PrismaClient } from '@prisma/client';
import { seedInstrumentSpecifications } from './instrumentSeedData.js';

const prisma = new PrismaClient();

async function main() {
  const instrumentCount = await seedInstrumentSpecifications(prisma);
  const accountCount = await prisma.account.count();
  if (!accountCount) {
    await prisma.account.create({
      data: {
        name: 'Personal Trading Account',
        initialCapital: '10000.00',
        currency: 'USD'
      }
    });
  }
  console.log(`Seeded or updated ${instrumentCount} instrument specifications.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
