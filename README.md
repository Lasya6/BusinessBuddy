# BusinessBuddy

BusinessBuddy is a small-business operations dashboard for sales, invoices, inventory, customers, suppliers, expenses, reports, and saved-data business insights.

## Features

- Dashboard with sales, expenses, profit, receivables, stock alerts, and recent activity.
- Products & Stock with product/service CRUD, stock adjustments, and low-stock thresholds.
- Customers with customer types, search/filter, balances, and sales history.
- Sales & Invoices with line items, discounts, tax, stock validation, payment status, and printable invoices.
- Suppliers and purchase orders with stock receiving.
- Expenses & Profit with expense CRUD, category/date filters, and profit-and-loss summaries.
- Reports & Analytics with daily, weekly, monthly, and custom ranges; sales, expense, profit, product, and customer reports; CSV export.
- AI Insights derived from saved business records. Rule-based insights continue to work without an AI API key.
- Browser localStorage persistence for business data. Data is local to the current browser and is not shared across devices or users.

## Requirements

- Node.js 20.19+ or 22.12+.
- npm.

## Local Development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Optional: copy `.env.example` to `.env` and set `GEMINI_API_KEY` for server-side Gemini responses. Leave it unset to use the saved-data rule-based assistant.

3. Start the app:

   ```sh
   npm run dev
   ```

   The Express/Vite development server uses port 3000 by default. Set `PORT` to use another port.

4. Check the production build and TypeScript:

   ```sh
   npm run build
   npm run lint
   ```

`npm run preview` serves the static Vite build only; use `npm run dev` to test the local assistant API as well.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Server-side Gemini API access for the assistant. If unset or unavailable, rule-based saved-data insights are used. |
| `PORT` | No | Local Express server port; defaults to `3000`. |

Do not use a `VITE_` prefix for secrets. Vite exposes `VITE_` variables in the browser bundle. The repository ignores `.env*` files except `.env.example`.

## Deploy to Vercel

1. Push this repository to a Git provider and import it into Vercel.
2. Select the repository root as the project root and use the Vite framework preset.
3. Set the build command to `npm run build` and the output directory to `dist` (also declared in `vercel.json`).
4. If Gemini responses are desired, add `GEMINI_API_KEY` in Vercel Project Settings → Environment Variables for the required environments. Do not add it as a `VITE_` variable or commit it to the repository. The site remains usable without it.
5. Deploy. Vercel builds the frontend from `dist` and deploys the server-side handlers in `api/` for `/api/health` and `/api/ai/assistant`.
6. Verify the deployment by opening the site and checking `/api/health`; it returns whether a server-side Gemini key is configured, never the key itself.

Business records are stored in browser localStorage. Vercel deployment does not make those records a shared database; use the same browser to access that browser's saved records.

## Technologies

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- Express for local development/production server mode
- `@google/genai` for optional server-side Gemini requests
- Lucide React icons
- Browser localStorage for client-side persistence

## Checks

```sh
npm run lint
npm run build
```