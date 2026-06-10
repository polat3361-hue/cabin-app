import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        'Referer': 'https://www.google.com/',
      },
      cache: 'no-store',
    });

    const html = await res.text();

    const ldBlocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    let ldImage: string | null = null;
    let ldName: string | null = null;
    let ldPrice: string | null = null;

    for (const b of ldBlocks) {
      try {
        const j = JSON.parse(b[1]);
        if (j.image) {
          if (typeof j.image === 'string') ldImage = j.image;
          else if (Array.isArray(j.image)) ldImage = j.image[0];
          else if (j.image.contentUrl) {
            ldImage = Array.isArray(j.image.contentUrl) ? j.image.contentUrl[0] : j.image.contentUrl;
          }
        }
        if (j.name) ldName = j.name;
        if (j.offers?.price) ldPrice = j.offers.price;
        if (j.offers?.lowPrice) ldPrice = j.offers.lowPrice;
      } catch {}
    }

    const imgMatch = html.match(/meta[^>]*og:image[^>]*content="([^"]+)"/i) ||
                     html.match(/content="([^"]+)"[^>]*og:image/i);
    const titleMatch = html.match(/meta[^>]*og:title[^>]*content="([^"]+)"/i) ||
                       html.match(/content="([^"]+)"[^>]*og:title/i);
    const priceMatch = html.match(/product:price:amount[^>]*content="([^"]+)"/i);

    const image = ldImage || (imgMatch ? imgMatch[1] : null);
    const name = ldName || (titleMatch ? titleMatch[1].substring(0, 50) : 'Kıyafet');
    const price = ldPrice || (priceMatch ? priceMatch[1] : null);
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();

    const colorMatches = html.match(/"variants"\s*:\s*(\[[\s\S]*?\])/);
    let colors: { name: string; url: string; image: string }[] = [];
    if (colorMatches) {
      try {
        const variants = JSON.parse(colorMatches[1]);
        colors = variants
          .filter((v: any) => v.color || v.attributeValue)
          .map((v: any) => ({
            name: v.color || v.attributeValue || 'Renk',
            url: v.url ? `https://www.trendyol.com${v.url}` : url,
            image: v.images?.[0] || v.image || image || '',
          }))
          .slice(0, 8);
      } catch {}
    }

    const colorScript = html.match(/window\.__PRODUCT_DETAIL_APP_INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
    if (colors.length === 0 && colorScript) {
      try {
        const data = JSON.parse(colorScript[1]);
        const variants = data?.product?.variants || data?.variants || [];
        colors = variants
          .filter((v: any) => v.color || v.attributeValue)
          .map((v: any) => ({
            name: v.color || v.attributeValue || 'Renk',
            url: v.url ? `https://www.trendyol.com${v.url}` : url,
            image: v.images?.[0] || image || '',
          }))
          .slice(0, 8);
      } catch {}
    }

    return NextResponse.json({
      image,
      name,
      brand,
      price: price ? `₺${parseFloat(String(price)).toFixed(2)}` : '—',
      colors,
      success: !!image,
    });

  } catch {
    return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
  }
}
