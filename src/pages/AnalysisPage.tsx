import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useNav } from '@/context/NavContext';
import {
  summarizeProducts,
  avgByKey,
  websitePriceComparison,
  pearson,
} from '@/data/aggregations';
import { formatINR, formatRating } from '@/utils/format';
import { Card, SectionTitle } from '@/components/KpiCard';
import { BarChartCard, ScatterChartCard } from '@/components/Charts';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PageHeader } from '@/components/Sidebar';
import { TrendingDown, TrendingUp, Star, Award, Scale, Tag, Globe } from 'lucide-react';

export function AnalysisPage() {
  const { records, loading, error, reload } = useData();
  const { navigate } = useNav();

  const products = useMemo(() => summarizeProducts(records), [records]);

  const cheapest = useMemo(() => [...products].sort((a, b) => a.lowestPrice - b.lowestPrice).slice(0, 5), [products]);
  const expensive = useMemo(() => [...products].sort((a, b) => b.highestPrice - a.highestPrice).slice(0, 5), [products]);
  const topRated = useMemo(() => [...products].filter((p) => p.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 5), [products]);

  const categoryAvgPrice = useMemo(() => avgByKey(records, 'Category', 'Price_INR'), [records]);
  const highestCategory = useMemo(() => [...categoryAvgPrice].sort((a, b) => b.value - a.value)[0], [categoryAvgPrice]);
  const brandAvgDiscount = useMemo(() => avgByKey(records, 'Brand', 'Discount_Percent'), [records]);
  const topDiscountBrand = useMemo(() => [...brandAvgDiscount].sort((a, b) => b.value - a.value)[0], [brandAvgDiscount]);
  const websiteCompare = useMemo(() => websitePriceComparison(records), [records]);
  const websiteBar = useMemo(() => websiteCompare.map((w) => ({ label: w.website, value: w.avgPrice })), [websiteCompare]);

  // Spread analysis: products with biggest price difference across retailers
  const spreads = useMemo(() => {
    return products
      .map((p) => ({ ...p, spread: p.highestPrice - p.lowestPrice, spreadPct: p.lowestPrice > 0 ? ((p.highestPrice - p.lowestPrice) / p.lowestPrice) * 100 : 0 }))
      .filter((p) => p.websites.length >= 2)
      .sort((a, b) => b.spreadPct - a.spreadPct)
      .slice(0, 5);
  }, [products]);

  // Price-rating correlation
  const priceRatingCorr = useMemo(() => {
    const pairs = records.filter((r) => Number.isFinite(r.Price_INR) && Number.isFinite(r.Rating)).map((r) => ({ p: r.Price_INR, rt: r.Rating }));
    return pearson(pairs.map((x) => x.p), pairs.map((x) => x.rt));
  }, [records]);

  // Scatter for price vs rating
  const scatter = useMemo(() => records.filter((r) => Number.isFinite(r.Price_INR) && Number.isFinite(r.Rating)).map((r) => ({ x: r.Price_INR, y: r.Rating, name: r.Product_Name })), [records]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!records.length) return <EmptyState message="No data available." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Price Analysis" subtitle="Insights derived directly from the dataset records." />

      {/* Insight cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <InsightCard
          icon={TrendingDown}
          title="Lowest recorded prices"
          subtitle="The 5 products with the smallest recorded prices in the dataset."
          accent="teal"
        >
          <ProductMiniList items={cheapest.map((p) => ({ id: p.productId, name: p.productName, brand: p.brand, value: formatINR(p.lowestPrice), sub: `at ${p.bestWebsite}` }))} onClick={(id) => navigate('product', id)} />
        </InsightCard>

        <InsightCard
          icon={TrendingUp}
          title="Highest recorded prices"
          subtitle="The 5 products with the largest recorded prices in the dataset."
          accent="navy"
        >
          <ProductMiniList items={expensive.map((p) => ({ id: p.productId, name: p.productName, brand: p.brand, value: formatINR(p.highestPrice), sub: '' }))} onClick={(id) => navigate('product', id)} />
        </InsightCard>

        <InsightCard
          icon={Award}
          title="Highest-rated products"
          subtitle="Top 5 products by average rating across retailer records."
          accent="amber"
        >
          <ProductMiniList items={topRated.map((p) => ({ id: p.productId, name: p.productName, brand: p.brand, value: `${formatRating(p.avgRating)} / 5`, sub: `${p.websites.length} retailers` }))} onClick={(id) => navigate('product', id)} />
        </InsightCard>

        <InsightCard
          icon={Scale}
          title="Biggest price spread across retailers"
          subtitle="Products where the highest and lowest recorded prices differ the most (percent)."
          accent="teal"
        >
          <ProductMiniList
            items={spreads.map((p) => ({ id: p.productId, name: p.productName, brand: p.brand, value: `${p.spreadPct.toFixed(1)}%`, sub: `${formatINR(p.spread)} spread` }))}
            onClick={(id) => navigate('product', id)}
          />
        </InsightCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle title="Average price by category" subtitle="Identifies which categories tend to be more expensive." />
          <BarChartCard data={categoryAvgPrice} xLabel="Avg Price" formatter={(v) => formatINR(v, { compact: true })} />
        </Card>
        <Card>
          <SectionTitle title="Retailer-wise price comparison" subtitle="Average recorded price on each website." />
          <BarChartCard data={websiteBar} xLabel="Avg Price" formatter={(v) => formatINR(v, { compact: true })} color="#1f3460" />
        </Card>
        <Card>
          <SectionTitle title="Average discount by brand" subtitle="Brands offering the largest average discounts." />
          <BarChartCard data={brandAvgDiscount} xLabel="Avg Discount" formatter={(v) => `${v.toFixed(1)}%`} color="#f59e0b" />
        </Card>
        <Card>
          <SectionTitle title="Price vs. rating relationship" subtitle={`Correlation coefficient: ${priceRatingCorr.toFixed(3)}`} />
          <ScatterChartCard data={scatter} xLabel="Price" yLabel="Rating" />
        </Card>
      </div>

      {/* Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle title="How these insights are calculated" subtitle="Plain-language explanation" />
          <div className="space-y-3 text-sm text-navy-600 leading-relaxed">
            <Explanation icon={Tag}>
              <strong className="text-navy-900">Average price by category</strong> groups all records sharing the same
              Category value and computes the mean of their Price_INR field. Empty or invalid prices are excluded.
            </Explanation>
            <Explanation icon={Globe}>
              <strong className="text-navy-900">Retailer-wise comparison</strong> groups records by Website and
              averages each group independently, so a retailer with more records isn't weighted unfairly.
            </Explanation>
            <Explanation icon={Scale}>
              <strong className="text-navy-900">Price spread</strong> is the difference between the maximum and minimum
              recorded price for the same product across comparable retailer records, expressed as a percentage of
              the lowest price.
            </Explanation>
            <Explanation icon={Star}>
              <strong className="text-navy-900">Price-rating correlation</strong> is the Pearson coefficient across all
              records that have both a valid price and a valid rating. A value near zero means there is little linear
              relationship in this dataset.
            </Explanation>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Summary highlights" subtitle="From the verified dataset" />
          <div className="space-y-3 text-sm">
            <HighlightRow label="Category with highest average price" value={highestCategory ? `${highestCategory.label} (${formatINR(highestCategory.value)})` : '—'} />
            <HighlightRow label="Brand with largest average discount" value={topDiscountBrand ? `${topDiscountBrand.label} (${topDiscountBrand.value.toFixed(1)}%)` : '—'} />
            <HighlightRow label="Cheapest product" value={cheapest[0] ? `${cheapest[0].productName} (${formatINR(cheapest[0].lowestPrice)})` : '—'} />
            <HighlightRow label="Most expensive product" value={expensive[0] ? `${expensive[0].productName} (${formatINR(expensive[0].highestPrice)})` : '—'} />
            <HighlightRow label="Top-rated product" value={topRated[0] ? `${topRated[0].productName} (${formatRating(topRated[0].avgRating)}/5)` : '—'} />
            <HighlightRow label="Price-rating correlation" value={priceRatingCorr.toFixed(3)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  subtitle,
  children,
  accent,
}: {
  icon: typeof TrendingDown;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accent: 'teal' | 'navy' | 'amber';
}) {
  const accents = { teal: 'bg-teal-50 text-teal-600', navy: 'bg-navy-50 text-navy-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accents[accent]}`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-bold text-navy-900">{title}</h3>
          <p className="text-sm text-navy-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function ProductMiniList({
  items,
  onClick,
}: {
  items: { id: string; name: string; brand: string; value: string; sub: string }[];
  onClick: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <button key={it.id} onClick={() => onClick(it.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-navy-50 transition-colors text-left group">
          <span className="w-5 text-center text-xs font-bold text-navy-300">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-navy-800 truncate group-hover:text-teal-700 transition-colors">{it.name}</div>
            <div className="text-[11px] text-navy-400">{it.brand}{it.sub ? ` · ${it.sub}` : ''}</div>
          </div>
          <div className="text-sm font-semibold text-navy-900 shrink-0">{it.value}</div>
        </button>
      ))}
    </div>
  );
}

function Explanation({ icon: Icon, children }: { icon: typeof Star; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="text-teal-600 mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function HighlightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-navy-100 last:border-0">
      <span className="text-navy-500">{label}</span>
      <span className="font-semibold text-navy-900 text-right">{value}</span>
    </div>
  );
}
