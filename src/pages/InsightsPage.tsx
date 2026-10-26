import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useNav } from '@/context/NavContext';
import { summarizeProducts } from '@/data/aggregations';
import { formatINR, formatRating, formatPercent } from '@/utils/format';
import { Card, SectionTitle } from '@/components/KpiCard';
import { ProductArtwork } from '@/components/ProductArtwork';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PageHeader } from '@/components/Sidebar';
import { Star, TrendingDown, Award, Layers, Search, ArrowRight, Info } from 'lucide-react';

const BUDGET_OPTIONS = [2000, 5000, 10000, 20000, 50000];
const RATING_OPTIONS = [3.5, 4.0, 4.5];

export function InsightsPage() {
  const { records, loading, error, reload } = useData();
  const { navigate } = useNav();
  const [budget, setBudget] = useState<number>(10000);
  const [customBudget, setCustomBudget] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [insightSearch, setInsightSearch] = useState('');

  const products = useMemo(() => summarizeProducts(records), [records]);

  const effectiveBudget = customBudget && Number(customBudget) > 0 ? Number(customBudget) : budget;

  // A. Best value recommendations: ranking by price-within-budget + rating + discount + retailer count
  const bestValue = useMemo(() => {
    return products
      .filter((p) => p.lowestPrice <= effectiveBudget)
      .filter((p) => minRating === 0 || p.avgRating >= minRating)
      .map((p) => {
        // Transparent scoring: rating (0-5 → 0-40pts), discount (0-50% → 0-30pts), retailers (1-4 → 0-20pts), budget headroom (10pts)
        const ratingPts = (p.avgRating / 5) * 40;
        const discountPts = Math.min(p.avgDiscount / 50, 1) * 30;
        const retailerPts = ((p.websites.length - 1) / 3) * 20;
        const budgetPts = (1 - p.lowestPrice / effectiveBudget) * 10;
        const score = ratingPts + discountPts + retailerPts + budgetPts;
        return { ...p, score, breakdown: { ratingPts, discountPts, retailerPts, budgetPts } };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [products, effectiveBudget, minRating]);

  // B. Lowest recorded price by category
  const lowestByCategory = useMemo(() => {
    const map = new Map<string, { name: string; price: number; site: string; id: string }>();
    for (const p of products) {
      const existing = map.get(p.category);
      if (!existing || p.lowestPrice < existing.price) {
        map.set(p.category, { name: p.productName, price: p.lowestPrice, site: p.bestWebsite, id: p.productId });
      }
    }
    return Array.from(map.entries()).map(([cat, info]) => ({ category: cat, ...info })).sort((a, b) => a.price - b.price);
  }, [products]);

  // C. Highest discount products
  const highestDiscount = useMemo(() => {
    const perProduct = records.reduce((acc, r) => {
      if (!acc.has(r.Product_ID)) acc.set(r.Product_ID, []);
      acc.get(r.Product_ID)!.push(r.Discount_Percent);
      return acc;
    }, new Map<string, number[]>());
    return products
      .map((p) => ({ ...p, maxDiscount: Math.max(...(perProduct.get(p.productId) ?? [0])) }))
      .sort((a, b) => b.maxDiscount - a.maxDiscount)
      .slice(0, 5);
  }, [products, records]);

  // D. Products available across all 4 retailers
  const multiRetailer = useMemo(() => products.filter((p) => p.websites.length >= 4).sort((a, b) => a.lowestPrice - b.lowestPrice), [products]);

  // E. Search for lowest recorded price
  const searchResults = useMemo(() => {
    const q = insightSearch.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => `${p.productName} ${p.brand}`.toLowerCase().includes(q)).slice(0, 5);
  }, [products, insightSearch]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Smart Shopping Insights" subtitle="Rules-based recommendations computed from the actual dataset." />

      {/* Budget + rating controls */}
      <Card>
        <SectionTitle title="Find the best value for your budget" subtitle="Adjust the budget and minimum rating to refine recommendations." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wide block mb-2">Budget (₹)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b}
                  onClick={() => { setBudget(b); setCustomBudget(''); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    budget === b && !customBudget ? 'bg-teal-500 text-navy-900 shadow-sm' : 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                  }`}
                >
                  {formatINR(b, { compact: true })}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder="Or enter a custom budget"
              className="input"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-400 uppercase tracking-wide block mb-2">Minimum rating</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMinRating(0)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${minRating === 0 ? 'bg-navy-900 text-white' : 'bg-navy-100 text-navy-600 hover:bg-navy-200'}`}
              >
                Any
              </button>
              {RATING_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${minRating === r ? 'bg-teal-500 text-navy-900' : 'bg-navy-100 text-navy-600 hover:bg-navy-200'}`}
                >
                  <Star size={13} className="fill-current" /> {r}+
                </button>
              ))}
            </div>
            <p className="text-xs text-navy-400 mt-3">Products without a valid rating are excluded when a minimum is set.</p>
          </div>
        </div>
      </Card>

      {/* Best value results */}
      <div>
        <SectionTitle title="Best value recommendations" subtitle={`Within ${formatINR(effectiveBudget)}${minRating ? ` · rated ${minRating}+` : ''}`} />
        {bestValue.length === 0 ? (
          <EmptyState message="No products match this budget and rating combination." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bestValue.map((p, i) => (
              <Card key={p.productId} className="card-hover recommendation-card">
                <ProductArtwork
                  name={p.productName}
                  category={p.category}
                  className="recommendation-artwork mb-4"
                />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-500 text-navy-900 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                    <span className="badge-navy">{p.brand}</span>
                  </div>
                  <button onClick={() => navigate('product', p.productId)} className="text-teal-600 hover:text-teal-700">
                    <ArrowRight size={16} />
                  </button>
                </div>
                <h4 className="font-semibold text-navy-900 text-sm mb-1 truncate">{p.productName}</h4>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[11px] text-navy-400">Lowest recorded</div>
                    <div className="font-bold text-navy-900">{formatINR(p.lowestPrice)}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-navy-600"><Star size={12} className="fill-amber-400 text-amber-400" /> {formatRating(p.avgRating)}</div>
                    <div className="text-[11px] text-amber-700 font-medium">{formatPercent(p.avgDiscount)}</div>
                  </div>
                </div>
                <div className="text-[11px] text-navy-400 bg-navy-50 rounded-md p-2 leading-relaxed">
                  Recommended because: rating {formatRating(p.avgRating)}/5, discount {formatPercent(p.avgDiscount)},
                  available from {p.websites.length} retailer{p.websites.length > 1 ? 's' : ''}, within budget.
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Find lowest price search */}
      <Card>
        <SectionTitle title="Find the lowest recorded price" subtitle="Search a product to see where it's cheapest in the dataset." />
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={insightSearch}
            onChange={(e) => setInsightSearch(e.target.value)}
            placeholder="Search for a product or brand..."
            className="input pl-9"
          />
        </div>
        {insightSearch && searchResults.length === 0 && <EmptyState message="No products match that search." />}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((p) => (
              <button key={p.productId} onClick={() => navigate('product', p.productId)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-navy-50 transition-colors text-left group">
                <TrendingDown size={16} className="text-teal-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate group-hover:text-teal-700">{p.productName}</div>
                  <div className="text-[11px] text-navy-400">{p.brand} · {p.websites.length} retailers</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-teal-700 text-sm">{formatINR(p.lowestPrice)}</div>
                  <div className="text-[11px] text-navy-400">at {p.bestWebsite}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Insights grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle title="Lowest recorded price by category" subtitle="The cheapest product in each category" />
          <div className="space-y-2">
            {lowestByCategory.map((c) => (
              <button key={c.category} onClick={() => navigate('product', c.id)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left group">
                <span className="badge-teal">{c.category}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate group-hover:text-teal-700">{c.name}</div>
                  <div className="text-[11px] text-navy-400">at {c.site}</div>
                </div>
                <div className="font-bold text-navy-900 text-sm">{formatINR(c.price)}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Highest recorded discounts" subtitle="Products with the largest single discount in the dataset" />
          <div className="space-y-2">
            {highestDiscount.map((p) => (
              <button key={p.productId} onClick={() => navigate('product', p.productId)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-50 transition-colors text-left group">
                <Award size={16} className="text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate group-hover:text-teal-700">{p.productName}</div>
                  <div className="text-[11px] text-navy-400">{p.brand} · from {formatINR(p.lowestPrice)}</div>
                </div>
                <div className="font-bold text-amber-700 text-sm">{formatPercent(p.maxDiscount)}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Multi-retailer products */}
      <Card>
        <SectionTitle title="Available from multiple retailers" subtitle="Products you can compare across 4 retailers — best for cross-site comparison." />
        {multiRetailer.length === 0 ? (
          <EmptyState message="No products appear on all 4 retailers." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {multiRetailer.map((p) => (
              <button key={p.productId} onClick={() => navigate('product', p.productId)} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100 hover:border-teal-300 hover:bg-teal-50/30 transition-all text-left">
                <Layers size={16} className="text-navy-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-navy-800 truncate">{p.productName}</div>
                  <div className="text-[11px] text-navy-400">{p.websites.length} retailers · from {formatINR(p.lowestPrice)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2 text-xs text-navy-400 bg-navy-50 rounded-lg p-3.5">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Recommendations use only dataset-recorded prices and ratings — not current market prices. The "best value"
          ranking is transparent: rating (40%), discount (30%), retailer coverage (20%), and budget headroom (10%).
          Products with insufficient data are excluded rather than guessed.
        </p>
      </div>
    </div>
  );
}
