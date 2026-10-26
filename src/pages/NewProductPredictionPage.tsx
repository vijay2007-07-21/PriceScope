import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  FlaskConical,
  Info,
  LoaderCircle,
  Sparkles,
} from 'lucide-react';
import { Card, SectionTitle } from '@/components/KpiCard';
import { PageHeader } from '@/components/Sidebar';
import { useData } from '@/context/DataContext';
import { formatINR } from '@/utils/format';
import { PRICE_API_BASE_URL } from '@/utils/api';

interface NewProductPredictionResult {
  product_name: string;
  retailer: string;
  input_price: number;
  estimated_price: number;
  estimated_difference: number;
  estimated_change_percent: number;
  currency: string;
  prediction_horizon_days: number;
  model_type: string;
  is_real_market_quote: boolean;
  validation: {
    validation: string;
    held_out_products: number;
    evaluated_transitions: number;
    baseline: {
      name: string;
      mae_inr: number;
      rmse_inr: number;
    };
    model: {
      mae_inr: number;
      rmse_inr: number;
    };
    product_holdout: {
      validation: string;
      held_out_products: number;
      baseline: {
        mae_inr: number;
        rmse_inr: number;
      };
      model: {
        mae_inr: number;
        rmse_inr: number;
      };
    };
  };
  training_products: number;
  observation_dates: string[];
  limitations: string;
  warning: string;
}

interface PredictionForm {
  productName: string;
  category: string;
  retailer: string;
  currentPrice: string;
  previousPrice: string;
  previousChange: string;
}

const INITIAL_FORM: PredictionForm = {
  productName: '',
  category: '',
  retailer: '',
  currentPrice: '',
  previousPrice: '',
  previousChange: '',
};

function isPredictionResult(value: unknown): value is NewProductPredictionResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Partial<NewProductPredictionResult>;
  if (typeof result.validation !== 'object' || result.validation === null) {
    return false;
  }
  const validation = result.validation;
  return (
    typeof result.product_name === 'string' &&
    typeof result.retailer === 'string' &&
    typeof result.input_price === 'number' &&
    Number.isFinite(result.input_price) &&
    typeof result.estimated_price === 'number' &&
    Number.isFinite(result.estimated_price) &&
    result.estimated_price > 0 &&
    typeof result.estimated_difference === 'number' &&
    typeof result.estimated_change_percent === 'number' &&
    result.currency === 'INR' &&
    result.prediction_horizon_days === 1 &&
    typeof result.model_type === 'string' &&
    result.is_real_market_quote === false &&
    typeof result.warning === 'string' &&
    typeof validation.validation === 'string' &&
    typeof validation.held_out_products === 'number' &&
    typeof validation.evaluated_transitions === 'number' &&
    typeof validation.baseline?.mae_inr === 'number' &&
    typeof validation.baseline?.rmse_inr === 'number' &&
    typeof validation.model?.mae_inr === 'number' &&
    typeof validation.model?.rmse_inr === 'number' &&
    typeof validation.product_holdout?.validation === 'string' &&
    typeof validation.product_holdout?.held_out_products === 'number' &&
    typeof validation.product_holdout?.baseline?.mae_inr === 'number' &&
    typeof validation.product_holdout?.baseline?.rmse_inr === 'number' &&
    typeof validation.product_holdout?.model?.mae_inr === 'number' &&
    typeof validation.product_holdout?.model?.rmse_inr === 'number' &&
    typeof result.training_products === 'number' &&
    Array.isArray(result.observation_dates) &&
    typeof result.limitations === 'string'
  );
}

function getApiErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'detail' in payload &&
    typeof payload.detail === 'string'
  ) {
    return payload.detail;
  }
  return `The prediction service returned HTTP ${status}.`;
}

