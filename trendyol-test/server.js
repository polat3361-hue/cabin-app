const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

function isAllowedUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("trendyol.com") ||
      u.hostname.includes("boyner.com.tr") ||
      u.hostname.includes("amazon.com.tr") ||
      u.hostname.includes("hepsiburada.com") ||
      u.hostname.includes("n11.com")
    );
  } catch {
    return false;
  }
}

app.post("/api/extract-product", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isAllowedUrl(url)) {
      return res.status(400).json({
        error: "Geçerli bir ürün linki gir.",
      });
    }

    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const price =
      $('[class*="price"]').first().text().trim() ||
      $('[class*="prc"]').first().text().trim() ||
      "";

    res.json({
      success: true,
      sourceUrl: url,
      title: title.trim(),
      image,
      description: description.trim(),
      price,
    });
  } catch (err) {
    res.status(500).json({
      error: "Ürün bilgisi çekilemedi.",
      detail: err.message,
    });
  }
});

app.listen(5000, () => {
  console.log("Server çalışıyor: http://localhost:5000");
});