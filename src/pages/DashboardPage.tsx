import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { EMPTY_FILTERS, type Filters } from '@/data/types';
import { applyFilters, computeStats, avgByKey, priceBuckets, websitePriceComparison } from '@/data/aggregations';
import { formatINR } from '@/utils/format';
import { KpiCard, Card, SectionTitle } from '@/components/KpiCard';
import { FilterBar } from '@/components/FilterBar';
import { BarChartCard, ScatterChartCard, NAVY, TEAL, AMBER } from '@/components/Charts';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PageHeader } from '@/components/Sidebar';
import {
  Layers,
  Package,
  Tag,
  Globe,
  IndianRupee,
  Percent,
  Star,
  TrendingDown,
  TrendingUp,
  AlignVerticalJustifyCenter,
  Gauge,
} from 'lucide-react';

export function DashboardPage() {
  const { records, loading, error, reload } = useData();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);

  const categoryAvgPrice = useMemo(() => avgByKey(filtered, 'Category', 'Price_INR'), [filtered]);
  const brandAvgPrice = useMemo(() => avgByKey(filtered, 'Brand', 'Price_INR'), [filtered]);
  const websiteData = useMemo(() => websitePriceComparison(filtered), [filtered]);
  const buckets = useMemo(() => priceBuckets(filtered), [filtered]);
  const ratingByCategory = useMemo(() => avgByKey(filtered, 'Category', 'Rating'), [filtered]);
  const discountByBrand = useMemo(() => avgByKey(filtered, 'Brand', 'Discount_Percent'), [filtered]);
  const scatter = useMemo(
    () => filtered.filter((r) => Number.isFinite(r.Price_INR) && Number.isFinite(r.Rating)).map((r) => ({ x: r.Price_INR, y: r.Rating, name: r.Product_Name })),
    [filtered]
  );

  const websiteBarData = useMemo(
    () => websiteData.map((w) => ({ label: w.website, value: w.avgPrice })),
    [websiteData]
  );

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const setF = (f: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...f }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Statistics computed directly from the currently loaded dataset records." />

      <FilterBar records={records} filters={filters} onChange={setF} onReset={() => setFilters(EMPTY_FILTERS)} showWebsite />

      {filtered.length === 0 ? (
        <EmptyState message="No records match the current filters." />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Records" value={String(stats.totalRecords)} icon={Layers} accent="teal" />
            <KpiCard label="Unique Products" value={String(stats.uniqueProducts)} icon={Package} accent="navy" />
            <KpiCard label="Brands" value={String(stats.brands)} icon={Tag} accent="amber" />
            <KpiCard label="Retailers" value={String(stats.websites)} icon={Globe} accent="teal" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Average Price" value={formatINR(stats.avgPrice)} icon={IndianRupee} accent="navy" sub={`Median ${formatINR(stats.medianPrice)}`} />
            <KpiCard label="Price Range" value={`${formatINR(stats.minPrice, { compact: true })}–${formatINR(stats.maxPrice, { compact: true })}`} icon={TrendingDown} accent="teal" />
            <KpiCard label="Avg Discount" value={`${stats.avgDiscount.toFixed(2)}%`} icon={Percent} accent="amber" />
            <KpiCard label="Avg Rating" value={`${stats.avgRating.toFixed(2)}/5`} icon={Star} accent="navy" sub={`Avg MRP ${formatINR(stats.avgMRP)}`} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <SectionTitle title="Price distribution" subtitle="Records grouped by price range" />
              <BarChartCard data={buckets.map((b) => ({ label: b.label, value: b.count }))} xLabel="Records" formatter={(v) => String(v)} />
            </Card>
            <Card>
              <SectionTitle title="Average price by category" subtitle="Across filtered records" />
              <BarChartCard data={categoryAvgPrice} xLabel="Avg Price" formatter={(v) => formatINR(v, { compact: true })} color={NAVY} />
            </Card>
            <Card>
              <SectionTitle title="Retailer-wise average price" subtitle="Average recorded price per website" />
              <BarChartCard data={websiteBarData} xLabel="Avg Price" formatter={(v) => formatINR(v, { compact: true })} color={TEAL} />
            </Card>
            <Card>
              <SectionTitle title="Average discount by brand" subtitle="Discount percentage averaged per brand" />
              <BarChartCard data={discountByBrand} xLabel="Avg Discount %" formatter={(v) => `${v.toFixed(1)}%`} color={AMBER} />
            </Card>
            <Card>
              <SectionTitle title="Brand-wise average price" subtitle="Across filtered records" />
              <BarChartCard data={brandAvgPrice} xLabel="Avg Price" formatter={(v) => formatINR(v, { compact: true })} color={NAVY} />
            </Card>
            <Card>
              <SectionTitle title="Average rating by category" subtitle="Ratings out of 5" />
              <BarChartCard data={ratingByCategory} xLabel="Avg Rating" formatter={(v) => v.toFixed(2)} color={TEAL} />
            </Card>
          </div>

          {/* Price-rating scatter */}
          <Card>
            <SectionTitle title="Price vs. Rating" subtitle={`Correlation: ${stats.priceRatingCorr.toFixed(3)} (weak / negligible relationship)`} />
            <ScatterChartCard data={scatter} xLabel="Price (INR)" yLabel="Rating" height={320} />
          </Card>

          {/* Retailer count + insight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <SectionTitle title="Retailer record counts" subtitle="How many records each retailer contributes" />
              <BarChartCard
                data={websiteData.map((w) => ({ label: w.website, value: w.count }))}
                xLabel="Records"
                formatter={(v) => String(v)}
                color={NAVY}
              />
            </Card>
            <Card>
              <SectionTitle title="Key observations" subtitle="From the current filter view" />
              <div className="space-y-3 text-sm">
                <Insight icon={TrendingUp} color="text-teal-600">
                  The cheapest recorded price in the current view is{' '}
                  <span className="font-semibold text-navy-900">{formatINR(stats.minPrice)}</span>.
                </Insight>
                <Insight icon={TrendingDown} color="text-navy-600">
                  The most expensive record is <span className="font-semibold text-navy-900">{formatINR(stats.maxPrice)}</span> —
                  a spread of <span className="font-semibold text-navy-900">{formatINR(stats.maxPrice - stats.minPrice)}</span>.
                </Insight>
                <Insight icon={AlignVerticalJustifyCenter} color="text-amber-600">
                  Average discount across records is{' '}
                  <span className="font-semibold text-navy-900">{stats.avgDiscount.toFixed(2)}%</span>, with an average MRP of{' '}
                  <span className="font-semibold text-navy-900">{formatINR(stats.avgMRP)}</span>.
                </Insight>
                <Insight icon={Gauge} color="text-navy-600">
                  The price-rating correlation is{' '}
                  <span className="font-semibold text-navy-900">{stats.priceRatingCorr.toFixed(3)}</span> — indicating little to no
                  linear relationship between a product's price and its rating in this dataset.
                </Insight>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Insight({ icon: Icon, color, children }: { icon: typeof TrendingUp; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-navy-600">
      <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
