import * as cheerio from "cheerio";

export const runtime = "nodejs";

const ALLOWED_DOMAINS = [
  "trendyol.com",
  "hepsiburada.com",
  "n11.com",
  "amazon.com.tr",
  "boyner.com.tr",
  "defacto.com.tr",
  "lcw.com",
  "koton.com",
  "zara.com",
  "hm.com",
  "mango.com",
];

function isAllowedUrl(url) {
  try {
    const u = new URL(url);
    return ALLOWED_DOMAINS.some((domain) => u.hostname.includes(domain));
  } catch {
    return false;
  }
}

function cleanText(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function extractJsonLd($) {
  const scripts = $('script[type="application/ld+json"]');
  let result = {};
  scripts.each((_, el) => {
    try {
      const raw = $(el).text();
      const json = JSON.parse(raw);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const product = item["@type"] === "Product" ? item : item["@graph"]?.find((x) => x["@type"] === "Product");
        if (product) {
          result.title = product.name || result.title;
          if (Array.isArray(product.image)) result.image = product.image[0];
          else result.image = product.image || result.image;
          result.description = product.description || result.description;
          const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
          if (offer) {
            result.price = offer.price || offer.lowPrice || result.price;
            result.currency = offer.priceCurrency || result.currency;
          }
        }
      }
    } catch {}
  });
  return result;
}

function extractPriceFromText($) {
  const selectors = ['[class*="price"]','[class*="Price"]','[class*="prc"]','[class*="amount"]','[data-testid*="price"]'];
  for (const selector of selectors) {
    const text = cleanText($(selector).first().text());
    if (text && /₺|TL|TRY|\$|€/.test(text)) return text;
  }
  const bodyText = cleanText($("body").text());
  const match = bodyText.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(TL|₺|TRY)/i);
  return match ? `${match[1]} ${match[2]}` : "";
}

export async function GET(req) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url || !isAllowedUrl(url)) {
      return Response.json({ success: false, error: "Desteklenen bir ürün linki gir." }, { status: 400 });
    }
    const htmlRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
    });
    if (!htmlRes.ok) return Response.json({ success: false, error: "Sayfa okunamadı." }, { status: 500 });
    const html = await htmlRes.text();
    const $ = cheerio.load(html);
    const jsonLd = extractJsonLd($);
    const title = jsonLd.title || $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || $("title").text();
    const image = jsonLd.image || $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
    const description = jsonLd.description || $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content");
    const price = jsonLd.price || $('meta[property="product:price:amount"]').attr("content") || extractPriceFromText($);
    const currency = jsonLd.currency || $('meta[property="product:price:currency"]').attr("content") || "";
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();
    return Response.json({
      success: !!image,
      image,
      name: cleanText(title),
      brand,
      price: cleanText(String(price || "")) || "—",
      colors: [],
    });
  } catch (error) {
    return Response.json({ success: false, error: "Bağlantı hatası.", detail: error.message }, { status: 500 });
  }
}
