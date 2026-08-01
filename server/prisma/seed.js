import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
  console.log('Database seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
