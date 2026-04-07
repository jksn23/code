import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@lelang.com';
  const password = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: password,
        nama: 'Administrator SPK',
        role: 'ADMIN' // Pastikan role ini terdaftar di schema
      }
    });
    console.log('✅ Akun Admin berhasil dibuat:');
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
  } else {
    console.log('⚠️ Akun Admin sudah ada di database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
