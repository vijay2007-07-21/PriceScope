import Papa from 'papaparse';
import type { ProductRecord } from './types';

const DATASET_URL = '/data/ecommerce_price_comparison_dataset-2.csv';

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const n = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

export async function loadDataset(): Promise<ProductRecord[]> {
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Failed to load dataset (HTTP ${res.status})`);
  const text = await res.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    // Non-fatal: Papa reports things like unmatched quotes; keep what parsed.
    console.warn('CSV parse warnings:', parsed.errors.slice(0, 3));
  }

  const records: ProductRecord[] = [];
  for (const row of parsed.data) {
    const rec: ProductRecord = {
      Product_ID: String(row.Product_ID ?? '').trim(),
      Product_Name: String(row.Product_Name ?? '').trim(),
      Brand: String(row.Brand ?? '').trim(),
      Category: String(row.Category ?? '').trim(),
      Website: String(row.Website ?? '').trim(),
      Price_INR: parseNumber(row.Price_INR),
      MRP_INR: parseNumber(row.MRP_INR),
      Discount_Percent: parseNumber(row.Discount_Percent),
      Rating: parseNumber(row.Rating),
      Availability: String(row.Availability ?? '').trim(),
      Product_URL: String(row.Product_URL ?? '').trim(),
      Timestamp: String(row.Timestamp ?? '').trim(),
      Lowest_Price_INR: parseNumber(row.Lowest_Price_INR),
      Best_Website: String(row.Best_Website ?? '').trim(),
    };
    // Keep rows with a valid id and valid price; missing other numeric fields are allowed.
    if (rec.Product_ID && Number.isFinite(rec.Price_INR)) {
      records.push(rec);
    }
  }
  return records;
}
