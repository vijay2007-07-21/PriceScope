import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useNav } from '@/context/NavContext';
import { EMPTY_FILTERS, type Filters, type SortKey } from '@/data/types';
import { summarizeProducts, groupByProduct } from '@/data/aggregations';
import { formatINR, formatPercent, formatRating } from '@/utils/format';
import { Card } from '@/components/KpiCard';
import { ProductArtwork } from '@/components/ProductArtwork';
import { FilterBar } from '@/components/FilterBar';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PageHeader } from '@/components/Sidebar';
import { ArrowUpDown, Star, TrendingDown, ExternalLink, Info } from 'lucide-react';

export function ComparisonPage() {
  const { records, loading, error, reload } = useData();
  const { navigate, pendingSearch, clearPendingSearch } = useNav();
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Apply any pending search from the Home page search bar
  useEffect(() => {
    if (pendingSearch) {
      setFilters((prev) => ({ ...prev, search: pendingSearch }));
      clearPendingSearch();
    }
  }, [pendingSearch, clearPendingSearch]);

  const products = useMemo(() => summarizeProducts(records), [records]);
  const filteredProducts = useMemo(() => {
    const f = filters;
    const q = f.search.trim().toLowerCase();
    let result = products.filter((p) => {
      if (q && !`${p.productName} ${p.brand} ${p.productId}`.toLowerCase().includes(q)) return false;
      if (f.website && !p.websites.includes(f.website)) return false;
      if (f.category && p.category !== f.category) return false;
      if (f.brand && p.brand !== f.brand) return false;
      if (f.minPrice != null && p.lowestPrice < f.minPrice) return false;
      if (f.maxPrice != null && p.lowestPrice > f.maxPrice) return false;
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'price') cmp = a.lowestPrice - b.lowestPrice;
      else if (sortKey === 'discount') cmp = a.avgDiscount - b.avgDiscount;
      else if (sortKey === 'rating') cmp = a.avgRating - b.avgRating;
      else cmp = a.productName.localeCompare(b.productName);
      return cmp * dir;
    });
    return result;
  }, [products, filters, sortKey, sortDir]);

  // Per-product detail records (when expanded)
  const productRecords = useMemo(() => {
    if (!expanded) return null;
    const groups = groupByProduct(records);
    return groups.get(expanded) ?? null;
  }, [expanded, records]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const setF = (f: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...f }));
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'asc');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Product Comparison"
        subtitle="Search, filter, and compare recorded prices across the retailers represented in the dataset."
      />

      <FilterBar
        records={records}
        filters={filters}
        onChange={setF}
        onReset={() => setFilters(EMPTY_FILTERS)}
        showWebsite
        showSearch
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-navy-500">
          <span className="font-semibold text-navy-900">{filteredProducts.length}</span> unique products match
        </p>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-navy-400">Sort by:</span>
          {(['price', 'discount', 'rating', 'name'] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => toggleSort(k)}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                sortKey === k ? 'bg-teal-100 text-teal-800' : 'text-navy-500 hover:bg-navy-100'
              }`}
            >
              {k === 'name' ? 'Name' : k.charAt(0).toUpperCase() + k.slice(1)}
              <ArrowUpDown size={12} className={sortKey === k ? 'text-teal-700' : 'text-navy-300'} />
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState message="No products match your search. Try adjusting filters." />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => {
            const isOpen = expanded === p.productId;
            const savings = p.highestPrice - p.lowestPrice;
            return (
              <Card key={p.productId} className="overflow-hidden">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : p.productId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setExpanded(isOpen ? null : p.productId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Compare'} ${p.productName} retailer prices`}
                >
                  <ProductArtwork
                    name={p.productName}
                    category={p.category}
                    className="comparison-artwork h-14 w-14 shrink-0 rounded-xl"
                    showLabel={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-navy-900 text-sm truncate">{p.productName}</h4>
                      <span className="badge-navy shrink-0">{p.brand}</span>
                      <span className="badge-teal shrink-0">{p.category}</span>
                    </div>
                    <div className="text-xs text-navy-400 mt-0.5">
                      {p.websites.length} retailers · {p.recordCount} records
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] text-navy-400">Lowest recorded</div>
                    <div className="text-lg font-bold text-teal-700">{formatINR(p.lowestPrice)}</div>
                    <div className="text-[11px] text-navy-500">at {p.bestWebsite}</div>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-[11px] text-navy-400">Rating</div>
                    <div className="flex items-center gap-1 font-semibold text-navy-900">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {formatRating(p.avgRating)}
                    </div>
                  </div>
                </div>

                {/* Mobile price row */}
                <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t border-navy-100">
                  <div>
                    <div className="text-[11px] text-navy-400">Lowest</div>
                    <div className="text-lg font-bold text-teal-700">{formatINR(p.lowestPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-navy-400">Rating</div>
                    <div className="flex items-center gap-1 font-semibold text-navy-900">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {formatRating(p.avgRating)}
                    </div>
                  </div>
                </div>

                {/* Expanded comparison */}
                {isOpen && productRecords && (
                  <ProductCompareDetail records={productRecords} savings={savings} lowest={p.lowestPrice} bestSite={p.bestWebsite} onOpenProduct={() => navigate('product', p.productId)} />
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-navy-400 bg-navy-50 rounded-lg p-3.5">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Prices shown are historical dataset-recorded values, not current live prices. The lowest recorded price
          reflects the minimum observed price across comparable records in the dataset for the same product.
        </p>
      </div>
    </div>
  );
}

function ProductCompareDetail({
  records,
  savings,
  lowest,
  bestSite,
  onOpenProduct,
}: {
  records: import('@/data/types').ProductRecord[];
  savings: number;
  lowest: number;
  bestSite: string;
  onOpenProduct: () => void;
}) {
  const byWebsite = new Map<string, import('@/data/types').ProductRecord[]>();
  for (const r of records) {
    if (!byWebsite.has(r.Website)) byWebsite.set(r.Website, []);
    byWebsite.get(r.Website)!.push(r);
  }

  return (
    <div className="mt-4 pt-4 border-t border-navy-100 animate-fade-in">
      {savings > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm bg-teal-50 text-teal-800 rounded-lg px-3 py-2 font-medium">
          <TrendingDown size={15} />
          Potential savings of {formatINR(savings)} between the highest and lowest recorded price.
        </div>
      )}

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-navy-400 border-b border-navy-100">
              <th className="pb-2 font-semibold">Retailer</th>
              <th className="pb-2 font-semibold text-right">Price</th>
              <th className="pb-2 font-semibold text-right">MRP</th>
              <th className="pb-2 font-semibold text-right">Discount</th>
              <th className="pb-2 font-semibold text-right">Rating</th>
              <th className="pb-2 font-semibold">Availability</th>
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const isLow = r.Price_INR === lowest && r.Website === bestSite;
              return (
                <tr key={i} className={`border-b border-navy-50 last:border-0 ${isLow ? 'bg-teal-50/60' : ''}`}>
                  <td className="py-2.5 font-medium text-navy-800">
                    <span className="flex items-center gap-1.5">
                      {r.Website}
                      {isLow && <span className="badge-teal text-[10px] py-0.5 px-1.5">Lowest</span>}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-navy-900">{formatINR(r.Price_INR)}</td>
                  <td className="py-2.5 text-right text-navy-500">{formatINR(r.MRP_INR)}</td>
                  <td className="py-2.5 text-right text-amber-700 font-medium">{formatPercent(r.Discount_Percent)}</td>
                  <td className="py-2.5 text-right">
                    <span className="inline-flex items-center gap-1 text-navy-700">
                      <Star size={12} className="fill-amber-400 text-amber-400" /> {formatRating(r.Rating)}
                    </span>
                  </td>
                  <td className="py-2.5 text-navy-500 text-xs">{r.Availability || '—'}</td>
                  <td className="py-2.5 text-navy-400 text-xs">{r.Timestamp}</td>
                  <td className="py-2.5 text-right">
                    {r.Product_URL && (
                      <a href={r.Product_URL} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <button onClick={onOpenProduct} className="btn-secondary text-xs py-2">
          View full product details <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}
