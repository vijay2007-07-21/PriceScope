export function formatINR(value: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(value)) return '—';
  if (opts.compact && Math.abs(value) >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  if (opts.compact && Math.abs(value) >= 1000) {
    return `₹${(value / 1000).toFixed(1)}k`;
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}

export function formatRating(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

export function formatDate(value: string): string {
  if (!value) return '—';
  const parts = value.split('-');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${d}/${m}/${y}`;
  }
  return value;
}
