
import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { useNav } from '@/context/NavContext';
import { groupByProduct, average } from '@/data/aggregations';
import {
  formatINR,
  formatPercent,
  formatRating,
  formatDate,
} from '@/utils/format';
import { Card, SectionTitle, KpiCard } from '@/components/KpiCard';
import { ProductArtwork } from '@/components/ProductArtwork';
import { PRICE_API_BASE_URL } from '@/utils/api';
import {
  MultiBarChartCard,
  LineChartCard,
} from '@/components/Charts';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { TEAL, NAVY, AMBER } from '@/components/Charts';
import type { ProductRecord } from '@/data/types';
import {
  ArrowLeft,
  Star,
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Globe,
  ExternalLink,
  ShoppingBag,
  Info,
} from 'lucide-react';

type PredictionResult = {
  product_id: string;
  website: string;
  predicted_price: number;
  currency: string;
  model_type: string;
  is_real_market_quote: boolean;
  warning: string;
};

export function ProductDetailPage() {
  const { records, loading, error, reload } = useData();
  const { selectedProductId, navigate } = useNav();

  const [prediction, setPrediction] =
    useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState('');

  const productRows = useMemo(() => {
    if (!selectedProductId) return [];
    const groups = groupByProduct(records);
    return groups.get(selectedProductId) ?? [];
  }, [records, selectedProductId]);

  // Group by website for comparison chart
  const websiteData = useMemo(() => {
    const map = new Map<string, ProductRecord[]>();

    for (const r of productRows) {
      if (!map.has(r.Website)) map.set(r.Website, []);
      map.get(r.Website)!.push(r);
    }

    return Array.from(map.entries()).map(([website, rows]) => ({
      website,
      avgPrice: average(rows.map((r) => r.Price_INR)),
      minPrice: Math.min(...rows.map((r) => r.Price_INR)),
      maxPrice: Math.max(...rows.map((r) => r.Price_INR)),
      count: rows.length,
    }));
  }, [productRows]);

  // Price history over timestamps (per website)
  const timestamps = useMemo(() => {
    const set = new Set(productRows.map((r) => r.Timestamp));

    return Array.from(set).sort((a, b) => {
      const [da, ma, ya] = a.split('-').map(Number);
      const [db, mb, yb] = b.split('-').map(Number);

      return (
        new Date(ya, ma - 1, da).getTime() -
        new Date(yb, mb - 1, db).getTime()
      );
    });
  }, [productRows]);

  const historyData = useMemo(() => {
    return timestamps.map((ts) => {
      const point: Record<string, string | number> = {
        date: formatDate(ts),
      };

      for (const w of websiteData) {
        const rec = productRows.find(
          (r) => r.Website === w.website && r.Timestamp === ts
        );
        point[w.website] = rec ? rec.Price_INR : 0;
      }

      return point;
    });
  }, [timestamps, websiteData, productRows]);

  // Request an experimental estimate from the FastAPI backend.
  async function getPrediction() {
    if (!selectedProductId || productRows.length === 0) return;

    // Use the latest recorded row for the selected product.
    const latestRow = [...productRows].sort((a, b) => {
      const [da, ma, ya] = a.Timestamp.split('-').map(Number);
      const [db, mb, yb] = b.Timestamp.split('-').map(Number);

      return (
        new Date(yb, mb - 1, db).getTime() -
        new Date(ya, ma - 1, da).getTime()
      );
    })[0];

    setPredicting(true);
    setPrediction(null);
    setPredictionError('');

    try {
      const response = await fetch(
        `${PRICE_API_BASE_URL}/predict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: latestRow.Product_ID,
            website: latestRow.Website,
            previous_price: latestRow.Price_INR,
            // Placeholder until a reliable prior-price change is calculated.
            previous_change: 0,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Prediction API returned ${response.status}`);
      }

      const result: PredictionResult = await response.json();

      if (
        !Number.isFinite(result.predicted_price) ||
        result.predicted_price <= 0
      ) {
        throw new Error('The API returned an invalid predicted price.');
      }

      setPrediction(result);
    } catch (err) {
      console.error('PriceScope prediction error:', err);

      setPredictionError(
        `Could not get a prediction. Make sure the FastAPI backend is running at ${PRICE_API_BASE_URL} and allows requests from this website.`
      );
    } finally {
      setPredicting(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  if (!selectedProductId || productRows.length === 0) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => navigate('comparison')}
          className="btn-ghost mb-4"
        >
          <ArrowLeft size={16} /> Back to comparison
        </button>

        <EmptyState message="Product not found. It may not exist in the dataset." />
      </div>
    );
  }

  const r0 = productRows[0];
  const prices = productRows.map((r) => r.Price_INR);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const savings = highest - lowest;
  const lowestRow = productRows.find((r) => r.Price_INR === lowest)!;
  const ratings = productRows
    .map((r) => r.Rating)
    .filter(Number.isFinite);
  const hasMultipleWebsites = websiteData.length >= 2;
  const hasHistory = timestamps.length >= 2;

  const barData = websiteData.map((w) => ({
    label: w.website,
    avg: w.avgPrice,
    min: w.minPrice,
    max: w.maxPrice,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('comparison')}
        className="btn-ghost py-2 px-3"
      >
        <ArrowLeft size={16} /> Back to comparison
      </button>

      {/* Product header */}
      <Card className="bg-navy-900 text-white">
        <div className="product-detail-hero flex items-center justify-between gap-6 flex-wrap">
          <ProductArtwork
            name={r0.Product_Name}
            category={r0.Category}
            className="product-detail-artwork h-44 w-full sm:h-48 sm:w-64"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge bg-teal-500 text-navy-900">
                {r0.Brand}
              </span>
              <span className="badge bg-navy-800 text-teal-300">
                {r0.Category}
              </span>
              <span className="text-xs text-navy-300 font-mono">
                {r0.Product_ID}
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
              {r0.Product_Name}
            </h1>
          </div>

          <div className="product-detail-price text-left sm:text-right">
            <div className="text-[11px] text-navy-300 uppercase tracking-wide">
              Lowest recorded
            </div>
            <div className="text-3xl font-bold text-teal-400">
              {formatINR(lowest)}
            </div>
            <div className="text-xs text-navy-300">
              at {lowestRow.Website}
            </div>
          </div>
        </div>
      </Card>

      {/* Experimental ML prediction */}
      <Card>
        <SectionTitle
          title="Experimental ML Price Estimate"
          subtitle="Ridge Regression prototype · Not a live market price"
        />

        <p className="text-sm text-navy-500 mb-4">
          Request an experimental price estimate for this product using
          the locally running PriceScope ML model.
        </p>

        <button
          onClick={getPrediction}
          disabled={predicting}
          className="btn-secondary disabled:opacity-50"
        >
          {predicting ? 'Predicting...' : 'Estimate price with ML'}
        </button>

        {predictionError && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            {predictionError}
          </div>
        )}

        {prediction && (
          <div className="mt-4 rounded-lg bg-teal-50 border border-teal-100 p-4">
            <p className="text-sm text-navy-500">
              Experimental estimated price
            </p>

            <p className="text-2xl font-bold text-teal-700">
              {formatINR(prediction.predicted_price)}
            </p>

            <p className="mt-2 text-xs text-navy-600">
              Product: {prediction.product_id} · Retailer: {prediction.website}
            </p>

            <p className="mt-2 text-xs text-navy-500">
              {prediction.warning}
            </p>

            <p className="mt-2 text-xs text-navy-500">
              This is a model estimate, not a verified future price or a
              live retailer quote.
            </p>
          </div>
        )}
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Lowest Recorded"
          value={formatINR(lowest)}
          icon={TrendingDown}
          accent="teal"
          sub={`at ${lowestRow.Website}`}
        />

        <KpiCard
          label="Highest Recorded"
          value={formatINR(highest)}
          icon={TrendingUp}
          accent="navy"
        />

        <KpiCard
          label="Potential Savings"
          value={hasMultipleWebsites ? formatINR(savings) : '—'}
          icon={IndianRupee}
          accent="amber"
          sub={hasMultipleWebsites ? 'across retailers' : 'single retailer'}
        />

        <KpiCard
          label="Avg Rating"
          value={ratings.length ? `${formatRating(average(ratings))}/5` : '—'}
          icon={Star}
          accent="teal"
          sub={`${productRows.length} records`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionTitle
            title="Recorded price by retailer"
            subtitle="Average, minimum, and maximum recorded price per website"
          />

          {hasMultipleWebsites ? (
            <MultiBarChartCard
              data={barData}
              xKey="label"
              bars={[
                { key: 'min', name: 'Lowest', color: TEAL },
                { key: 'avg', name: 'Average', color: NAVY },
                { key: 'max', name: 'Highest', color: AMBER },
              ]}
              formatter={(v) => formatINR(v, { compact: true })}
            />
          ) : (
            <div className="py-8 text-center text-sm text-navy-400">
              This product appears on only one retailer in the dataset — no
              cross-retailer comparison available.
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Price history"
            subtitle="Recorded prices over time per retailer"
          />

          {hasHistory ? (
            <LineChartCard
              data={historyData}
              xKey="date"
              yKey=""
              formatter={(v) => formatINR(v)}
              lines={websiteData.map((w, i) => ({
                key: w.website,
                name: w.website,
                color: [TEAL, NAVY, AMBER, '#6366f1'][i % 4],
              }))}
            />
          ) : (
            <div className="py-8 text-center text-sm text-navy-400">
              Only one timestamp is recorded for this product — a price-history
              chart would not be meaningful.
            </div>
          )}
        </Card>
      </div>

      {/* Retailer records table */}
      <Card>
        <SectionTitle
          title="Retailer records"
          subtitle={`${productRows.length} records from the dataset`}
        />

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[680px]">
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
              {productRows.map((r, i) => {
                const isLow =
                  r.Price_INR === lowest && r.Website === lowestRow.Website;

                return (
                  <tr
                    key={i}
                    className={`border-b border-navy-50 last:border-0 ${
                      isLow ? 'bg-teal-50/60' : ''
                    }`}
                  >
                    <td className="py-2.5 font-medium text-navy-800">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-navy-400" />
                        {r.Website}
                        {isLow && (
                          <span className="badge-teal text-[10px] py-0.5 px-1.5">
                            Lowest
                          </span>
                        )}
                      </span>
                    </td>

                    <td className="py-2.5 text-right font-semibold text-navy-900">
                      {formatINR(r.Price_INR)}
                    </td>

                    <td className="py-2.5 text-right text-navy-500">
                      {formatINR(r.MRP_INR)}
                    </td>

                    <td className="py-2.5 text-right text-amber-700 font-medium">
                      {formatPercent(r.Discount_Percent)}
                    </td>

                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-navy-700">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {formatRating(r.Rating)}
                      </span>
                    </td>

                    <td className="py-2.5 text-navy-500 text-xs">
                      {r.Availability || '—'}
                    </td>

                    <td className="py-2.5 text-navy-400 text-xs">
                      {formatDate(r.Timestamp)}
                    </td>

                    <td className="py-2.5 text-right">
                      {r.Product_URL && (
                        <a
                          href={r.Product_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 inline-flex"
                          aria-label={`Open ${r.Product_Name} retailer page`}
                        >
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
      </Card>

      {/* Footer note + quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2 text-xs text-navy-400 bg-navy-50 rounded-lg p-3.5 flex-1">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Prices shown are historical dataset records collected during the
            project, not current live prices. The lowest recorded price is the
            minimum observed price in the dataset for this product.
          </p>
        </div>

        <button
          onClick={() => navigate('insights')}
          className="btn-secondary shrink-0"
        >
          <ShoppingBag size={16} /> Smart recommendations
        </button>
      </div>
    </div>
  );
}
