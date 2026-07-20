import { AmazonEGScraper } from "./AmazonEG";
import { JumiaEGScraper } from "./JumiaEG";
import { NoonEGScraper } from "./NoonEG";
import { BTechEGScraper } from "./BTechEG";
import { RaneenEGScraper } from "./RaneenEG";
import { TwoBEGScraper } from "./TwoBEG";
import { Dream2000EGScraper } from "./Dream2000EG";
import { TradelineEGScraper } from "./TradelineEG";
import { ElarabyEGScraper } from "./ElarabyEG";
import { RayashopEGScraper } from "./RayashopEG";
import { DubaiPhoneEGScraper } from "./DubaiPhoneEG";
import { Product, StoreResult } from "../types";

export async function searchAll(query: string): Promise<StoreResult[]> {
  const scrapers = [
    new AmazonEGScraper(),
    new JumiaEGScraper(),
    new NoonEGScraper(),
    new BTechEGScraper(),
    new RaneenEGScraper(),
    new TwoBEGScraper(),
    new Dream2000EGScraper(),
    new TradelineEGScraper(),
    new ElarabyEGScraper(),
    new RayashopEGScraper(),
    new DubaiPhoneEGScraper(),
    // Add more scrapers here as they are developed
  ];

  // Run all scrapers in parallel
  const results = await Promise.allSettled(
    scrapers.map((scraper) => scraper.searchTopProduct(query))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        store: scrapers[index].storeName,
        found: false,
        product: null,
        error: result.reason?.message || "Unknown error"
      };
    }
  });
}
