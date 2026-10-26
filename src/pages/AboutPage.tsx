import { useData } from '@/context/DataContext';
import { Card, SectionTitle } from '@/components/KpiCard';
import { PageHeader } from '@/components/Sidebar';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatINR } from '@/utils/format';
import { TrendingDown, Target, Layers, Users, FileSpreadsheet, BookOpen } from 'lucide-react';

export function AboutPage() {
  const { records, stats, loading, error, reload } = useData();

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!stats || !records.length) return <EmptyState message="No data available." />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader title="About PriceScope" subtitle="A dataset-driven product-price analysis platform." />

      <Card className="bg-navy-900 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
            <TrendingDown size={24} className="text-navy-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">What is PriceScope?</h2>
            <p className="text-navy-200 leading-relaxed text-sm">
              PriceScope is an academic project that analyzes a collected dataset of product-price records from Indian
              shopping websites, including Amazon, Flipkart, Myntra, and Ajio. It helps users compare recorded prices,
              discounts, and ratings across retailers to understand pricing patterns and identify the lowest
              historically recorded price for each product. It is a research and demonstration tool, not a live
              price-tracking system.
            </p>
          </div>
        </div>
      </Card>

      {/* Snapshot */}
      <Card>
        <SectionTitle title="Dataset snapshot" subtitle="The data behind this website" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Snapshot icon={Layers} label="Records" value={String(stats.totalRecords)} />
          <Snapshot icon={Target} label="Unique products" value={String(stats.uniqueProducts)} />
          <Snapshot icon={Users} label="Brands" value={String(stats.brands)} />
          <Snapshot icon={BookOpen} label="Categories" value={String(stats.categories)} />
          <Snapshot icon={FileSpreadsheet} label="Retailers" value={String(stats.websites)} />
          <Snapshot icon={TrendingDown} label="Avg price" value={formatINR(stats.avgPrice, { compact: true })} />
        </div>
      </Card>

      {/* What you can do */}
      <Card>
        <SectionTitle title="What you can do here" />
        <div className="space-y-3 text-sm text-navy-600">
          <Feature title="Dashboard">View live-computed KPIs and interactive charts that respond to filters.</Feature>
          <Feature title="Product Comparison">Search products, expand to compare recorded prices across retailers, and see the lowest recorded price.</Feature>
          <Feature title="Price Analysis">Explore insights — cheapest products, highest-rated items, biggest discounts, and the price-rating relationship.</Feature>
          <Feature title="Smart Shopping">Set a budget and minimum rating to get transparent, data-backed recommendations.</Feature>
          <Feature title="Dataset Explorer">Browse, sort, filter, paginate, and export the full underlying dataset as CSV.</Feature>
        </div>
      </Card>

      <Card className="border-teal-200 bg-teal-50/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={20} className="text-teal-700" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 mb-1">Data integrity</h3>
            <p className="text-sm text-navy-600 leading-relaxed">
              Every number on this website is calculated from the same loaded dataset on page load — nothing is
              hardcoded. The original CSV is preserved and never modified. All {stats.totalRecords} records are available in the
              Dataset Explorer for verification.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-center text-xs text-navy-400 py-4">
        PriceScope — an academic data-analytics project. Prices are historical dataset records, not live prices.
      </p>
    </div>
  );
}

function Snapshot({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="bg-navy-50 rounded-lg p-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mx-auto mb-2 shadow-sm">
        <Icon size={18} className="text-teal-600" />
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-400 mt-0.5">{label}</div>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-navy-100 last:border-0 last:pb-0">
      <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
      <div>
        <span className="font-semibold text-navy-900">{title}: </span>
        <span>{children}</span>
      </div>
    </div>
  );
}
