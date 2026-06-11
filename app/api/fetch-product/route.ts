import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ALLOWED_DOMAINS = ['trendyol.com','hepsiburada.com','n11.com','amazon.com.tr','boyner.com.tr','defacto.com.tr','lcw.com','koton.com','zara.com','hm.com','mango.com'];

function isAllowedUrl(url: string) {
  try {
    const u = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => u.hostname.includes(domain));
  } catch { return false; }
}

function cleanText(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ success: false, error: 'Desteklenen bir ürün linki gir.' }, { status: 400 });
  }

  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      cache: 'no-store',
    });

    if (!htmlRes.ok) return NextResponse.json({ success: false, error: 'Sayfa okunamadı.' }, { status: 500 });

    const html = await htmlRes.text();

    // JSON-LD
    const ldMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    let ldImage = null, ldName = null, ldPrice = null;
    for (const m of ldMatches) {
      try {
        const j = JSON.parse(m[1]);
        const items = Array.isArray(j) ? j : [j];
        for (const item of items) {
          const product = item['@type'] === 'Product' ? item : item['@graph']?.find((x: any) => x['@type'] === 'Product');
          if (product) {
            if (!ldName) ldName = product.name;
            if (!ldImage) ldImage = Array.isArray(product.image) ? product.image[0] : product.image;
            const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
            if (offer && !ldPrice) ldPrice = offer.price || offer.lowPrice;
          }
        }
      } catch {}
    }

    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
                    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)?.[1];
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1];
    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i)?.[1];
    const hbImage = html.match(/https:\/\/productimages\.hepsiburada\.net[^"'\s]+/i)?.[0];
    const priceMatch = html.match(/product:price:amount[^>]*content="([^"]+)"/i);

    const image = ldImage || ogImage || twitterImage || hbImage || null;
    const name = ldName || ogTitle || 'Kıyafet';
    const price = ldPrice || priceMatch?.[1] || '—';
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();

    const colorMatches = html.match(/"variants"\s*:\s*(\[[\s\S]*?\])/);
    let colors: any[] = [];
    if (colorMatches) {
      try {
        const variants = JSON.parse(colorMatches[1]);
        colors = variants.filter((v: any) => v.color || v.attributeValue).map((v: any) => ({
          name: v.color || v.attributeValue || 'Renk',
          url: v.url ? `https://www.trendyol.com${v.url}` : url,
          image: v.images?.[0] || v.image || image || '',
        })).slice(0, 8);
      } catch {}
    }

    return NextResponse.json({
      success: !!image,
      image,
      name: cleanText(name),
      brand,
      price: cleanText(String(price)),
      colors,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Bağlantı hatası.', detail: error.message }, { status: 500 });
  }
}
