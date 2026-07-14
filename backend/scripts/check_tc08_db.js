import { PrismaClient } from '@prisma/client';
import { pembandingService } from '../src/services/pembanding.service.js';

const prisma = new PrismaClient();

async function main() {
  const assetId = 81; // or query the last created asset with name 'Aset Temp Jurnal'
  const asset = await prisma.aset.findFirst({
    where: { nama: 'Aset Temp Jurnal' },
    include: { dataPembanding: true }
  });

  if (!asset) {
    console.log('No asset with name Aset Temp Jurnal found.');
    return;
  }

  console.log(`=== Tracing Asset ID: ${asset.id} (${asset.nama}) ===`);
  console.log('Data Pembanding count:', asset.dataPembanding.length);
  console.log('Comparables:', JSON.stringify(asset.dataPembanding, null, 2));

  const result = await pembandingService.hitungMedianHargaReferensi(asset.id);
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
