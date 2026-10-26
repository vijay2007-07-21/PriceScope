import { useState, useCallback } from 'react';
import { DataProvider } from '@/context/DataContext';
import { NavContext, type PageKey } from '@/context/NavContext';
import { Sidebar } from '@/components/Sidebar';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ComparisonPage } from '@/pages/ComparisonPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { DatasetPage } from '@/pages/DatasetPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import { AboutPage } from '@/pages/AboutPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { NewProductPredictionPage } from '@/pages/NewProductPredictionPage';

function AppShell() {
  const [page, setPage] = useState<PageKey>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [pendingSearch, setPendingSearch] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');

  const navigate = useCallback((next: PageKey, productId?: string) => {
    if (productId) setSelectedProductId(productId);
    setPage(next);
    if (next !== 'comparison') setSidebarSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const onSearchSubmit = useCallback((q: string) => {
    setPendingSearch(q);
    setSidebarSearch(q);
  }, []);

  const clearPendingSearch = useCallback(() => setPendingSearch(''), []);

  // Sidebar search navigates to comparison
  const handleSidebarSearch = useCallback(
    (v: string) => {
      setSidebarSearch(v);
      setPendingSearch(v);
      if (v && page !== 'comparison') setPage('comparison');
    },
    [page]
  );

  let content: React.ReactNode;
  switch (page) {
    case 'home':
      content = <HomePage />;
      break;
    case 'dashboard':
      content = <DashboardPage />;
      break;
    case 'comparison':
      content = <ComparisonPage />;
      break;
    case 'analysis':
      content = <AnalysisPage />;
      break;
    case 'dataset':
      content = <DatasetPage />;
      break;
    case 'insights':
      content = <InsightsPage />;
      break;
    case 'methodology':
      content = <MethodologyPage />;
      break;
    case 'about':
      content = <AboutPage />;
      break;
    case 'predict':
      content = <NewProductPredictionPage />;
      break;
    case 'product':
      content = <ProductDetailPage />;
      break;
    default:
      content = <HomePage />;
  }

  return (
    <NavContext.Provider
      value={{ page, navigate, selectedProductId, onSearchSubmit, pendingSearch, clearPendingSearch }}
    >
      <div className="flex min-h-screen">
        <Sidebar search={sidebarSearch} onSearch={handleSidebarSearch} />
        <main className="flex-1 min-w-0 pt-16 lg:pt-0">
          <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div key={`${page}-${selectedProductId ?? ''}`} className="page-transition">
              {content}
            </div>
          </div>
        </main>
      </div>
    </NavContext.Provider>
  );
}

function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}

export default App;
