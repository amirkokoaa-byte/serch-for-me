import { BaseScraper } from "./BaseScraper";
import { StoreResult, SimilarProduct } from "../types";
import * as cheerio from "cheerio";

export class NoonEGScraper extends BaseScraper {
  readonly storeName = "Noon Egypt";
  readonly baseUrl = "https://www.noon.com/egypt-en";

  async searchTopProduct(query: string): Promise<StoreResult> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      
      // Random delay to avoid bot detection
      await this.delay(500, 2000);

      const searchUrl = `${this.baseUrl}/search/?q=${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const searchHtml = await page.content();
      const $ = cheerio.load(searchHtml);
      
      const items = $("span.productContainer, div.productContainer, div[class*='productContainer']").toArray();
      if (items.length === 0) {
        return { store: this.storeName, found: false, product: null };
      }

      const firstProduct = $(items[0]);
      const title = firstProduct.find("div[data-qa='product-name']").text().trim() || firstProduct.find("div[class*='name']").text().trim();
      const priceStr = firstProduct.find("strong.amount").text().trim().replace(/,/g, "") || firstProduct.find(".amount").text().trim().replace(/,/g, "");
      const priceMatch = priceStr.match(/\d+(\.\d+)?/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      const linkPath = firstProduct.find("a").attr("href") || "";
      const url = linkPath.startsWith("http") ? linkPath : "https://www.noon.com" + linkPath;
      const imageUrl = firstProduct.find("img").attr("src") || "";

      if (!title || price === 0) {
        return { store: this.storeName, found: false, product: null, error: "Could not extract product details" };
      }

      const similarProducts: SimilarProduct[] = [];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
         const altProduct = $(items[i]);
         const altTitle = altProduct.find("div[data-qa='product-name']").text().trim() || altProduct.find("div[class*='name']").text().trim();
         const altPriceStr = altProduct.find("strong.amount").text().trim().replace(/,/g, "") || altProduct.find(".amount").text().trim().replace(/,/g, "");
         const altPriceMatch = altPriceStr.match(/\d+(\.\d+)?/);
         const altPrice = altPriceMatch ? parseFloat(altPriceMatch[0]) : 0;
         const altLinkPath = altProduct.find("a").attr("href") || "";
         const altUrl = altLinkPath.startsWith("http") ? altLinkPath : "https://www.noon.com" + altLinkPath;
         const altImg = altProduct.find("img").attr("src") || "";

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

