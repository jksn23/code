/**
 * SERVICE: Real Web Scraper menggunakan Puppeteer (Headless Browser)
 *
 * Membuka browser Chromium / Chrome di background, mengeksekusi JavaScript client-side
 * pada situs marketplace asli Indonesia (OLX.co.id, Carmudi.co.id, Jualo.com),
 * dan mengambil data nyata:
 * - Judul Asli Iklan
 * - Harga Aktual dari Penjual
 * - Lokasi Penjual
 * - Direct Link Produk Asli (URL Halaman Detail Produk)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import logger from '../utils/logger.js';

const parsePrice = (priceText) => {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[^0-9]/g, '');
  const val = parseInt(cleaned, 10);
  return isNaN(val) || val <= 0 ? null : val;
};

class PuppeteerScraperService {
  /**
   * Cari Chrome / Edge binary di sistem Windows user
   */
  getSystemExecutablePath() {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Users\\McCrazy\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe'
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  /**
   * Launch browser Chromium Puppeteer dengan executablePath terverifikasi
   */
  async getBrowser() {
    const executablePath = this.getSystemExecutablePath();

    const launchConfig = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800',
        '--lang=id-ID,id',
      ],
    };

    if (executablePath) {
      launchConfig.executablePath = executablePath;
    }

    return await puppeteer.launch(launchConfig);
  }

  /**
   * Scrape OLX Indonesia secara real-time
   */
  async scrapeOLX(keyword, maxItems = 5) {
    let browser = null;
    const results = [];
    const searchUrl = `https://www.olx.co.id/items/q-${encodeURIComponent(keyword).replace(/%20/g, '-')}`;

    try {
      logger.spk('Puppeteer: Membuka browser ke OLX', { keyword, searchUrl });
      browser = await this.getBrowser();
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

      // Wait untuk selector item OLX
      await page.waitForSelector('[data-aut-id="itemBox"]', { timeout: 12000 }).catch(() => null);

      const items = await page.evaluate(() => {
        const boxes = document.querySelectorAll('[data-aut-id="itemBox"]');
        const list = [];

        boxes.forEach((box) => {
          const titleEl = box.querySelector('[data-aut-id="itemTitle"]');
          const priceEl = box.querySelector('[data-aut-id="itemPrice"]');
          const locationEl = box.querySelector('[data-aut-id="item-location"]');
          const linkEl = box.querySelector('a');

          const title = titleEl ? titleEl.innerText.trim() : null;
          const priceStr = priceEl ? priceEl.innerText.trim() : null;
          const location = locationEl ? locationEl.innerText.trim() : null;
          const href = linkEl ? linkEl.getAttribute('href') : null;

          if (title && priceStr && href) {
            list.push({
              title,
              priceStr,
              location,
              href: href.startsWith('http') ? href : `https://www.olx.co.id${href}`,
            });
          }
        });

        return list;
      });

      items.forEach((item) => {
        if (results.length >= maxItems) return;
        const harga = parsePrice(item.priceStr);
        if (harga && item.href) {
          results.push({
            judul: item.title,
            sumber: 'OLX Indonesia',
            sourceUrl: item.href, // Direct URL ke produk spesifik OLX!
            harga,
            lokasi: item.location || 'Indonesia',
          });
        }
      });

      logger.spk('Puppeteer: Scrape OLX berhasil', { total: results.length });
    } catch (err) {
      logger.warn('Puppeteer: Scrape OLX gagal/timeout', { error: err.message });
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }

  /**
   * Scrape Carmudi Indonesia (Khusus Kendaraan)
   */
  async scrapeCarmudi(keyword, maxItems = 5) {
    let browser = null;
    const results = [];
    const searchUrl = `https://www.carmudi.co.id/cars/?q=${encodeURIComponent(keyword)}`;

    try {
      logger.spk('Puppeteer: Membuka browser ke Carmudi', { keyword, searchUrl });
      browser = await this.getBrowser();
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForSelector('.listing-item, article.listing', { timeout: 10000 }).catch(() => null);

      const items = await page.evaluate(() => {
        const boxes = document.querySelectorAll('.listing-item, article.listing, .c-listing__item');
        const list = [];

        boxes.forEach((box) => {
          const titleEl = box.querySelector('.listing-title, .c-listing__title, h2, h3');
          const priceEl = box.querySelector('.listing-price, .c-listing__price, .price');
          const locationEl = box.querySelector('.listing-location, .c-listing__location');
          const linkEl = box.querySelector('a');

          const title = titleEl ? titleEl.innerText.trim() : null;
          const priceStr = priceEl ? priceEl.innerText.trim() : null;
          const location = locationEl ? locationEl.innerText.trim() : null;
          const href = linkEl ? linkEl.getAttribute('href') : null;

          if (title && priceStr && href) {
            list.push({
              title,
              priceStr,
              location,
              href: href.startsWith('http') ? href : `https://www.carmudi.co.id${href}`,
            });
          }
        });

        return list;
      });

      items.forEach((item) => {
        if (results.length >= maxItems) return;
        const harga = parsePrice(item.priceStr);
        if (harga && item.href) {
          results.push({
            judul: item.title,
            sumber: 'Carmudi Indonesia',
            sourceUrl: item.href, // Direct URL ke detail mobil Carmudi!
            harga,
            lokasi: item.location || 'Indonesia',
          });
        }
      });

      logger.spk('Puppeteer: Scrape Carmudi berhasil', { total: results.length });
    } catch (err) {
      logger.warn('Puppeteer: Scrape Carmudi gagal', { error: err.message });
    } finally {
      if (browser) await browser.close();
    }

    return results;
  }

  /**
   * Main entrypoint untuk mengumpulkan real comparable data
   */
  async scrapeAll(asset, keyword) {
    logger.spk('Puppeteer Real Scraping Dimulai', { asetId: asset.id, keyword });

    let allResults = [];

    // Coba OLX dulu
    const olxData = await this.scrapeOLX(keyword, 6);
    allResults.push(...olxData);

    // Jika kendaraan & hasil masih kurang, scrape Carmudi
    if (asset.assetVehicle && allResults.length < 5) {
      const carmudiData = await this.scrapeCarmudi(keyword, 5 - allResults.length);
      allResults.push(...carmudiData);
    }

    return allResults;
  }
}

export const puppeteerScraperService = new PuppeteerScraperService();
