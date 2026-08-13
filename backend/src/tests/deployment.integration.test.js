import assert from 'node:assert/strict';
import prisma from '../models/prisma.client.js';
import { submitBid } from '../controllers/lelang.controller.js';
import { getProfile } from '../controllers/auth.controller.js';
import { getJobStatus } from '../services/scraping_queue.service.js';

const fixture = {};

const invoke = async (handler, req) => {
  let statusCode = 200;
  let payload;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };
  await handler(req, res);
  return { statusCode, payload };
};

try {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const buyer = await prisma.user.create({
    data: {
      email: `deployment-buyer-${suffix}@test.invalid`,
      password: 'integration-test-only',
      nama: 'Deployment Test Buyer',
      role: 'PEMBELI',
      buyerVerificationStatus: 'APPROVED',
    },
  });
  fixture.buyerId = buyer.id;

  const profile = await invoke(getProfile, { userId: buyer.id });
  assert.equal(profile.statusCode, 200);
  assert.equal(profile.payload.success, true);
  assert.equal(profile.payload.data.email, buyer.email);
  assert.equal('password' in profile.payload.data, false, 'Profile must not expose the password hash');

  const kategori = await prisma.kategori.create({ data: { nama: `Deployment Test ${suffix}` } });
  fixture.kategoriId = kategori.id;
  const aset = await prisma.aset.create({
    data: { nama: 'Deployment Test Asset', kategoriId: kategori.id, hargaPasar: 100000000 },
  });
  fixture.asetId = aset.id;
  await prisma.hasil.create({
    data: { asetId: aset.id, nilaiPreferensi: 0.8, nilaiLimit: 80000000 },
  });
  const lelang = await prisma.lelang.create({
    data: {
      asetId: aset.id,
      status: 'ACTIVE',
      waktuBuka: new Date(Date.now() - 60000),
      waktuTutup: new Date(Date.now() + 3600000),
    },
  });
  fixture.lelangId = lelang.id;

  const accepted = await invoke(submitBid, {
    params: { id: String(lelang.id) },
    body: { nominal: 81000000, userId: 999999 },
    userId: buyer.id,
  });
  assert.equal(accepted.statusCode, 201);
  assert.equal(accepted.payload.success, true);
  assert.equal(accepted.payload.data.userId, buyer.id, 'Identity must come from JWT, not request body');

  const rejected = await invoke(submitBid, {
    params: { id: String(lelang.id) },
    body: { nominal: 80500000 },
    userId: buyer.id,
  });
  assert.equal(rejected.statusCode, 409);

  const job = await prisma.scrapingJob.create({ data: { asetId: aset.id } });
  fixture.jobId = job.id;
  const jobStatus = await getJobStatus(String(job.id));
  assert.equal(jobStatus.status, 'WAITING');
  assert.equal(jobStatus.progress, 0);

  console.log('Deployment integration: REST bidding and MySQL queue status PASSED.');
} catch (error) {
  console.error('Deployment integration FAILED:', error);
  process.exitCode = 1;
} finally {
  if (fixture.jobId) await prisma.scrapingJob.deleteMany({ where: { id: fixture.jobId } }).catch(() => null);
  if (fixture.lelangId) await prisma.lelang.delete({ where: { id: fixture.lelangId } }).catch(() => null);
  if (fixture.asetId) await prisma.aset.delete({ where: { id: fixture.asetId } }).catch(() => null);
  if (fixture.kategoriId) await prisma.kategori.delete({ where: { id: fixture.kategoriId } }).catch(() => null);
  if (fixture.buyerId) await prisma.user.delete({ where: { id: fixture.buyerId } }).catch(() => null);
  await prisma.$disconnect();
}