export function NewProductPredictionPage() {
  const { records } = useData();
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState<NewProductPredictionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [...new Set(records.map((record) => record.Category))].sort(),
    [records]
  );
  const retailers = useMemo(
    () => [...new Set(records.map((record) => record.Website))].sort(),
    [records]
  );
  const observedProductCount = useMemo(
    () => new Set(records.map((record) => record.Product_ID)).size,
    [records]
  );
  const observedDateCount = useMemo(
    () => new Set(records.map((record) => record.Timestamp)).size,
    [records]
  );

  function updateField(field: keyof PredictionForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);

    const currentPrice = Number(form.currentPrice);
    const previousPrice = form.previousPrice.trim()
      ? Number(form.previousPrice)
      : null;
    const previousChange = form.previousChange.trim()
      ? Number(form.previousChange)
      : null;

    if (
      !form.productName.trim() ||
      !form.category.trim() ||
      !form.retailer.trim()
    ) {
      setError('Enter a product name, category, and retailer to continue.');
      return;
    }
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      setError('Current price must be a number greater than ₹0.');
      return;
    }
    if (
      (previousPrice !== null &&
        (!Number.isFinite(previousPrice) || previousPrice <= 0)) ||
      (previousChange !== null && !Number.isFinite(previousChange))
    ) {
      setError('Optional price history must contain valid numeric values.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${PRICE_API_BASE_URL}/predict/new-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: form.productName.trim(),
          category: form.category.trim(),
          retailer: form.retailer.trim(),
          current_price: currentPrice,
          previous_price: previousPrice,
          previous_change: previousChange,
          prediction_horizon_days: 1,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getApiErrorMessage(payload, response.status));
      }
      if (!isPredictionResult(payload)) {
        throw new Error('The prediction service returned an invalid response.');
      }
      setResult(payload);
    } catch (caught) {
      setError(
        caught instanceof TypeError
          ? `Could not reach the prediction service at ${PRICE_API_BASE_URL}. Confirm that the FastAPI service is running and its CORS settings allow this site.`
          : caught instanceof Error
            ? caught.message
            : 'The prediction request failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const DifferenceIcon =
    result && result.estimated_difference < 0 ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predict New Product"
        subtitle="Explore an experimental estimate for a product identity that is not in the recorded dataset."
      />

      <Card className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <form onSubmit={submitPrediction} className="space-y-5 p-5 sm:p-7">
            <SectionTitle
              title="Product and retailer"
              subtitle="A product ID is not required. The product name identifies your request; the model uses category, retailer, and price history."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm font-medium text-white/85">
                  Product name <span className="text-emerald-300">*</span>
                </span>
                <input
                  className="input"
                  value={form.productName}
                  onChange={(event) =>
                    updateField('productName', event.target.value)
                  }
                  placeholder="e.g. Nova wireless speaker"
                  maxLength={200}
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-white/85">
                  Category <span className="text-emerald-300">*</span>
                </span>
                <input
                  className="input"
                  list="pricescope-categories"
                  value={form.category}
                  onChange={(event) =>
                    updateField('category', event.target.value)
                  }
                  placeholder="Choose or enter a category"
                  maxLength={100}
                  required
                />
                <datalist id="pricescope-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-white/85">
                  Retailer or website <span className="text-emerald-300">*</span>
                </span>
                <input
                  className="input"
                  list="pricescope-retailers"
                  value={form.retailer}
                  onChange={(event) =>
                    updateField('retailer', event.target.value)
                  }
                  placeholder="Choose or enter a retailer"
                  maxLength={100}
                  required
                />
                <datalist id="pricescope-retailers">
                  {retailers.map((retailer) => (
                    <option key={retailer} value={retailer} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="border-t border-white/[0.08] pt-5">
              <SectionTitle
                title="Recorded price and optional history"
                subtitle="Enter the price you have observed. If you provide a previous price without a change, the change is derived from these two values."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-white/85">
                  Current price (INR) <span className="text-emerald-300">*</span>
                </span>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.currentPrice}
                  onChange={(event) =>
                    updateField('currentPrice', event.target.value)
                  }
                  placeholder="12999"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-white/85">
                  Previous price (INR)
                </span>
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.previousPrice}
                  onChange={(event) =>
                    updateField('previousPrice', event.target.value)
                  }
                  placeholder="Optional"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-white/85">
                  Change from previous (INR)
                </span>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.previousChange}
                  onChange={(event) =>
                    updateField('previousChange', event.target.value)
                  }
                  placeholder="Optional; + / -"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs leading-5 text-white/50">
                Estimate horizon:{' '}
                <span className="text-white/80">
                  next observed daily interval (1 day)
                </span>
                <br />A 7-day estimate is not supported by the available
                history.
              </div>
              <button
                type="submit"
                className="btn-primary min-h-11 shrink-0"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Requesting estimate
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Estimate price
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] p-3.5 text-sm text-red-200"
                role="alert"
              >
                <Info size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          <aside className="flex flex-col border-t border-white/[0.08] bg-white/[0.025] p-5 sm:p-7 lg:border-l lg:border-t-0">
            {result ? (
              <div className="space-y-5" aria-live="polite">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/80">
                    <FlaskConical size={15} />
                    Experimental estimate
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {result.product_name}
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    {result.retailer} · Next observed daily interval
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.07] p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/55">
                    Estimated price
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-emerald-200">
                    {formatINR(result.estimated_price)}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Input price {formatINR(result.input_price)}
                  </p>
                  <p
                    className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${
                      result.estimated_difference < 0
                        ? 'text-emerald-200'
                        : result.estimated_difference > 0
                          ? 'text-amber-200'
                          : 'text-white/60'
                    }`}
                  >
                    <DifferenceIcon size={16} />
                    {result.estimated_difference > 0 ? '+' : ''}
                    {formatINR(result.estimated_difference)} (
                    {result.estimated_change_percent > 0 ? '+' : ''}
                    {result.estimated_change_percent.toFixed(2)}%)
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] p-4">
                  <h3 className="text-sm font-semibold text-white/85">
                    Product-level validation
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {result.validation.validation} ·{' '}
                    {result.validation.held_out_products} products held out
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-white/45">Model MAE / RMSE</p>
                      <p className="mt-1 text-white/80">
                        {formatINR(result.validation.model.mae_inr)} /{' '}
                        {formatINR(result.validation.model.rmse_inr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/45">Baseline MAE / RMSE</p>
                      <p className="mt-1 text-white/80">
                        {formatINR(result.validation.baseline.mae_inr)} /{' '}
                        {formatINR(result.validation.baseline.rmse_inr)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-white/[0.08] pt-3 text-xs">
                    <p className="text-white/45">
                      Independent product holdout ·{' '}
                      {result.validation.product_holdout.held_out_products}{' '}
                      unseen products
                    </p>
                    <p className="mt-1 text-white/80">
                      Model {formatINR(result.validation.product_holdout.model.mae_inr)} /{' '}
                      {formatINR(result.validation.product_holdout.model.rmse_inr)}
                      {' · '}Baseline{' '}
                      {formatINR(result.validation.product_holdout.baseline.mae_inr)} /{' '}
                      {formatINR(result.validation.product_holdout.baseline.rmse_inr)}
                    </p>
                  </div>
                </div>

                <p className="text-xs leading-5 text-white/45">
                  {result.warning} {result.limitations} This is not a live
                  retailer quote.
                </p>
              </div>
            ) : (
              <div className="my-auto space-y-5 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200/15 bg-emerald-300/[0.08] text-emerald-200">
                  <Sparkles size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    A cautious look beyond the catalogue
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Product identity is not used as a lookup key. The
                    experimental model uses category, retailer, current price,
                    and any price history you provide.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-black/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/65">
                    What validation covers
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/45">
                    {observedProductCount} product identities,{' '}
                    {observedDateCount} recorded dates, and one-day transitions
                    in the loaded dataset. New categories or retailers are
                    accepted safely, but were not independently validated.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </Card>
    </div>
  );
}
