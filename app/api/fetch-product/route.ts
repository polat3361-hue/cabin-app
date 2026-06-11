import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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
        const product = candidates.find((x: any) => { const type = x?.['@type']; return type === 'Product' || (Array.isArray(type) && type.includes('Product')); });
        if (!product) continue;
        result.title = result.title || product.name;
        result.image = result.image || (Array.isArray(product.image) ? product.image[0] : product.image);
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer) { result.price = result.price || offer.price || offer.lowPrice; result.currency = result.currency || offer.priceCurrency; }
      }
    } catch {}
  });
  return result;
}

function extractPriceFromHtml($: cheerio.CheerioAPI) {
  const selectors = ['[itemprop="price"]','[property="product:price:amount"]','[class*="price"]','[class*="Price"]','[class*="prc"]','[class*="amount"]'];
  for (const selector of selectors) {
    const attr = $(selector).first().attr('content') || $(selector).first().attr('value');
    const text = cleanText(attr || $(selector).first().text());
    if (text && /₺|TL|TRY|\$|€|\d/.test(text)) return text;
  }
  return '';
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ success: false, error: 'Link gerekli' }, { status: 400 });

  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!htmlRes.ok) return NextResponse.json({ success: false, error: 'Sayfa okunamadı.' }, { status: 502 });

    const html = await htmlRes.text();
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

    return NextResponse.json({ success: !!image, image: image || null, name: cleanText(title), brand, price: cleanText(String(price || '')) || '—', colors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Bağlantı hatası.' }, { status: 500 });
  }
}
