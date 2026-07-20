import puppeteer, { Browser, Page } from "puppeteer";
import UserAgent from "user-agents";
import { Product, StoreResult } from "../types";
import * as cheerio from "cheerio";

export abstract class BaseScraper {
  abstract readonly storeName: string;
  abstract readonly baseUrl: string;

  protected async getBrowser(): Promise<Browser> {
    return await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        // "--proxy-server=http://192.168.1.100:8080" // Example proxy setup
      ],
    });
  }

  /**
   * Random delay between min and max milliseconds
   */
  protected async delay(min: number, max: number): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async setupPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();
    const userAgent = new UserAgent({ deviceCategory: "desktop" }).toString();
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
      "Referer": Math.random() > 0.5 ? "https://www.google.com.eg/" : "https://www.bing.com/"
    });
    // Randomize viewport
    await page.setViewport({
      width: 1200 + Math.floor(Math.random() * 400),
      height: 800 + Math.floor(Math.random() * 200),
    });
    
    // Disable loading images and css for performance
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (resourceType === "image" || resourceType === "stylesheet" || resourceType === "font") {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  /**
   * Fetch the HTML content using Puppeteer to bypass simple protections.
   */
  protected async fetchHtml(url: string): Promise<string> {
    const browser = await this.getBrowser();
    try {
      const page = await this.setupPage(browser);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      const html = await page.content();
      return html;
    } catch (error) {
      console.error(`Error fetching HTML for ${url}:`, error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  abstract searchTopProduct(query: string): Promise<StoreResult>;
}
