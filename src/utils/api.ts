const configuredApiBaseUrl = import.meta.env.VITE_PRICE_API_URL?.trim();

export const PRICE_API_BASE_URL = (
  configuredApiBaseUrl || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');
