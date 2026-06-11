import * as cheerio from "cheerio";
import dns from "dns/promises";
import net from "net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function isPrivateIp(ip) {
  if (net.isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    return (parts[0] === 10 || parts[0] === 127 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || parts[0] === 169);
  }
  if (net.isIP(ip) === 6) {
    return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
  }
  return true;
}

async function validatePublicUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(rawUrl); } catch { throw new Error("Geçerli bir URL gir."); }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Sadece http/https linkleri desteklenir.");
  const records = await dns.lookup(parsed.hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) throw new Error("Bu URL güvenlik nedeniyle engellendi.");
  return parsed.toString();
}

function extractJsonLd($) {
  let result = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).text().trim();
      if (!raw) return;
      const json = JSON.parse(raw);
      const list = Array.isArray(json) ? json : [json];
      for (const item of list) {
        const graph = item["@graph"] || [];
        const candidates = [item, ...graph];
        const product = candidates.find((x) => { const type = x?.["@type"]; return type === "Product" || (Array.isArray(type) && type.includes("Product")); });
        if (!product) continue;
        result.title ||= product.name;
        if (Array.isArray(product.image)) result.image ||= product.image[0];
        else result.image ||= product.image;
        result.description ||= product.description;
        const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
        if (offer) { result.price ||= offer.price || offer.lowPrice || offer.highPrice; result.currency ||= offer.priceCurrency; }
      }
    } catch {}
  });
  return result;
}

function extractPriceFromHtml($) {
  const selectors = ['[itemprop="price"]','[property="product:price:amount"]','[class*="price"]','[class*="Price"]','[class*="prc"]','[class*="amount"]','[data-testid*="price"]'];
  for (const selector of selectors) {
    const attr = $(selector).first().attr("content") || $(selector).first().attr("value");
    const text = cleanText(attr || $(selector).first().text());
    if (text && /₺|TL|TRY|\$|€|£|\d/.test(text)) return text;
  }
  const body = cleanText($("body").text());
  const match = body.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?)\s*(TL|₺|TRY|\$|€|£)/i);
  return match ? `${match[1]} ${match[2]}` : "";
}

export async function GET(req) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) return Response.json({ success: false, error: "Link girmen gerekiyor." }, { status: 400 });
    const safeUrl = await validatePublicUrl(url);
    const htmlRes = await fetch(safeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!htmlRes.ok) return Response.json({ success: false, error: "Sayfa okunamadı.", status: htmlRes.status }, { status: 502 });
    const html = await htmlRes.text();
    const $ = cheerio.load(html);
    const jsonLd = extractJsonLd($);
    const title = jsonLd.title || $('meta[property="og:title"]').attr("content") || $('meta[name="twitter:title"]').attr("content") || $("title").text();
    const image = jsonLd.image || $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || $('[itemprop="image"]').attr("content") || $('[itemprop="image"]').attr("src");
    const price = jsonLd.price || $('meta[property="product:price:amount"]').attr("content") || extractPriceFromHtml($);
    const currency = jsonLd.currency || $('meta[property="product:price:currency"]').attr("content") || "";
    const brand = new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase();
    const colorMatches = html.match(/"variants"\s*:\s*(\[[\s\S]*?\])/);
    let colors = [];
    if (colorMatches) {
      try {
        const variants = JSON.parse(colorMatches[1]);
        colors = variants.filter((v) => v.color || v.attributeValue).map((v) => ({ name: v.color || v.attributeValue || 'Renk', url: v.url ? `https://www.trendyol.com${v.url}` : url, image: v.images?.[0] || v.image || image || '' })).slice(0, 8);
      } catch {}
    }
    return Response.json({ success: !!image, image: image || null, name: cleanText(title), brand, price: cleanText(String(price || "")) || "—", colors });
  } catch (error) {
    return Response.json({ success: false, error: error.message || "Bağlantı hatası." }, { status: 500 });
  }
}
