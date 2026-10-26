import type { ProductRecord, Filters } from './types';

export function applyFilters(records: ProductRecord[], f: Filters): ProductRecord[] {
  const q = f.search.trim().toLowerCase();
  return records.filter((r) => {
    if (q && !`${r.Product_Name} ${r.Brand} ${r.Product_ID}`.toLowerCase().includes(q)) return false;
    if (f.website && r.Website !== f.website) return false;
    if (f.category && r.Category !== f.category) return false;
    if (f.brand && r.Brand !== f.brand) return false;
    if (f.minPrice != null && r.Price_INR < f.minPrice) return false;
    if (f.maxPrice != null && r.Price_INR > f.maxPrice) return false;
    return true;
  });
}

export function uniqueValues(records: ProductRecord[], key: keyof ProductRecord): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = String(r[key] ?? '');
    if (v) set.add(v);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function validNums(records: ProductRecord[], key: keyof ProductRecord): number[] {
  return records
    .map((r) => Number(r[key]))
    .filter((n) => Number.isFinite(n));
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = average(xs.slice(0, n));
  const my = average(ys.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export interface DatasetStats {
  totalRecords: number;
  uniqueProducts: number;
  brands: number;
  categories: number;
  websites: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgDiscount: number;
  avgRating: number;
  avgMRP: number;
  priceRatingCorr: number;
}

export function computeStats(records: ProductRecord[]): DatasetStats {
  const prices = validNums(records, 'Price_INR');
  const mrps = validNums(records, 'MRP_INR');
  const discounts = validNums(records, 'Discount_Percent');
  const ratings = validNums(records, 'Rating');

  // Pair price+rating for correlation
  const pairs = records
    .filter((r) => Number.isFinite(r.Price_INR) && Number.isFinite(r.Rating))
    .map((r) => ({ p: r.Price_INR, rt: r.Rating }));

  return {
    totalRecords: records.length,
    uniqueProducts: uniqueValues(records, 'Product_ID').length,
    brands: uniqueValues(records, 'Brand').length,
    categories: uniqueValues(records, 'Category').length,
    websites: uniqueValues(records, 'Website').length,
    avgPrice: average(prices),
    medianPrice: median(prices),
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    avgDiscount: average(discounts),
    avgRating: average(ratings),
    avgMRP: average(mrps),
    priceRatingCorr: pearson(pairs.map((x) => x.p), pairs.map((x) => x.rt)),
  };
}

export interface ProductSummary {
  productId: string;
  productName: string;
  brand: string;
  category: string;
  lowestPrice: number;
  highestPrice: number;
  bestWebsite: string;
  avgPrice: number;
  avgRating: number;
  avgDiscount: number;
  availability: string;
  websites: string[];
  recordCount: number;
  imageQuery: string;
}

export function groupByProduct(records: ProductRecord[]): Map<string, ProductRecord[]> {
  const map = new Map<string, ProductRecord[]>();
  for (const r of records) {
    if (!map.has(r.Product_ID)) map.set(r.Product_ID, []);
    map.get(r.Product_ID)!.push(r);
  }
  return map;
}

export function summarizeProducts(records: ProductRecord[]): ProductSummary[] {
  const groups = groupByProduct(records);
  const summaries: ProductSummary[] = [];
  for (const [id, rows] of groups) {
    const prices = rows.map((r) => r.Price_INR).filter(Number.isFinite);
    const ratings = rows.map((r) => r.Rating).filter(Number.isFinite);
    const discounts = rows.map((r) => r.Discount_Percent).filter(Number.isFinite);
    const websites = uniqueValues(rows, 'Website');
    if (!prices.length) continue;
    const minIdx = rows.findIndex((r) => r.Price_INR === Math.min(...prices));
    summaries.push({
      productId: id,
      productName: rows[0].Product_Name,
      brand: rows[0].Brand,
      category: rows[0].Category,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      bestWebsite: rows[minIdx]?.Website ?? '',
      avgPrice: average(prices),
      avgRating: ratings.length ? average(ratings) : 0,
      avgDiscount: discounts.length ? average(discounts) : 0,
      availability: rows[0].Availability,
      websites,
      recordCount: rows.length,
      imageQuery: rows[0].Product_Name,
    });
  }
  return summaries.sort((a, b) => a.productName.localeCompare(b.productName));
}

export function avgByKey(records: ProductRecord[], key: keyof ProductRecord, target: keyof ProductRecord): { label: string; value: number }[] {
  const buckets = new Map<string, number[]>();
  for (const r of records) {
    const k = String(r[key]);
    const v = Number(r[target]);
    if (!k || !Number.isFinite(v)) continue;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(v);
  }
  return Array.from(buckets.entries())
    .map(([label, nums]) => ({ label, value: average(nums) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function priceBuckets(records: ProductRecord[]): { label: string; count: number }[] {
  const buckets = [
    { label: '₹1k-5k', min: 1000, max: 5000 },
    { label: '₹5k-10k', min: 5000, max: 10000 },
    { label: '₹10k-20k', min: 10000, max: 20000 },
    { label: '₹20k-30k', min: 20000, max: 30000 },
    { label: '₹30k-50k', min: 30000, max: 50000 },
  ];
  return buckets.map((b) => ({
    label: b.label,
    count: records.filter((r) => r.Price_INR >= b.min && r.Price_INR < b.max).length,
  }));
}

export function websitePriceComparison(records: ProductRecord[]): { website: string; avgPrice: number; count: number }[] {
  const map = new Map<string, number[]>();
  for (const r of records) {
    if (!Number.isFinite(r.Price_INR)) continue;
    if (!map.has(r.Website)) map.set(r.Website, []);
    map.get(r.Website)!.push(r.Price_INR);
  }
  return Array.from(map.entries())
    .map(([website, prices]) => ({ website, avgPrice: average(prices), count: prices.length }))
    .sort((a, b) => a.website.localeCompare(b.website));
}

export function toCSV(records: ProductRecord[]): string {
  const header = Object.keys(records[0] ?? {}).join(',');
  const rows = records.map((r) =>
    Object.values(r)
      .map((v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}
