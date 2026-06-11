import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL gerekli' }, { status: 400 });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const html = await response.text();

    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)?.[1] ||
                    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i)?.[1] || null;

    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)?.[1] ||
                    html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i)?.[1] || null;

    const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i)?.[1] || null;

    const image = ogImage || twitterImage;
    const name = ogTitle ? ogTitle.substring(0, 60) : 'Kıyafet';
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();

    const priceMatch = html.match(/class="[^"]*price[^"]*"[^>]*>([^<]+)/i) ||
                       html.match(/class="[^"]*prc[^"]*"[^>]*>([^<]+)/i);
    const price = priceMatch ? priceMatch[1].trim() : null;

    const colorMatches = html.match(/"variants"\s*:\s*(\[[\s\S]*?\])/);
    let colors: { name: string; url: string; image: string }[] = [];
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
      image,
      name,
      brand,
      price: price || '—',
      colors,
      success: !!image,
    });
  } catch {
    return NextResponse.json({ error: 'Bağlantı hatası' }, { status: 500 });
  }
}
