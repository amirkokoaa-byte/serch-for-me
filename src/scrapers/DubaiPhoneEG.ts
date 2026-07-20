import { BaseScraper } from "./BaseScraper";
import { StoreResult, SimilarProduct } from "../types";
import * as cheerio from "cheerio";

export class DubaiPhoneEGScraper extends BaseScraper {
  readonly storeName = "Dubai Phone";
  readonly baseUrl = "https://dubaiphone.net/en";

  async searchTopProduct(query: string): Promise<StoreResult> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      
      // Random delay to avoid bot detection
      await this.delay(500, 2000);

      const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const searchHtml = await page.content();
      const $ = cheerio.load(searchHtml);
      
      const items = $("div.product-card, div.item").toArray();
      if (items.length === 0) {
        return { store: this.storeName, found: false, product: null };
      }

      const firstProduct = $(items[0]);
      const title = firstProduct.find("a.product-title, h3 a").text().trim();
      const priceStr = firstProduct.find("span.price, div.price").first().text().trim().replace(/,/g, "");
      const priceMatch = priceStr.match(/\d+(\.\d+)?/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const linkPath = firstProduct.find("a.product-title, h3 a").attr("href") || firstProduct.find("a").attr("href") || "";
      const url = linkPath.startsWith("http") ? linkPath : `https://dubaiphone.net${linkPath}`;
      const imageUrl = firstProduct.find("img").attr("src") || "";

      if (!title || price === 0 || !linkPath) {
        return { store: this.storeName, found: false, product: null, error: "Could not extract product details" };
      }

      const similarProducts: SimilarProduct[] = [];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
         const altProduct = $(items[i]);
         const altTitle = altProduct.find("a.product-title, h3 a").text().trim();
         const altPriceStr = altProduct.find("span.price, div.price").first().text().trim().replace(/,/g, "");
         const altPriceMatch = altPriceStr.match(/\d+(\.\d+)?/);
         const altPrice = altPriceMatch ? parseFloat(altPriceMatch[0]) : 0;
         const altLinkPath = altProduct.find("a.product-title, h3 a").attr("href") || altProduct.find("a").attr("href") || "";
         const altUrl = altLinkPath.startsWith("http") ? altLinkPath : `https://dubaiphone.net${altLinkPath}`;
         const altImg = altProduct.find("img").attr("src") || "";

         if (altTitle && altPrice > 0 && altLinkPath) {
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
