import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const kriteriaList = await prisma.kriteria.findMany({
    include: { kategori: true }
  });
  console.log(`\nFound ${kriteriaList.length} criteria in database:`);
  console.log(kriteriaList.map(k => `- ${k.nama} (Kategori: ${k.kategori.nama})`).join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
