import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.bobotAHP.deleteMany({});
  console.log('BobotAHP cleared');
}

main().catch(console.error).finally(() => prisma.$disconnect());
