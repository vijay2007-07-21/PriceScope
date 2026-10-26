export interface ProductRecord {
  Product_ID: string;
  Product_Name: string;
  Brand: string;
  Category: string;
  Website: string;
  Price_INR: number;
  MRP_INR: number;
  Discount_Percent: number;
  Rating: number;
  Availability: string;
  Product_URL: string;
  Timestamp: string;
  Lowest_Price_INR: number;
  Best_Website: string;
}

export type SortKey = 'price' | 'discount' | 'rating' | 'name';

export interface Filters {
  search: string;
  website: string;
  category: string;
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
}

export const WEBSITES = ['Amazon', 'Flipkart', 'Myntra', 'Ajio'] as const;

export const EMPTY_FILTERS: Filters = {
  search: '',
  website: '',
  category: '',
  brand: '',
  minPrice: null,
  maxPrice: null,
};
