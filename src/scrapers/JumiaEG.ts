import { BaseScraper } from "./BaseScraper";
import { Product, StoreResult, SimilarProduct } from "../types";
import * as cheerio from "cheerio";

export class JumiaEGScraper extends BaseScraper {
  readonly storeName = "Jumia Egypt";
  readonly baseUrl = "https://www.jumia.com.eg";

  async searchTopProduct(query: string): Promise<StoreResult> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      
      // توقف عشوائي بين 0.5 إلى 2 ثانية لتجنب كشف البوت
      await this.delay(500, 2000);

      const searchUrl = `${this.baseUrl}/catalog/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const searchHtml = await page.content();
      const $ = cheerio.load(searchHtml);
      
      const items = $("article.prd._fb.col.c-prd").toArray();
      if (items.length === 0) {
        return { store: this.storeName, found: false, product: null };
      }

      const firstProduct = $(items[0]);
      const linkElement = firstProduct.find("a.core");
      const title = firstProduct.find("h3.name").text().trim() || linkElement.attr("data-name") || "";
      const priceStr = firstProduct.find("div.prc").first().text().trim();
      const priceMatch = priceStr.replace(/,/g, "").match(/\d+(\.\d+)?/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const link = linkElement.attr("href") || "";
      const url = link.startsWith("http") ? link : this.baseUrl + link;
      const imageUrl = firstProduct.find("img.img").attr("data-src") || firstProduct.find("img.img").attr("src") || "";
      const id = linkElement.attr("data-id") || "";
      const rating = firstProduct.find("div.stars._s").text().trim();

      if (!title || price === 0) {
         return { store: this.storeName, found: false, product: null, error: "Could not extract product details" };
      }

      // Extract alternatives from the next 3 search results
      const similarProducts: SimilarProduct[] = [];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
         const altProduct = $(items[i]);
         const altLinkElement = altProduct.find("a.core");
         const altTitle = altProduct.find("h3.name").text().trim() || altLinkElement.attr("data-name") || "";
         const altPriceStr = altProduct.find("div.prc").text().trim().replace(/,/g, "");
         const altPriceMatch = altPriceStr.match(/\d+(\.\d+)?/);
         const altPrice = altPriceMatch ? parseFloat(altPriceMatch[0]) : 0;
         const altLink = altLinkElement.attr("href") || "";
         const altUrl = altLink ? (altLink.startsWith("http") ? altLink : this.baseUrl + altLink) : "";
         const altImg = altProduct.find("img.img").attr("data-src") || altProduct.find("img.img").attr("src") || "";

         if (altTitle && altPrice > 0 && altUrl) {
           similarProducts.push({
             title: altTitle,
             price: altPrice,
             currency: "EGP",
             url: altUrl,
             imageUrl: altImg
           });
         }
      }

      return {
        store: this.storeName,
        found: true,
        product: {
          id,
          title,
          price,
          currency: "EGP",
          url,
          imageUrl,
          store: this.storeName,
          rating: rating || undefined,
          similarProducts
        }
      };

    } catch (error: any) {
      console.error(`Jumia EG scraper failed for query: ${query}`, error);
      return { store: this.storeName, found: false, product: null, error: error.message };
    } finally {
      await browser.close();
    }
  }
}
