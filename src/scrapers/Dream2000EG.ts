import { BaseScraper } from "./BaseScraper";
import { StoreResult, SimilarProduct } from "../types";
import * as cheerio from "cheerio";

export class Dream2000EGScraper extends BaseScraper {
  readonly storeName = "Dream 2000";
  readonly baseUrl = "https://dream2000.com/en";

  async searchTopProduct(query: string): Promise<StoreResult> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      
      // Random delay to avoid bot detection
      await this.delay(500, 2000);

      const searchUrl = `${this.baseUrl}/catalogsearch/result/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const searchHtml = await page.content();
      const $ = cheerio.load(searchHtml);
      
      const items = $("li.product-item, div.product-item-info").toArray();
      if (items.length === 0) {
        return { store: this.storeName, found: false, product: null };
      }

      const firstProduct = $(items[0]);
      const title = firstProduct.find("a.product-item-link").text().trim();
      const priceStr = firstProduct.find("span.price").first().text().trim().replace(/,/g, "");
      const priceMatch = priceStr.match(/\d+(\.\d+)?/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const url = firstProduct.find("a.product-item-link").attr("href") || "";
      const imageUrl = firstProduct.find("img.product-image-photo").attr("src") || "";

      if (!title || price === 0 || !url) {
        return { store: this.storeName, found: false, product: null, error: "Could not extract product details" };
      }

      const similarProducts: SimilarProduct[] = [];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
         const altProduct = $(items[i]);
         const altTitle = altProduct.find("a.product-item-link").text().trim();
         const altPriceStr = altProduct.find("span.price").first().text().trim().replace(/,/g, "");
         const altPriceMatch = altPriceStr.match(/\d+(\.\d+)?/);
         const altPrice = altPriceMatch ? parseFloat(altPriceMatch[0]) : 0;
         const altUrl = altProduct.find("a.product-item-link").attr("href") || "";
         const altImg = altProduct.find("img.product-image-photo").attr("src") || "";

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
          title,
          price,
          currency: "EGP",
          url,
          imageUrl,
          store: this.storeName,
          similarProducts
        },
      };
    } catch (error: any) {
      console.error(`Error scraping ${this.storeName}:`, error);
      return {
        store: this.storeName,
        found: false,
        product: null,
        error: error.message,
      };
    } finally {
      await browser.close();
    }
  }
}
