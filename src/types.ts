export interface StoreOffer {
  store: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
}

export interface SuggestedAlternative {
  store: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
}

export interface AggregatedResult {
  query: string;
  exactMatches: StoreOffer[];
  alternatives: SuggestedAlternative[];
}

export interface SimilarProduct {
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl: string;
  store: string;
  rating?: string;
  similarProducts?: SimilarProduct[];
}

export interface StoreResult {
  store: string;
  found: boolean;
  product: Product | null;
  error?: string;
}
