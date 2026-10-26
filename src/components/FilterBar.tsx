import type { Filters } from '@/data/types';
import { uniqueValues } from '@/data/aggregations';
import type { ProductRecord } from '@/data/types';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  records: ProductRecord[];
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
  showWebsite?: boolean;
  showSearch?: boolean;
  compact?: boolean;
}

export function FilterBar({
  records,
  filters,
  onChange,
  onReset,
  showWebsite = true,
  showSearch = false,
  compact = false,
}: FilterBarProps) {
  const categories = uniqueValues(records, 'Category');
  const brands = uniqueValues(records, 'Brand');
  const websites = uniqueValues(records, 'Website');

  const hasActive =
    filters.search ||
    filters.website ||
    filters.category ||
    filters.brand ||
    filters.minPrice != null ||
    filters.maxPrice != null;

  return (
    <div className={`card p-4 ${compact ? '' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-navy-700">
          <SlidersHorizontal size={16} className="text-teal-600" />
          <span className="font-semibold text-sm">Filters</span>
          {hasActive && <span className="badge-teal text-[10px] py-0.5 px-2">{hasActive ? 'Active' : ''}</span>}
        </div>
        {hasActive && (
          <button onClick={onReset} className="text-xs text-navy-400 hover:text-navy-700 flex items-center gap-1 transition-colors">
            <X size={13} /> Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {showSearch && (
          <div>
            <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              placeholder="Product name or brand"
              className="input"
            />
          </div>
        )}
        {showWebsite && (
          <div>
            <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Website</label>
            <select className="select" value={filters.website} onChange={(e) => onChange({ website: e.target.value })}>
              <option value="">All websites</option>
              {websites.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Category</label>
          <select className="select" value={filters.category} onChange={(e) => onChange({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Brand</label>
          <select className="select" value={filters.brand} onChange={(e) => onChange({ brand: e.target.value })}>
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Min Price (₹)</label>
          <input
            type="number"
            min={0}
            value={filters.minPrice ?? ''}
            onChange={(e) => onChange({ minPrice: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="No min"
            className="input"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-navy-400 uppercase tracking-wide block mb-1">Max Price (₹)</label>
          <input
            type="number"
            min={0}
            value={filters.maxPrice ?? ''}
            onChange={(e) => onChange({ maxPrice: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="No max"
            className="input"
          />
        </div>
      </div>
    </div>
  );
}
