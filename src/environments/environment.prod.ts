export const environment = {
  production: true,
  apiUrl: (window as any).__env?.VITE_API_URL || (window as any).__env?.API_URL || '',
  googleClientId:
    (window as any).__env?.GOOGLE_CLIENT_ID ||
    '704682721325-cs5vcp8j1isjr9o936j37jihl27jlv0v.apps.googleusercontent.com',
};
