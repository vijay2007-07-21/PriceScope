import { createContext, useContext } from 'react';

export type PageKey =
  | 'home'
  | 'dashboard'
  | 'comparison'
  | 'analysis'
  | 'dataset'
  | 'insights'
  | 'methodology'
  | 'about'
  | 'predict'
  | 'product';

interface NavContextValue {
  page: PageKey;
  navigate: (page: PageKey, productId?: string) => void;
  selectedProductId: string | null;
  onSearchSubmit: (q: string) => void;
  pendingSearch: string;
  clearPendingSearch: () => void;
}

export const NavContext = createContext<NavContextValue>({
  page: 'home',
  navigate: () => {},
  selectedProductId: null,
  onSearchSubmit: () => {},
  pendingSearch: '',
  clearPendingSearch: () => {},
});

export function useNav() {
  return useContext(NavContext);
}

export const PAGE_TITLES: Record<PageKey, string> = {
  home: 'Home',
  dashboard: 'Dashboard',
  comparison: 'Product Comparison',
  analysis: 'Price Analysis',
  dataset: 'Dataset Explorer',
  insights: 'Smart Shopping',
  methodology: 'Methodology',
  about: 'About Project',
  predict: 'Predict New Product',
  product: 'Product Details',
};
