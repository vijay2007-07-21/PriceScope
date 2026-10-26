import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { loadDataset } from '@/data/loader';
import type { ProductRecord } from '@/data/types';
import { computeStats, type DatasetStats } from '@/data/aggregations';

interface DataContextValue {
  records: ProductRecord[];
  stats: DatasetStats | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const DataContext = createContext<DataContextValue>({
  records: [],
  stats: null,
  loading: true,
  error: null,
  reload: () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<ProductRecord[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadDataset();
      setRecords(data);
      setStats(computeStats(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <DataContext.Provider value={{ records, stats, loading, error, reload: fetch }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
