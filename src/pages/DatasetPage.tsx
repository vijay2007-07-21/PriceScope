import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { EMPTY_FILTERS, type Filters, type ProductRecord } from '@/data/types';
import { applyFilters, toCSV } from '@/data/aggregations';
import { formatINR, formatPercent, formatRating, formatDate } from '@/utils/format';
import { FilterBar } from '@/components/FilterBar';
import { EmptyState, ErrorState, Loading } from '@/components/States';
import { PageHeader } from '@/components/Sidebar';
import { ArrowUpDown, Download, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

type SortField = keyof ProductRecord;
const PAGE_SIZE = 10;

const COLUMNS: { key: SortField; label: string; sortable: boolean }[] = [
  { key: 'Product_ID', label: 'ID', sortable: true },
  { key: 'Product_Name', label: 'Product', sortable: true },
  { key: 'Brand', label: 'Brand', sortable: true },
  { key: 'Category', label: 'Category', sortable: true },
  { key: 'Website', label: 'Website', sortable: true },
  { key: 'Price_INR', label: 'Price', sortable: true },
  { key: 'MRP_INR', label: 'MRP', sortable: true },
  { key: 'Discount_Percent', label: 'Disc %', sortable: true },
  { key: 'Rating', label: 'Rating', sortable: true },
  { key: 'Availability', label: 'Availability', sortable: true },
  { key: 'Timestamp', label: 'Date', sortable: true },
  { key: 'Product_URL', label: 'URL', sortable: false },
];

export function DatasetPage() {
  const { records, loading, error, reload } = useData();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortField, setSortField] = useState<SortField>('Product_ID');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);
  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.website ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const setF = (f: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...f }));
    setPage(0);
  };

  const toggleSort = (field: SortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const csv = toCSV(sorted);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricescope_dataset_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Dataset Explorer" subtitle="Browse, search, sort, and export the underlying dataset records." />

      <FilterBar records={records} filters={filters} onChange={setF} onReset={() => setFilters(EMPTY_FILTERS)} showWebsite showSearch />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-navy-600">
          <span className="font-semibold text-navy-900">{sorted.length}</span> of {records.length} records
          {activeFilterCount > 0 && <span className="text-teal-600 ml-2">· {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>}
        </div>
        <button onClick={handleExport} disabled={!sorted.length} className="btn-primary">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState message="No records match your filters." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-navy-50 text-navy-600">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wide">
                        {col.sortable ? (
                          <button onClick={() => toggleSort(col.key)} className="flex items-center gap-1 hover:text-navy-900 transition-colors">
                            {col.label}
                            <ArrowUpDown size={11} className={sortField === col.key ? 'text-teal-600' : 'text-navy-300'} />
                          </button>
                        ) : (
                          col.label
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={i} className="border-t border-navy-50 hover:bg-navy-50/50 transition-colors">
                      <td className="px-3 py-2.5 text-navy-400 font-mono text-xs">{r.Product_ID}</td>
                      <td className="px-3 py-2.5 font-medium text-navy-800 max-w-[200px] truncate" title={r.Product_Name}>{r.Product_Name}</td>
                      <td className="px-3 py-2.5 text-navy-600">{r.Brand}</td>
                      <td className="px-3 py-2.5 text-navy-600">{r.Category}</td>
                      <td className="px-3 py-2.5">
                        <span className="badge-navy">{r.Website}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-navy-900">{formatINR(r.Price_INR)}</td>
                      <td className="px-3 py-2.5 text-right text-navy-500">{formatINR(r.MRP_INR)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-700 font-medium">{formatPercent(r.Discount_Percent)}</td>
                      <td className="px-3 py-2.5 text-right text-navy-700">{formatRating(r.Rating)}</td>
                      <td className="px-3 py-2.5">
                        <span className={r.Availability === 'In Stock' ? 'badge-teal' : 'badge-amber'}>{r.Availability}</span>
                      </td>
                      <td className="px-3 py-2.5 text-navy-400 text-xs">{formatDate(r.Timestamp)}</td>
                      <td className="px-3 py-2.5 text-right">
                        {r.Product_URL && (
                          <a href={r.Product_URL} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 inline-flex">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-navy-400">
              Page <span className="font-semibold text-navy-700">{currentPage + 1}</span> of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="btn-ghost py-2 px-3"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn-ghost py-2 px-3"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
