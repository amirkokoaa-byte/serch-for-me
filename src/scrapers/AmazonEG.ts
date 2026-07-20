import { BaseScraper } from "./BaseScraper";
import { Product, StoreResult, SimilarProduct } from "../types";
import * as cheerio from "cheerio";

export class AmazonEGScraper extends BaseScraper {
  readonly storeName = "Amazon Egypt";
  readonly baseUrl = "https://www.amazon.eg";

  async searchTopProduct(query: string): Promise<StoreResult> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      
      // توقف عشوائي بين 0.5 إلى 2 ثانية لتجنب كشف البوت
      await this.delay(500, 2000);

      const searchUrl = `${this.baseUrl}/s?k=${encodeURIComponent(query)}&language=en_AE`;
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
      
      const searchHtml = await page.content();
      const $ = cheerio.load(searchHtml);
      
      const items = $(".s-result-item[data-component-type='s-search-result']").toArray();
      if (items.length === 0) {
        return { store: this.storeName, found: false, product: null };
      }

      // First item is the main product
      const firstProduct = $(items[0]);
      const title = firstProduct.find("h2 a span").text().trim() || firstProduct.find("h2 a").text().trim();
      const priceWhole = firstProduct.find("span.a-price-whole").text().trim().replace(/,/g, "");
      const priceFraction = firstProduct.find("span.a-price-fraction").text().trim();
      const price = priceWhole ? parseFloat(`${priceWhole}.${priceFraction || "0"}`) : 0;
      const link = firstProduct.find("h2 a").attr("href") || "";
      const url = link.startsWith("http") ? link : this.baseUrl + link;
      const imageUrl = firstProduct.find("img.s-image").attr("src") || "";
      const id = firstProduct.attr("data-asin") || "";
      const rating = firstProduct.find(".a-icon-alt").text().trim();

      if (!title || price === 0) {
        return { store: this.storeName, found: false, product: null, error: "Could not extract product details" };
      }

      // Extract alternatives from the next 3 search results
      const similarProducts: SimilarProduct[] = [];
      for (let i = 1; i < Math.min(items.length, 4); i++) {
         const altProduct = $(items[i]);
         const altTitle = altProduct.find("h2 a span").text().trim() || altProduct.find("h2 a").text().trim();
         const altPriceWhole = altProduct.find("span.a-price-whole").text().trim().replace(/,/g, "");
         const altPriceFraction = altProduct.find("span.a-price-fraction").text().trim();
         const altPrice = altPriceWhole ? parseFloat(`${altPriceWhole}.${altPriceFraction || "0"}`) : 0;
         const altLink = altProduct.find("h2 a").attr("href") || "";
         const altUrl = altLink ? (altLink.startsWith("http") ? altLink : this.baseUrl + altLink) : "";
         const altImg = altProduct.find("img.s-image").attr("src") || "";

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
      console.error(`Amazon EG scraper failed for query: ${query}`, error);
      return { store: this.storeName, found: false, product: null, error: error.message };
    } finally {
      await browser.close();
    }
  }
}
