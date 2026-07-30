import { prisma } from '../config/prisma.js';

try {
  await prisma.$queryRaw`SELECT 1`;
  console.log('PostgreSQL connection successful');
} catch (error) {
  console.error('PostgreSQL connection failed:', error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
