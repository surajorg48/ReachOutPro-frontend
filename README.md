# ReachOut Pro — Frontend (Email-UI)

Angular frontend for **ReachOut Pro**, a multi-tenant SaaS CRM / email outreach app.

## Requirements

| Tool | Version / notes |
|------|-----------------|
| **Node.js** | 18+ recommended (tested with Node 22) |
| **npm** | 9+ (comes with Node) |
| **Backend API** | [EMI-API](https://github.com/chcodex-alt/EMI-API) running (default `http://localhost:3008`) |

## Quick start

```bash
# 1. Clone
git clone https://github.com/chcodex-alt/Email-UI.git
cd Email-UI

# 2. Install dependencies
# If you hit peer dependency conflicts (e.g. ng2-charts / @angular/cdk):
npm install --legacy-peer-deps

# 3. Start the dev server
npm start
# same as: ng serve
```

Open **http://localhost:4200/** in your browser. The app reloads on file changes.

## API configuration

Dev API URL is set in:

```
src/environments/environment.ts
```

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3008'
};
```

Point `apiUrl` at your running backend if the port or host differs. Production uses `src/environments/environment.prod.ts`.

Make sure the backend is up and its CORS / `FRONTEND_URL` allow `http://localhost:4200`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Angular dev server (`ng serve`) on port **4200** |
| `npm run build` | Production build → `dist/` |
| `npm run watch` | Build in watch mode (development config) |
| `npm test` | Run unit tests |

## Project structure (high level)

```
src/
  app/
    core/          # Auth, API, shared services
    features/      # Feature screens (discover, scraper, campaigns, etc.)
  environments/    # Dev / prod API URLs
```

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| `Could not find '@angular/build:dev-server'` | Run `npm install --legacy-peer-deps` |
| `ERESOLVE` / peer dependency errors | Use `npm install --legacy-peer-deps` |
| API calls fail / CORS errors | Confirm EMI-API is running and `apiUrl` matches its `PORT` |
| Blank login / OTP fails | Backend SMTP + MySQL must be configured (see EMI-API README) |

## Related repos

- Backend: [EMI-API](https://github.com/chcodex-alt/EMI-API)
