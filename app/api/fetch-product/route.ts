import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function cleanText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim();
}

function extractJsonLd($: cheerio.CheerioAPI) {
  let result: any = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).text().trim();
      if (!raw) return;
      const json = JSON.parse(raw);
      const list = Array.isArray(json) ? json : [json];
      for (const item of list) {
        const graph = item['@graph'] || [];
        const candidates = [item, ...graph];
        // Accept Product AND ProductGroup (Trendyol uses ProductGroup)
        const isProductType = (t: unknown) => t === 'Product' || t === 'ProductGroup';
        const product = candidates.find((x: any) => {
          const t = x?.['@type'];
          return typeof t === 'string' ? isProductType(t) : Array.isArray(t) && t.some(isProductType);
        });
        if (!product) continue;
        result.title = result.title || product.name;
        // Handle ImageObject format: { contentUrl: ["url", ...] } used by Trendyol
        if (!result.image) {
          const img = product.image;
          if (typeof img === 'string') result.image = img;
          else if (Array.isArray(img)) result.image = typeof img[0] === 'string' ? img[0] : (img[0]?.contentUrl?.[0] ?? img[0]?.url ?? null);
          else if (img?.contentUrl) result.image = Array.isArray(img.contentUrl) ? img.contentUrl[0] : img.contentUrl;
          else if (img?.url) result.image = img.url;
        }
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer) { result.price = result.price || offer.price || offer.lowPrice; result.currency = result.currency || offer.priceCurrency; }
      }
    } catch {}
  });
  return result;
}

function normalizePrice(raw: string | number | null | undefined): string {
  if (raw == null || raw === '') return '—';
  const s = String(raw).trim();
  // Pure numeric from JSON-LD (e.g. 1699 or 1699.9)
  if (/^\d+(\.\d+)?$/.test(s)) return s;
  // Strip currency symbols and whitespace
  const stripped = s.replace(/\s/g, '').replace(/₺|TL|EUR|USD|\$|€/gi, '');
  if (!stripped) return '—';
  // Turkish thousands format: "1.699" or "1.699,90"
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(stripped)) {
    return stripped.replace(/\./g, '').replace(',', '.');
  }
  // Comma-only decimal: "1699,90"
  if (/^\d+,\d{1,2}$/.test(stripped)) {
    return stripped.replace(',', '.');
  }
  // Fallback: keep digits and at most one dot
  const digits = stripped.replace(/[^\d.]/g, '');
  return digits || '—';
}

function extractPriceFromHtml($: cheerio.CheerioAPI): string {
  // 1. Attribute-based: reliable, always just the value
  const attrSelectors = ['[itemprop="price"]', '[property="product:price:amount"]'];
  for (const sel of attrSelectors) {
    const val = $(sel).first().attr('content') ?? $(sel).first().attr('value') ?? '';
    if (/^\d[\d.,]*$/.test(val.trim())) return val.trim();
  }
  // 2. Text-based: only accept short strings that look like a single price
  //    Avoid broad containers ([class*="price"]) that include old price + extra text
  const PRICE_RE = /^\d[\d.,\s]*(?:TL|₺|TRY)?$/i;
  const textSelectors = [
    '[itemprop="price"]',
    '[class*="prc-dsc"]',   // Trendyol discounted price
    '[class*="prc-slg"]',   // Trendyol original price (fallback)
    '[class*="hb-text-price"]', // Hepsiburada
    '[class*="product-price"]', // LCW / generic
  ];
  for (const sel of textSelectors) {
    const text = cleanText($(sel).first().text());
    if (text && text.length < 25 && PRICE_RE.test(text)) return text;
  }
  return '';
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ success: false, error: 'Link gerekli' }, { status: 400 });

  try {
    // curl bypasses Cloudflare TLS fingerprint detection that blocks Node.js fetch()
    const html = await execFileAsync('curl', [
      '--silent', '--location', '--max-time', '15', '--compressed',
      '--header', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '--header', 'Accept-Language: tr-TR,tr;q=0.9,en-US;q=0.8',
      '--header', 'Cache-Control: max-age=0',
      '--header', 'Upgrade-Insecure-Requests: 1',
      url,
    ], { maxBuffer: 10 * 1024 * 1024 }).then(r => r.stdout).catch(() => '');

    if (!html) return NextResponse.json({ success: false, error: 'Sayfa okunamadı.' }, { status: 502 });
    const $ = cheerio.load(html);
    const jsonLd = extractJsonLd($);

    const title = jsonLd.title || $('meta[property="og:title"]').attr('content') || $('title').text();
    const image = jsonLd.image || $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content') || $('[itemprop="image"]').attr('content') || $('[itemprop="image"]').attr('src');
    const price = jsonLd.price || $('meta[property="product:price:amount"]').attr('content') || extractPriceFromHtml($);
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();

    const colorMatches = html.match(/"variants"\s*:\s*(\[[\s\S]*?\])/);
    let colors: any[] = [];
    if (colorMatches) {
      try {
        const variants = JSON.parse(colorMatches[1]);
        colors = variants.filter((v: any) => v.color || v.attributeValue).map((v: any) => ({ name: v.color || v.attributeValue || 'Renk', url: v.url ? `https://www.trendyol.com${v.url}` : url, image: v.images?.[0] || v.image || image || '' })).slice(0, 8);
      } catch {}
    }

    return NextResponse.json({ success: !!image, image: image || null, name: cleanText(title), brand, price: normalizePrice(price), colors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Bağlantı hatası.' }, { status: 500 });
  }
}
