
import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useNav } from '@/context/NavContext';
import {
  summarizeProducts,
  websitePriceComparison,
} from '@/data/aggregations';
import { formatINR } from '@/utils/format';
import { KpiCard, Card, SectionTitle } from '@/components/KpiCard';
import { ProductArtwork } from '@/components/ProductArtwork';
import { BarChartCard, PieChartCard } from '@/components/Charts';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import {
  Search,
  TrendingDown,
  Package,
  Tag,
  Globe,
  Star,
  IndianRupee,
  Percent,
  ArrowRight,
  Layers,
  ShoppingBag,
  Info,
  Sparkles,
  ChartNoAxesCombined,
  ShieldCheck,
  MoveUpRight,
} from 'lucide-react';

export function HomePage() {
  const { records, stats, loading, error, reload } = useData();
  const { navigate, onSearchSubmit } = useNav();

  const products = useMemo(
    () => summarizeProducts(records),
    [records],
  );

  const websiteData = useMemo(
    () =>
      websitePriceComparison(records).map((w) => ({
        label: w.website,
        value: w.avgPrice,
      })),
    [records],
  );

  const featured = useMemo(
    () =>
      [...products]
        .sort((a, b) => a.lowestPrice - b.lowestPrice)
        .slice(0, 6),
    [products],
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    const seen = new Set<string>();

    for (const r of records) {
      const key = `${r.Category}|${r.Product_ID}`;

      if (!seen.has(key)) {
        seen.add(key);
        map.set(r.Category, (map.get(r.Category) ?? 0) + 1);
      }
    }

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [records]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!stats || !records.length) {
    return <EmptyState message="No records found in the dataset." />;
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = String(formData.get('q') ?? '').trim();

    if (q) {
      onSearchSubmit(q);
      navigate('comparison');
    }
  };

  return (
    <div className="space-y-10 lg:space-y-14 animate-fade-in">
      {/* CINEMATIC HERO */}
      <section className="hero-panel relative isolate overflow-hidden rounded-[28px] border border-emerald-100/10 bg-[#090e0b] text-white shadow-2xl">
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-400/15 blur-[100px] ambient-glow" />
          <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage:
                'linear-gradient(to bottom right, black, transparent 85%)',
            }}
          />
        </div>

        <div className="relative grid items-center gap-10 px-6 py-10 sm:px-9 sm:py-12 lg:grid-cols-[1.2fr_.8fr] lg:px-12 lg:py-16">
          {/* Hero copy */}
          <div className="hero-copy min-w-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3.5 py-2 text-xs font-medium text-emerald-200">
              <Sparkles size={14} className="shrink-0 text-emerald-300" />
              <span>Price intelligence, made clearer</span>
              <span className="hidden text-emerald-100/40 sm:inline">/</span>
              <span className="hidden sm:inline">
                {stats.websites} retailers
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-5xl lg:text-6xl xl:text-7xl">
              Every Price
              <br />
              Has a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-green-500">
                Story.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
              Discover recorded prices, compare retailers, and explore
              product trends. Make your next shopping decision with
              better information.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
            >
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search products</span>
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  name="q"
                  type="text"
                  placeholder="Search a product or brand..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] py-4 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none backdrop-blur-xl transition focus:border-emerald-300/60 focus:ring-4 focus:ring-emerald-300/10"
                />
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-6 py-4 text-sm font-bold text-[#07130b] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-[0_8px_35px_rgba(52,211,153,0.18)]"
              >
                Explore prices
                <ArrowRight size={17} />
              </button>
            </form>

            <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-white/45">
              <Info size={14} className="mt-0.5 shrink-0 text-emerald-300/80" />
              <span>
                Historical dataset analysis. Prices are not guaranteed to
                reflect current retailer prices.
              </span>
            </div>
          </div>

          {/* Decorative price intelligence panel */}
          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="absolute -inset-5 rounded-[32px] bg-emerald-400/[0.07] blur-3xl" />

            <div className="relative rounded-3xl border border-white/10 bg-[#111a14]/90 p-5 shadow-2xl backdrop-blur-2xl sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-white/45">
                    YOUR PRICE OVERVIEW
                  </div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">
                    Market snapshot
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-300">
                  <ChartNoAxesCombined size={20} />
                </div>
              </div>

              <figure
                aria-label="Illustrative electronics showcase"
                className="group relative mt-5 h-36 overflow-hidden rounded-2xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_50%_120%,rgba(55,180,105,.2),transparent_65%),linear-gradient(135deg,#18231b,#0d130f)] sm:h-40"
              >
                <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
                <div className="absolute inset-0 flex items-center justify-center gap-3 pb-4">
                  <div className="showcase-photo showcase-photo-left">
                    <img src="/images/products/headphones.jpg" alt="Illustrative wireless headphones" />
                  </div>
                  <div className="showcase-photo showcase-photo-center">
                    <img src="/images/products/phone.jpg" alt="Illustrative smartphone" />
                  </div>
                  <div className="showcase-photo showcase-photo-right">
                    <img src="/images/products/laptop.jpg" alt="Illustrative laptop computer" />
                  </div>
                </div>
                <figcaption className="absolute inset-x-4 bottom-2.5 flex items-end justify-between gap-3">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55">
                    Illustrative device visuals
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[9px] text-white/65 backdrop-blur-sm">
                    Product imagery
                  </span>
                </figcaption>
              </figure>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                  <div className="text-xs text-white/45">
                    Unique products
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {stats.uniqueProducts}
                  </div>
                  <div className="mt-2 text-xs text-emerald-300">
                    <Package size={12} className="mr-1 inline" />
                    In your dataset
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                  <div className="text-xs text-white/45">
                    Retailers
                  </div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">
                    {stats.websites}
                  </div>
                  <div className="mt-2 text-xs text-emerald-300">
                    <Globe size={12} className="mr-1 inline" />
                    Compared
                  </div>
                </div>
              </div>

              {/* Decorative chart; not presented as live market data */}
              <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-white/55">
                    Price discovery
                  </span>
                  <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                    DATASET VIEW
                  </span>
                </div>

                <div className="mt-5 flex h-24 items-end gap-2">
                  {[38, 56, 44, 70, 52, 84, 64, 94, 68, 78, 57, 88].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-md transition-all duration-500 hover:opacity-70"
                        style={{
                          height: `${height}%`,
                          background:
                            index === 7
                              ? 'linear-gradient(to top, #16a34a, #a7f3d0)'
                              : `linear-gradient(to top, rgba(16,185,129,${0.18 + (height / 100) * 0.35}), rgba(110,231,183,${0.35 + (height / 100) * 0.45}))`,
                        }}
                      />
                    ),
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-white/35">
                  <span>Price analysis</span>
                  <span>Illustrative visual</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.045] p-3.5">
                <ShieldCheck
                  size={19}
                  className="shrink-0 text-emerald-300"
                />
                <div className="text-xs leading-5 text-white/60">
                  <span className="font-semibold text-white/85">
                    Data-first insights
                  </span>
                  <br />
                  Explore the records behind each comparison.
                </div>
                <MoveUpRight
                  size={16}
                  className="ml-auto shrink-0 text-white/35"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
      </section>

      {/* OVERVIEW STATS */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              At a glance
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Your dataset, decoded.
            </h2>
          </div>
          <span className="text-xs text-white/40">
            Computed from available records
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <KpiCard
            label="Product Records"
            value={String(stats.totalRecords)}
            icon={Layers}
            accent="teal"
          />
          <KpiCard
            label="Unique Products"
            value={String(stats.uniqueProducts)}
            icon={Package}
            accent="navy"
          />
          <KpiCard
            label="Brands"
            value={String(stats.brands)}
            icon={Tag}
            accent="amber"
          />
          <KpiCard
            label="Retailers"
            value={String(stats.websites)}
            icon={Globe}
            accent="teal"
          />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Discover
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Featured products
            </h2>
            <p className="mt-2 text-sm text-white/45">
              Products with the lowest recorded prices in your dataset.
            </p>
          </div>

          <button
            onClick={() => navigate('comparison')}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-emerald-300/30 hover:text-emerald-300"
          >
            Compare products
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((p, index) => (
            <button
              key={p.productId}
              onClick={() => navigate('product', p.productId)}
              className="featured-product group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#17211b] to-[#0d120f] p-3.5 text-left transition duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:shadow-[0_18px_45px_rgba(0,0,0,0.25)] animate-reveal"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <ProductArtwork
                name={p.productName}
                category={p.category}
                className="featured-artwork"
                imageClassName="group-hover:scale-[1.06]"
              />

              <div className="relative flex items-start justify-between gap-3 px-1 pt-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                    {p.brand}
                  </div>
                  <h3 className="mt-2 truncate text-base font-semibold text-white transition group-hover:text-emerald-200">
                    {p.productName}
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    {p.category}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/60">
                  {p.websites.length} sites
                </span>
              </div>

              <div className="relative mt-5 flex items-end justify-between gap-3 border-t border-white/[0.08] px-1 pt-4">
                <div className="min-w-0">
                  <div className="text-[11px] text-white/50">
                    Lowest recorded price
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    {formatINR(p.lowestPrice)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                    <TrendingDown size={13} />
                    Recorded at {p.bestWebsite}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-300/[0.08] px-2.5 py-1.5 text-xs font-semibold text-amber-200">
                    <Star size={13} className="fill-amber-300 text-amber-300" />
                    {p.avgRating.toFixed(1)}
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition group-hover:border-emerald-300/30 group-hover:bg-emerald-300/10 group-hover:text-emerald-300">
                    <ArrowRight size={15} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* EXPLORE + RETAILER CHART */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.85fr_1.5fr]">
        <Card className="!border-white/10 !bg-[#101713] !p-5 sm:!p-6">
          <SectionTitle
            title="Explore PriceScope"
            subtitle="Choose what you want to investigate"
          />

          <div className="mt-5 space-y-2.5">
            {[
              {
                key: 'dashboard' as const,
                label: 'Analytics dashboard',
                icon: TrendingDown,
                desc: 'KPIs and price analysis',
              },
              {
                key: 'comparison' as const,
                label: 'Product comparison',
                icon: ShoppingBag,
                desc: 'Compare retailer prices',
              },
              {
                key: 'insights' as const,
                label: 'Smart shopping',
                icon: Star,
                desc: 'Budget and value insights',
              },
              {
                key: 'dataset' as const,
                label: 'Dataset explorer',
                icon: Layers,
                desc: 'Browse collected records',
              },
            ].map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                onClick={() => navigate(key)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition duration-200 hover:border-emerald-300/15 hover:bg-emerald-300/[0.045]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/60 transition group-hover:border-emerald-300/20 group-hover:bg-emerald-300/10 group-hover:text-emerald-300">
                  <Icon size={18} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white/90">
                    {label}
                  </span>
                  <span className="mt-1 block truncate text-xs text-white/40">
                    {desc}
                  </span>
                </span>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-white/25 transition group-hover:translate-x-1 group-hover:text-emerald-300"
                />
              </button>
            ))}
          </div>
        </Card>

        <Card className="!border-white/10 !bg-[#101713] !p-5 sm:!p-6">
          <SectionTitle
            title="Average price by retailer"
            subtitle="Average recorded price across available records"
          />
          <div className="mt-4">
            <BarChartCard
              data={websiteData}
              xLabel="Average price"
              formatter={(v) => formatINR(v, { compact: true })}
            />
          </div>
        </Card>
      </section>

      {/* DATASET INSIGHTS */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="!border-white/10 !bg-[#101713] !p-5 sm:!p-6">
          <SectionTitle
            title="Dataset statistics"
            subtitle="Calculated from actual records"
          />

          <div className="mt-4 space-y-1">
            <StatRow
              icon={IndianRupee}
              label="Average price"
              value={formatINR(stats.avgPrice)}
            />
            <StatRow
              icon={IndianRupee}
              label="Median price"
              value={formatINR(stats.medianPrice)}
            />
            <StatRow
              icon={IndianRupee}
              label="Min / Max price"
              value={`${formatINR(stats.minPrice)} – ${formatINR(stats.maxPrice)}`}
            />
            <StatRow
              icon={Percent}
              label="Average discount"
              value={`${stats.avgDiscount.toFixed(2)}%`}
            />
            <StatRow
              icon={Star}
              label="Average rating"
              value={`${stats.avgRating.toFixed(2)} / 5`}
            />
            <StatRow
              icon={IndianRupee}
              label="Average MRP"
              value={formatINR(stats.avgMRP)}
            />
          </div>
        </Card>

        <Card className="xl:col-span-2 !border-white/10 !bg-[#101713] !p-5 sm:!p-6">
          <SectionTitle
            title="Products by category"
            subtitle="Unique products in each category"
          />
          <div className="mt-4">
            <PieChartCard
              data={categoryCounts}
              formatter={(v) => `${v} products`}
            />
          </div>
        </Card>
      </section>

      {/* TRANSPARENCY NOTE */}
      <section className="flex items-start gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4 sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300">
          <ShieldCheck size={19} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Clear data. Smarter decisions.
          </h3>
          <p className="mt-1 text-xs leading-6 text-white/50">
            PriceScope visualizes the records available in its dataset.
            Historical prices, ratings, discounts, and experimental ML
            estimates should not be treated as guaranteed live prices
            or future market outcomes.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-2.5 text-sm text-white/50">
        <Icon size={15} className="shrink-0 text-emerald-300/70" />
        <span>{label}</span>
      </div>
      <div className="shrink-0 text-right text-sm font-semibold text-white/90">
        {value}
      </div>
    </div>
  );
}
