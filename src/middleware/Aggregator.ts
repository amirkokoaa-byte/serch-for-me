import { StoreResult, AggregatedResult, StoreOffer, SuggestedAlternative } from "../types";

function ensureAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return `${baseUrl}/${url}`;
}

function getBaseUrl(storeName: string): string {
  const map: Record<string, string> = {
    "Amazon Egypt": "https://www.amazon.eg",
    "Jumia Egypt": "https://www.jumia.com.eg",
    "Noon Egypt": "https://www.noon.com/egypt-en",
    "B.TECH": "https://btech.com",
    "Raneen": "https://www.raneen.com",
    "2B": "https://2b.com.eg",
    "Dream 2000": "https://dream2000.com",
    "Rayashop": "https://www.rayashop.com",
    "Tradeline": "https://www.tradelinestores.com",
    "Elaraby Group": "https://www.elarabygroup.com",
    "Dubai Phone": "https://dubaiphone.net"
  };
  return map[storeName] || "https://example.com";
}

function isHighlyMatching(query: string, title: string): boolean {
  // Normalize strings: lowercase and remove special characters
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  
  const queryTokens = normalize(query).split(/\s+/).filter(t => t.length > 1);
  if (queryTokens.length === 0) return true;
  
  const titleLower = normalize(title);
  let matchCount = 0;
  for (const token of queryTokens) {
    // Basic word boundary check or simple inclusion
    if (titleLower.includes(token)) {
      matchCount++;
    }
  }
  
  // Require at least 50% of the meaningful words in the query to appear in the title
  return (matchCount / queryTokens.length) >= 0.5;
}

export function filterAccurateResults(query: string, rawResults: StoreResult[]): StoreResult[] {
  const exclusionKeywords = ["جراب", "كفر", "غطاء", "سكرينة", "شاحن", "كابل", "cover", "case", "screen protector", "protector"];
  
  const queryLower = query.toLowerCase();
  const queryWantsAccessory = exclusionKeywords.some(keyword => queryLower.includes(keyword));

  return rawResults.map(result => {
    if (result.found && result.product) {
      const titleLower = result.product.title.toLowerCase();
      const isAccessory = exclusionKeywords.some(keyword => titleLower.includes(keyword));
      
      let filteredProduct = { ...result.product };
      
      if (!queryWantsAccessory && isAccessory) {
        return {
          ...result,
          found: false,
          product: null,
          error: "Filtered out accessory"
        };
      }

      if (!queryWantsAccessory && filteredProduct.similarProducts) {
        filteredProduct.similarProducts = filteredProduct.similarProducts.filter(sim => {
          const simTitleLower = sim.title.toLowerCase();
          return !exclusionKeywords.some(keyword => simTitleLower.includes(keyword));
        });
      }

      return {
        ...result,
        product: filteredProduct
      };
    }
    return result;
  });
}

export function aggregateResults(query: string, rawResults: StoreResult[]): AggregatedResult {
  const filteredResults = filterAccurateResults(query, rawResults);
  const offers: StoreOffer[] = [];
  const alternatives: SuggestedAlternative[] = [];
  
  let bestTitle = "";
  let bestImageUrl = "";

  for (const result of filteredResults) {
    const baseUrl = getBaseUrl(result.store);

    if (result.found && result.product) {
      const product = result.product;
      const isMatch = isHighlyMatching(query, product.title);

      if (isMatch) {
        // Exact / Highly Matching Product
        offers.push({
          store: result.store,
          price: product.price,
          currency: product.currency,
          url: ensureAbsoluteUrl(product.url, baseUrl),
        });

        // Use the first valid title and image as the canonical representation
        if (!bestTitle) bestTitle = product.title;
        if (!bestImageUrl && product.imageUrl) {
          bestImageUrl = ensureAbsoluteUrl(product.imageUrl, baseUrl);
        }

        // If a store has the product, its 'similar products' go to alternatives
        if (product.similarProducts) {
          for (const sim of product.similarProducts) {
            alternatives.push({
              store: result.store,
              title: sim.title,
              price: sim.price,
              currency: sim.currency,
              url: ensureAbsoluteUrl(sim.url, baseUrl),
              imageUrl: ensureAbsoluteUrl(sim.imageUrl, baseUrl),
            });
          }
        }
      } else {
        // Exclude this store from the main comparison block, treat its result as an alternative
        alternatives.push({
          store: result.store,
          title: product.title,
          price: product.price,
          currency: product.currency,
          url: ensureAbsoluteUrl(product.url, baseUrl),
          imageUrl: ensureAbsoluteUrl(product.imageUrl, baseUrl),
        });
        
        // Also inject its similar products as alternatives
        if (product.similarProducts) {
          for (const sim of product.similarProducts) {
            alternatives.push({
              store: result.store,
              title: sim.title,
              price: sim.price,
              currency: sim.currency,
              url: ensureAbsoluteUrl(sim.url, baseUrl),
              imageUrl: ensureAbsoluteUrl(sim.imageUrl, baseUrl),
            });
          }
        }
      }
    }
  }

  // Sort offers by price ascending (cheapest first)
  offers.sort((a, b) => a.price - b.price);
  
  // Deduplicate alternatives based on URL
  const uniqueAlts = new Map<string, SuggestedAlternative>();
  for (const alt of alternatives) {
    if (!uniqueAlts.has(alt.url)) {
      uniqueAlts.set(alt.url, alt);
    }
  }

  return {
    query,
    mainProduct: offers.length > 0 ? {
      title: bestTitle || query,
      imageUrl: bestImageUrl,
      offers,
    } : null,
    alternatives: Array.from(uniqueAlts.values()),
  };
}
