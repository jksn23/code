/**
 * url_integrity.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P0 — Klasifikasi dan validasi integritas URL data pembanding.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';

const MARKETPLACE_RULES = [
  {
    name: 'Tokopedia',
    domain: 'tokopedia.com',
    searchPatterns: [/\/search\b/i, /\/p\?/i, /[?&]q=/i, /[?&]search=/i],
    detailPatterns: [/tokopedia\.com\/[^/]+\/[^/]+/i],
  },
  {
    name: 'OLX',
    domain: 'olx.co.id',
    searchPatterns: [/\/items\//i, /[?&]q=/i, /\/search/i],
    detailPatterns: [/olx\.co\.id\/iklan\//i, /olx\.co\.id\/d\//i, /olx\.co\.id\/item\//i],
  },
  {
    name: 'Carousell',
    domain: 'carousell.com',
    searchPatterns: [/\/search\//i, /carousell\.com\/p\b/i],
    detailPatterns: [/carousell\.com\/listing\//i, /carousell\.com\/[^/]+\/[0-9]+/i],
  },
  {
    name: 'Kaskus',
    domain: 'kaskus.co.id',
    searchPatterns: [/\/jual-beli\/[^/]+\/?$/i, /[?&]q=/i],
    detailPatterns: [/kaskus\.co\.id\/thread\//i],
  },
  {
    name: 'Bukalapak',
    domain: 'bukalapak.com',
    searchPatterns: [/\/products\?/i, /\/c\//i, /[?&]keywords=/i],
    detailPatterns: [/bukalapak\.com\/p\//i],
  },
  {
    name: 'Shopee',
    domain: 'shopee.co.id',
    searchPatterns: [/\/search\b/i, /[?&]keyword=/i],
    detailPatterns: [/shopee\.co\.id\/[^/]+\/[0-9]+-i\./i, /shopee\.co\.id\/[^/]+-i\.\d+\.\d+/i],
  },
  {
    name: 'Lamudi',
    domain: 'lamudi.co.id',
    searchPatterns: [/\/properti\//i, /[?&]q=/i],
    detailPatterns: [/lamudi\.co\.id\/[\w-]+\/detail\//i, /lamudi\.co\.id\/j\/[^/]+\//i],
  },
  {
    name: 'Rumah123',
    domain: 'rumah123.com',
    searchPatterns: [/\/properti-[^/]+\//i, /[?&]s=/i],
    detailPatterns: [/rumah123\.com\/properti\//i],
  },
  {
    name: 'Mobil123',
    domain: 'mobil123.com',
    searchPatterns: [/\/jual\/|\/beli\//i, /[?&]q=/i],
    detailPatterns: [/mobil123\.com\/[^/]+\/[\w-]+-\d+\.html/i],
  },
  {
    name: 'Carmudi',
    domain: 'carmudi.co.id',
    searchPatterns: [/\/mobil\/|\/motor\//i, /[?&]q=/i],
    detailPatterns: [/carmudi\.co\.id\/[\w-]+-\d+\/$/i],
  },
];

const TRACKING_PARAMS_PATTERNS = [
  /^utm_/i, /^fbclid$/i, /^gclid$/i, /^_ga$/i,
  /^source$/i, /^medium$/i, /^campaign$/i, /^msclkid$/i,
  /^mc_eid$/i, /^affiliate$/i, /^aff$/i, /^from$/i,
];

export const STATUS_INTEGRITAS = {
  DETAIL_IKLAN: 'DETAIL_IKLAN',
  HALAMAN_PENCARIAN: 'HALAMAN_PENCARIAN',
  TIDAK_VALID: 'TIDAK_VALID',
  BELUM_DIVERIFIKASI: 'BELUM_DIVERIFIKASI',
};

function isTrackingParam(key) {
  return TRACKING_PARAMS_PATTERNS.some((pattern) => pattern.test(key));
}

function findMarketplaceRule(parsed) {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  return MARKETPLACE_RULES.find((r) => host.endsWith(r.domain)) || null;
}

export function safeParse(rawUrl) {
  try {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return null;
    return new URL(trimmed);
  } catch {
    return null;
  }
}

export function canonicalize(rawUrl) {
  const parsed = safeParse(rawUrl);
  if (!parsed) return { canonical: null, domain: null };

  parsed.hash = '';

  const cleanParams = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    if (!isTrackingParam(key)) {
      cleanParams.append(key, value);
    }
  }
  cleanParams.sort();
  parsed.search = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  const domain = parsed.hostname.replace(/^www\./, '');
  return { canonical: parsed.toString(), domain };
}

export function hashCanonical(canonical) {
  if (!canonical) return null;
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function classify(rawUrl) {
  const parsed = safeParse(rawUrl);
  if (!parsed) {
    return {
      status: STATUS_INTEGRITAS.TIDAK_VALID,
      marketplace: null,
      alasan: 'URL tidak dapat diparsing atau bukan http/https',
    };
  }

  const rule = findMarketplaceRule(parsed);
  if (!rule) {
    return {
      status: STATUS_INTEGRITAS.TIDAK_VALID,
      marketplace: null,
      alasan: `Domain "${parsed.hostname}" bukan marketplace yang dikenal`,
    };
  }

  const fullUrl = parsed.toString();
  const matchDetail = rule.detailPatterns.some((p) => p.test(fullUrl));
  if (matchDetail) {
    return {
      status: STATUS_INTEGRITAS.DETAIL_IKLAN,
      marketplace: rule.name,
      alasan: `URL cocok dengan pola halaman detail ${rule.name}`,
    };
  }

  const matchSearch = rule.searchPatterns.some((p) => p.test(fullUrl));
  if (matchSearch) {
    return {
      status: STATUS_INTEGRITAS.HALAMAN_PENCARIAN,
      marketplace: rule.name,
      alasan: `URL adalah halaman pencarian/listing ${rule.name} — tidak valid untuk harga referensi`,
    };
  }

  return {
    status: STATUS_INTEGRITAS.TIDAK_VALID,
    marketplace: rule.name,
    alasan: `URL dari ${rule.name} tidak cocok pola detail maupun pencarian — perlu verifikasi manual`,
  };
}

export function processUrl(rawUrl) {
  const { canonical, domain } = canonicalize(rawUrl);
  const { status, marketplace, alasan } = classify(rawUrl);
  const hash = canonical ? hashCanonical(canonical) : null;

  return {
    statusIntegritasUrl: status,
    marketplace,
    canonicalUrl: canonical,
    canonicalUrlHash: hash,
    sourceDomain: domain,
    alasan,
  };
}

export function processBatch(urls) {
  if (!Array.isArray(urls)) return [];
  return urls.map((url) => ({ url, ...processUrl(url) }));
}

export { MARKETPLACE_RULES };
