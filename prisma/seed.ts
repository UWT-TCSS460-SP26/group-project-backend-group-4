import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding db with default admin');
  await prisma.user.deleteMany();
  await prisma.user.create({
    data: {
      email: 'admin@localhost',
      username: ' admin',
      role: 'ADMIN',
    },
  });
}

main()
  .catch((e) => {
    console.error(`Error seeding db: ${e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
