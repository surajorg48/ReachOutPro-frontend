export const environment = {
  production: true,
  apiUrl: (window as any).__env?.VITE_API_URL || ''
};
