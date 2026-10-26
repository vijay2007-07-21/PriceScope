import { useData } from '@/context/DataContext';
import { Card, SectionTitle } from '@/components/KpiCard';
import { PageHeader } from '@/components/Sidebar';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatINR } from '@/utils/format';
import {
  Database,
  Filter,
  GitCompareArrows,
  BarChart3,
  AlertTriangle,
  CheckSquare,
  FileSearch,
  Code2,
} from 'lucide-react';

const STEPS = [
  {
    icon: Database,
    title: 'Data collection',
    desc: 'Product-price observations were collected across the shopping retailers represented in the source dataset. Each row preserves its recorded product, retailer, price, and timestamp for transparent comparison.',
  },
  {
    icon: Filter,
    title: 'Data cleaning & preprocessing',
    desc: 'Records are parsed from the source CSV and validated. Rows with a missing product ID or a non-numeric price are excluded from analysis. Other numeric fields (MRP, discount, rating) are parsed leniently and excluded only from the specific aggregations where they are missing. No records are silently dropped or modified.',
  },
  {
    icon: CheckSquare,
    title: 'Duplicate & missing-value handling',
    desc: 'Each row represents a distinct observation (product × retailer × timestamp), so repeated product IDs are expected and retained. Unique-product counts use the distinct Product_ID field to avoid double-counting. Missing ratings or discounts are skipped in averages rather than treated as zero.',
  },
  {
    icon: FileSearch,
    title: 'Exploratory data analysis',
    desc: 'Summary statistics — count, mean, median, min, max, and Pearson correlation — are computed directly from the dataset on load. Charts visualize price distribution, category averages, retailer comparisons, discount patterns, and the price-rating relationship.',
  },
  {
    icon: GitCompareArrows,
    title: 'Product-price comparison',
    desc: 'For each product, records are grouped by retailer. The lowest recorded price is the minimum Price_INR among comparable records for the same product. Potential savings is the difference between the highest and lowest comparable prices, shown only when at least two records exist.',
  },
  {
    icon: BarChart3,
    title: 'Visualization & insight generation',
    desc: 'Charts and recommendation lists are generated from the same shared in-memory dataset, so the dashboard, comparison, analysis, and insights pages always agree. Filters narrow the same source records across pages.',
  },
];

const TECH = ['React + TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'PapaParse (CSV parsing)', 'Lucide Icons'];

const LIMITATIONS = [
  'The dataset is a limited sample and is not an exhaustive inventory of products, brands, categories, or retailers.',
  'Prices are historical records collected during the project, not live prices. They may differ from current retailer prices.',
  'Some products appear on only a subset of retailers; cross-retailer comparisons are limited to where comparable records exist.',
  'Ratings and discounts may vary between observations because they reflect the recorded value at the time of collection.',
  'Price history is shown only when multiple timestamped observations exist for the same product and retailer.',
];

export function MethodologyPage() {
  const { records, stats, loading, error, reload } = useData();

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!stats || !records.length) return <EmptyState message="No data available." />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader title="Methodology" subtitle="How PriceScope processes and analyzes the dataset." />

      {/* Steps */}
      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-teal-600">STEP {i + 1}</span>
                  <h3 className="font-bold text-navy-900">{step.title}</h3>
                </div>
                <p className="text-sm text-navy-600 leading-relaxed">{step.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Verified stats */}
      <Card>
        <SectionTitle title="Verified dataset statistics" subtitle="Computed from the actual loaded records" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Stat label="Total records" value={String(stats.totalRecords)} />
          <Stat label="Unique products" value={String(stats.uniqueProducts)} />
          <Stat label="Brands" value={String(stats.brands)} />
          <Stat label="Categories" value={String(stats.categories)} />
          <Stat label="Retailers" value={String(stats.websites)} />
          <Stat label="Average price" value={formatINR(stats.avgPrice)} />
          <Stat label="Median price" value={formatINR(stats.medianPrice)} />
          <Stat label="Min / Max" value={`${formatINR(stats.minPrice)} / ${formatINR(stats.maxPrice)}`} />
          <Stat label="Avg discount" value={`${stats.avgDiscount.toFixed(2)}%`} />
          <Stat label="Avg rating" value={`${stats.avgRating.toFixed(2)} / 5`} />
          <Stat label="Avg MRP" value={formatINR(stats.avgMRP)} />
          <Stat label="Price-rating corr." value={stats.priceRatingCorr.toFixed(3)} />
        </div>
      </Card>

      {/* Tech stack */}
      <Card>
        <SectionTitle title="Technologies & methods used" subtitle="Only the stack actually in this project" />
        <div className="flex flex-wrap gap-2">
          {TECH.map((t) => (
            <span key={t} className="badge-navy text-sm py-1.5 px-3">
              <Code2 size={13} className="mr-1" /> {t}
            </span>
          ))}
        </div>
      </Card>

      {/* Limitations */}
      <Card className="border-amber-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-amber-600" />
          <h3 className="font-bold text-navy-900">Limitations of the dataset</h3>
        </div>
        <ul className="space-y-2.5 text-sm text-navy-600">
          {LIMITATIONS.map((l, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{l}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy-50 rounded-lg p-3">
      <div className="text-[11px] text-navy-400 uppercase tracking-wide font-medium">{label}</div>
      <div className="font-bold text-navy-900 mt-0.5">{value}</div>
    </div>
  );
}
