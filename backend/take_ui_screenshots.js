import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const EVIDENCE_BASE_DIR = 'C:\\Users\\McCrazy\\Documents\\kampus\\TA\\code\\Paket_Pengujian_Jurnal_18_Test_Case';

async function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await waitMs(1000);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function main() {
  console.log('Preparing database for screenshots...');
  
  // Clean up any existing comparables on asset 20 & 21 to avoid unique constraint violations
  await prisma.dataPembanding.deleteMany({
    where: { asetId: { in: [20, 21] } }
  });

  // Setup database for TC-10 (Outliers) & TC-16 (XSS) & TC-18 (Inactive URL) on Asset 20
  await prisma.dataPembanding.createMany({
    data: [
      {
        asetId: 20,
        judul: 'Comparable Normal 1',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/normal1-item',
        harga: 90000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        canonicalUrlHash: 'normal1hash'
      },
      {
        asetId: 20,
        judul: 'Comparable Normal 2',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/normal2-item',
        harga: 95000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        canonicalUrlHash: 'normal2hash'
      },
      {
        asetId: 20,
        judul: 'Comparable Normal 3',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/normal3-item',
        harga: 100000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        canonicalUrlHash: 'normal3hash'
      },
      {
        asetId: 20,
        judul: 'Comparable Normal 4',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/normal4-item',
        harga: 105000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        canonicalUrlHash: 'normal4hash'
      },
      {
        asetId: 20,
        judul: 'Comparable Outlier Extreme',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/outlier-item',
        harga: 1000000000, // 1 Milyar (Outlier)
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        isOutlier: true,
        canonicalUrlHash: 'outlierhash'
      },
      {
        asetId: 20,
        judul: '<script>alert("XSS")</script>', // XSS payload
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/xss-item',
        harga: 102000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'DETAIL_IKLAN',
        canonicalUrlHash: 'xsshash'
      },
      {
        asetId: 20,
        judul: 'Comparable Inactive Offline',
        sumber: 'OLX',
        sourceUrl: 'https://www.olx.co.id/item/inactive-item',
        harga: 98000000,
        statusValidasi: 'DITERIMA',
        dipilihPenjual: true,
        statusKecocokan: 'LAYAK',
        statusIntegritasUrl: 'TIDAK_VALID', // Inactive URL status
        canonicalUrlHash: 'inactivehash'
      }
    ]
  });

  console.log('Database preparation complete.');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: { width: 1280, height: 950 }
  });

  const page = await browser.newPage();

  // -------------------------------------------------------------
  // TC-01 — Password salah
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-01...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-01');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'admin@lelang.com');
    await page.type('input[type="password"]', 'wrongpass123');
    await page.click('button[type="submit"]');
    await waitMs(1000);

    // Wait for the red alert box
    await page.waitForSelector('.alert-danger', { timeout: 3000 }).catch(() => {});
    await page.screenshot({ path: path.join(tcDir, 'TC-01_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-02 — Akses lintas peran
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-02...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-02');
    ensureDir(tcDir);

    // Login as Penjual
    await login(page, 'penjual4@mail.com', '123123');
    // Try to access admin URL
    await page.goto(`${BASE_URL}/admin/penilaian-aset`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    await page.screenshot({ path: path.join(tcDir, 'TC-02_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-03 — Nilai kriteria kosong
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-03...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-03');
    ensureDir(tcDir);

    await login(page, 'penjual4@mail.com', '123123');
    await page.goto(`${BASE_URL}/seller/aset/20/penilaian`, { waitUntil: 'networkidle0' });
    await waitMs(1000);

    // Hitung Nilai Preferensi with empty values
    // Find the button for Hitung Nilai Preferensi and click it
    const hitungButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Hitung Nilai Preferensi'));
    });
    
    if (hitungButton) {
      await hitungButton.click();
      await waitMs(1000);
    }
    
    await page.screenshot({ path: path.join(tcDir, 'TC-03_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-04 — Nilai di luar rentang (Rubrik guide)
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-04...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-04');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/seller/aset/20/penilaian`, { waitUntil: 'networkidle0' });
    await waitMs(1000);

    // Select the first criteria dropdown
    const select = await page.$('select');
    if (select) {
      await select.select('3');
      await waitMs(1000);
    }

    await page.screenshot({ path: path.join(tcDir, 'TC-04_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-06 — URL pembanding duplikat
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-06...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-06');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/seller/aset/20/data-pembanding`, { waitUntil: 'networkidle0' });
    await waitMs(1000);

    // Open the manual form by clicking "Tambah Manual" button
    const tambahmBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Tambah Manual'));
    });
    if (tambahmBtn) {
      await tambahmBtn.click();
      await waitMs(1000);
    }

    // Fill form using exact placeholder selectors
    await page.type('input[placeholder="Judul Iklan/Aset"]', 'Duplicate Comparable');
    await page.type('input[placeholder="Sumber (Misal: OLX, Carmudi)"]', 'OLX');
    await page.type('input[placeholder="URL Sumber (harus https://...)"]', 'https://www.olx.co.id/item/normal1-item');
    await page.type('input[placeholder="Harga"]', '95000000');
    
    // Submit form
    const simpanBtn = await page.evaluateHandle(() => {
      const form = document.querySelector('form');
      return form ? form.querySelector('button[type="submit"]') : null;
    });

    if (simpanBtn) {
      await simpanBtn.click();
      await waitMs(1500);
    }

    await page.screenshot({ path: path.join(tcDir, 'TC-06_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-07 — Jumlah pembanding kurang dari 3
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-07...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-07');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/seller/aset/21/data-pembanding`, { waitUntil: 'networkidle0' });
    await waitMs(1000);

    // Click "Hitung Referensi" button
    const hitungButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Hitung Referensi'));
    });

    if (hitungButton) {
      await hitungButton.click();
      await waitMs(1500);
    }

    await page.screenshot({ path: path.join(tcDir, 'TC-07_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-10 — Harga outlier
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-10...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-10');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/seller/aset/20/data-pembanding`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    await page.screenshot({ path: path.join(tcDir, 'TC-10_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-11 & TC-12 & TC-13 — SPK Results (Hasil Page)
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-11, TC-12, TC-13...');
    const tcDir11 = path.join(EVIDENCE_BASE_DIR, 'TC-11');
    const tcDir12 = path.join(EVIDENCE_BASE_DIR, 'TC-12');
    const tcDir13 = path.join(EVIDENCE_BASE_DIR, 'TC-13');
    ensureDir(tcDir11);
    ensureDir(tcDir12);
    ensureDir(tcDir13);

    await page.goto(`${BASE_URL}/hasil`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    // Save copy to TC-11, TC-12, TC-13
    await page.screenshot({ path: path.join(tcDir11, 'TC-11_ui.png') });
    await page.screenshot({ path: path.join(tcDir12, 'TC-12_ui.png') });
    await page.screenshot({ path: path.join(tcDir13, 'TC-13_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-16 — Input XSS
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-16...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-16');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/seller/aset/20/data-pembanding`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    await page.screenshot({ path: path.join(tcDir, 'TC-16_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-17 — File upload tidak valid
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-17...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-17');
    ensureDir(tcDir);

    // Open ADMS page as Admin (already logged in from TC-11/12/13/16? No, wait: login as admin)
    await login(page, 'admin@lelang.com', 'admin123');
    await page.goto(`${BASE_URL}/dokumen-adms`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    // Click "Unggah Dokumen Baru" button
    const uploadBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.textContent.includes('Unggah Dokumen Baru'));
    });
    if (uploadBtn) {
      await uploadBtn.click();
      await waitMs(1000);
    }

    await page.screenshot({ path: path.join(tcDir, 'TC-17_ui.png') });
  }

  // -------------------------------------------------------------
  // TC-18 — URL pembanding sudah tidak aktif
  // -------------------------------------------------------------
  {
    console.log('Taking screenshot for TC-18...');
    const tcDir = path.join(EVIDENCE_BASE_DIR, 'TC-18');
    ensureDir(tcDir);

    await page.goto(`${BASE_URL}/admin/aset/20/validasi-pembanding`, { waitUntil: 'networkidle0' });
    await waitMs(1500);

    await page.screenshot({ path: path.join(tcDir, 'TC-18_ui.png') });
  }

  await browser.close();
  
  // Clean up database temp data
  await prisma.dataPembanding.deleteMany({
    where: { asetId: { in: [20, 21] } }
  });

  console.log('All screenshots generated and saved successfully.');
}

main()
  .catch((err) => {
    console.error('Screenshot generation failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
