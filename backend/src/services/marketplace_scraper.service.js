/**
 * Lightweight marketplace scraper for shared hosting.
 *
 * Uses normal HTTP requests and Cheerio instead of launching Chromium. When a
 * marketplace blocks server-side requests or renders entirely in JavaScript,
 * this service returns no fabricated prices; the application then provides
 * manual search links to the user.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const HTTP_TIMEOUT_MS = Number(process.env.SCRAPER_TIMEOUT_MS || 12000);
const USER_AGENT = process.env.SCRAPER_USER_AGENT
  || 'Mozilla/5.0 (compatible; ELelangComparableBot/1.0; +https://app.e-lelangdigital.my.id)';

const parsePrice = (priceText) => {
  if (!priceText) return null;
  const value = Number.parseInt(String(priceText).replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
};

const absoluteUrl = (baseUrl, href) => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
};

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: HTTP_TIMEOUT_MS,
    maxRedirects: 5,
    responseType: 'text',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'id-ID,id;q=0.9,en;q=0.7',
    },
    validateStatus: (status) => status >= 200 && status < 400,
  });
  return response.data;
}

function collectListings(html, config, maxItems) {
  const $ = cheerio.load(html);
  const results = [];

  $(config.itemSelector).each((_, element) => {
    if (results.length >= maxItems) return false;
    const item = $(element);
    const title = item.find(config.titleSelector).first().text().trim();
    const priceText = item.find(config.priceSelector).first().text().trim();
    const location = item.find(config.locationSelector).first().text().trim();
    const href = item.find(config.linkSelector).first().attr('href');
    const harga = parsePrice(priceText);
    const sourceUrl = absoluteUrl(config.baseUrl, href);

    if (title && harga && sourceUrl) {
      results.push({
        judul: title,
        sumber: config.sourceName,
        sourceUrl,
        harga,
        lokasi: location || 'Indonesia',
      });
    }
    return undefined;
  });

  return results;
}

class MarketplaceScraperService {
  async scrapeOLX(keyword, maxItems = 5) {
    const baseUrl = 'https://www.olx.co.id';
    const searchUrl = `${baseUrl}/items/q-${encodeURIComponent(keyword).replace(/%20/g, '-')}`;
    try {
      const html = await fetchHtml(searchUrl);
      const results = collectListings(html, {
        baseUrl,
        sourceName: 'OLX Indonesia',
        itemSelector: '[data-aut-id="itemBox"]',
        titleSelector: '[data-aut-id="itemTitle"]',
        priceSelector: '[data-aut-id="itemPrice"]',
        locationSelector: '[data-aut-id="item-location"]',
        linkSelector: 'a[href]',
      }, maxItems);
      logger.spk('HTTP scraper OLX selesai', { keyword, total: results.length });
      return results;
    } catch (error) {
      logger.warn('HTTP scraper OLX tidak tersedia', { message: error.message });
      return [];
    }
  }

  async scrapeCarmudi(keyword, maxItems = 5) {
    const baseUrl = 'https://www.carmudi.co.id';
    const searchUrl = `${baseUrl}/cars/?q=${encodeURIComponent(keyword)}`;
    try {
      const html = await fetchHtml(searchUrl);
      const results = collectListings(html, {
        baseUrl,
        sourceName: 'Carmudi Indonesia',
        itemSelector: '.listing-item, article.listing, .c-listing__item',
        titleSelector: '.listing-title, .c-listing__title, h2, h3',
        priceSelector: '.listing-price, .c-listing__price, .price',
        locationSelector: '.listing-location, .c-listing__location',
        linkSelector: 'a[href]',
      }, maxItems);
      logger.spk('HTTP scraper Carmudi selesai', { keyword, total: results.length });
      return results;
    } catch (error) {
      logger.warn('HTTP scraper Carmudi tidak tersedia', { message: error.message });
      return [];
    }
  }

  async scrapeAll(asset, keyword) {
    const results = await this.scrapeOLX(keyword, 6);
    if (asset.assetVehicle && results.length < 5) {
      results.push(...await this.scrapeCarmudi(keyword, 5 - results.length));
    }
    return results;
  }
}

export const marketplaceScraperService = new MarketplaceScraperService();
