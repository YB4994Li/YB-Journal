# Trading Journal

Trading Journal is a standalone full-stack application designed to help traders manage multiple trading accounts, import trading history, organize trades, and review performance through structured statistics and visualizations.

The application supports real accounts and multi-phase funded accounts. Each journal is scoped to one account and, for funded accounts, one phase.

## Key features

### Accounts Center

- Create and manage multiple real or funded trading accounts.
- Record broker, prop firm, platform, currency, account size, external reference, and notes.
- Track account lifecycle states: active, paused, passed, failed, closed, and archived.
- Archive and restore accounts without deleting their phases or trades.
- View account-level summaries including realized balance, net P&L, return, trade count, and win rate.
- Open the journal for a specific account directly from its account card.
- Avoid combining balances across different currencies; mixed-currency summaries are identified as such.

### Funded account phases

- Configure evaluation, verification, funded/live, and custom phases.
- Generate common funded-account phase structures during account creation.
- Edit phase limits, names, balances, targets, and minimum trading days.
- Activate a phase or mark it passed, failed, or archived.
- Keep trades, statistics, and balance history isolated by funded phase.
- Maintain a single active phase per funded account.

### Trade journal

- Add, inspect, edit, duplicate, and delete trades.
- Select visible or filtered trades and delete them in bulk.
- Upload, preview, replace, and remove trade screenshots.
- Search by trade number, strategy, market, or notes.
- Filter by dynamically detected markets, strategies, timeframes, sessions, direction, result, and date range.
- Sort supported journal columns and control page size.
- Display account- or phase-scoped performance cards.
- Display chronological realized-balance progression.
- Display market distribution as a donut or horizontal bar chart.
- Click a market chart segment to apply or clear the journal market filter.

### CSV import

- Download an application CSV template.
- Upload a CSV and preview its rows before confirmation.
- Detect application-template, Exness, MetaTrader, and FundedNext-style exports.
- Normalize common header aliases and broker symbol suffixes.
- Skip empty and non-trade rows.
- Report invalid rows without treating unavailable optional analytics as fatal errors.
- Detect duplicate broker trades using account, import source, and source trade ID.
- Import all confirmed valid rows into the selected account and funded phase.
- Detect fixed UTC trading sessions from valid opening timestamps.

### Trade calculations

When sufficient reliable inputs are available, the backend calculates:

- Planned risk-to-reward ratio from entry, stop loss, and take profit.
- Realized R multiple from entry, stop loss, exit price, and direction.
- Risk amount from a supplied amount or supported instrument metadata.
- Risk percentage from risk amount and realized balance before the trade.
- Chronological balance before each imported historical trade.
- Calculation status and warnings when analytics are partial or unavailable.

Manual overrides for planned RR and risk percentage are stored separately from calculated values.

### Analytics

- Current realized balance.
- Net profit or loss.
- Total, winning, losing, and break-even trades.
- Win rate.
- Average planned RR.
- Average legacy result-in-R value.
- Best and worst trade by P&L.
- Realized balance history.
- Market trade-count distribution, market net P&L, and market win rate.

The market distribution chart uses trade count as its default percentage basis. It intentionally ignores the active market filter so all markets remain visible for comparison.

### Trading Library

The Trading Library is part of Accounts Center and is available at `/accounts/library`.

- Create, rename, archive, and restore strategies.
- View strategy usage counts.
- Use normalized strategy keys to prevent duplicates caused only by case or whitespace.
- Select strategies from a searchable, keyboard-accessible combobox in Add Trade and Edit Trade.
- Create a strategy inline without leaving the trade form.
- Preserve an archived strategy on an existing trade while excluding it from new selections.
- Use a shared set of canonical timeframe values in trade forms and journal filters.
- Preserve normalized custom timeframe text without requiring a separate database model.

Strategy merging is supported by the backend API, but it is not currently exposed in the Trading Library interface.

## Preview

The repository does not currently include maintained application screenshots. A future documentation update can add screenshots for:

- Accounts Center
- Account and funded-phase journal
- CSV import preview
- Markets Traded chart
- Trading Library

## Technology stack

### Frontend

- React 18.3
- React DOM 18.3
- Vite 6
- JavaScript with ES modules
- React Router DOM 5.3
- Tailwind CSS 3.4
- Recharts 3.1
- Axios 1.7
- Lucide React

### Backend

- Node.js with ES modules
- Express 4.21
- Prisma ORM 6
- PostgreSQL
- express-validator
- Multer
- PapaParse
- Helmet
- CORS
- dotenv

### Development and testing

- npm
- concurrently
- nodemon
- Node.js built-in test runner (`node --test`)

The repository does not currently use ESLint or a browser component-testing framework.

## Application architecture

```mermaid
flowchart LR
    User --> Client[React and Vite Client]
    Client --> API[Express REST API]
    API --> Services[Validation, Import, Calculations, Analytics]
    Services --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]
    API --> Uploads[Local Screenshot Storage]
```

The React client renders Accounts Center, Trading Library, journal forms, filters, tables, and charts. It communicates with the backend through Axios.

The Express API validates requests, manages accounts, phases, strategies, and trades, processes CSV imports, calculates derived analytics, and accesses PostgreSQL through Prisma.

Screenshots are stored on the server filesystem under `uploads/screenshots`. CSV files are parsed from memory and are not retained after processing.

## Main frontend routes

| Route | Purpose |
| --- | --- |
| `/` | Journal for the account and optional phase selected through query parameters |
| `/accounts` | Accounts Center overview |
| `/accounts/library` | Trading Library, defaulting to Strategies |
| `/accounts/library/strategies` | Strategy management |
| `/accounts/library/timeframes` | Canonical timeframe reference |
| `/trading-library` | Redirects to `/accounts/library` |

An account card opens the journal with `accountId` and, when applicable, `phaseId` query parameters.

## Project structure

```text
trading-journal/
├── client/
│   ├── public/                  # Static client assets
│   ├── src/
│   │   ├── api/                 # Axios client and API helpers
│   │   ├── components/
│   │   │   ├── account/         # Account and phase setup UI
│   │   │   ├── chart/           # Balance and market charts
│   │   │   ├── csv/             # CSV import modal
│   │   │   ├── phase/           # Phase status and management UI
│   │   │   ├── trade/           # Trade forms, filters, table, details
│   │   │   └── ui/              # Shared modal, toast, confirmation UI
│   │   ├── hooks/
│   │   ├── pages/               # Journal, Accounts Center, Library
│   │   └── utils/               # Formatting and normalization helpers
│   └── test/                    # Client-side utility tests
├── server/
│   ├── prisma/
│   │   ├── migrations/          # Versioned PostgreSQL migrations
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── scripts/                 # Database verification/report scripts
│   ├── src/
│   │   ├── config/              # Environment, Prisma, CSV, session config
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/            # Import, analytics, calculations, library
│   │   ├── utils/
│   │   └── validators/
│   └── test/                    # Backend unit and service tests
├── uploads/
│   └── screenshots/
├── package.json                 # Workspace convenience scripts
└── README.md
```

## Getting started

### Prerequisites

- Node.js with npm
- PostgreSQL
- A local PostgreSQL user allowed to create or access the application database

### 1. Install dependencies

From the repository root:

```bash
npm run install:all
```

This installs root, server, and client dependencies.

### 2. Create the database

For example, using `psql`:

```sql
CREATE DATABASE trading_journal;
```

### 3. Configure environment variables

Create `server/.env` from `server/.env.example`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/trading_journal?schema=public"
PORT=5000
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Environment variables:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | None | PostgreSQL connection string used by Prisma |
| `PORT` | No | `5000` | Express API port |
| `CLIENT_URL` | No | `http://localhost:5173` | Allowed client origin for CORS |
| `MAX_FILE_SIZE` | No | `5242880` | Maximum CSV or screenshot upload size in bytes |
| `NODE_ENV` | No | Development behavior | Enables production static-file cache behavior when set to `production` |
| `VITE_API_URL` | No | `http://localhost:5000/api` | API base URL used by the React client |

`DATABASE_URL` is validated when the backend starts. Keep real credentials out of committed environment example files.

### 4. Apply migrations and generate Prisma Client

From `server/`:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma validate
```

For local schema development, the repository also exposes `npm run prisma:migrate`. Its current script creates a development migration named `init`, so use it only when intentionally modifying the Prisma schema.

### 5. Optional seed data

```bash
npm run prisma:seed
```

The seed creates one USD real account with three example trades.

### 6. Run the application

From the repository root:

```bash
npm run dev
```

Development URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Available scripts

### Root scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Express API and Vite client concurrently |
| `npm run install:all` | Install root, server, and client dependencies |
| `npm run build` | Build the production client |

### Server scripts

Run from `server/` or use `npm run <script> --prefix server` from the root.

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API with nodemon |
| `npm start` | Run the API with Node.js |
| `npm test` | Run backend tests with Node's test runner |
| `npm run check` | Syntax-check the server entry point |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply a development migration named `init` |
| `npm run prisma:deploy` | Apply existing migrations |
| `npm run prisma:seed` | Seed example data |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run db:check` | Verify the PostgreSQL connection |

Additional scripts:

```bash
node scripts/verifyFundedAccounts.js
node scripts/reportTradingLibraryMigration.js
```

### Client scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Vite development server |
| `npm run build` | Build production assets |
| `npm run preview` | Preview a completed production build |

Client utility tests can be run directly:

```bash
node --test test/*.test.js
```

## CSV import

CSV import is a preview-and-confirm workflow:

1. Select the destination account and funded phase.
2. Upload a CSV file.
3. Review detected format, valid rows, derived analytics, and warnings.
4. Confirm all valid rows.

Supported input families:

- The downloadable Trading Journal template
- Exness exports
- Standard MetaTrader-style reports
- FundedNext-style header aliases

The importer recognizes common variants for ticket, timestamps, side, volume, symbol, P&L, prices, SL, TP, comments, strategy, session, and timeframe.

Required broker-import concepts are opening time, trade type, and symbol. `BUY` and `SELL` trade rows are accepted; balance operations and unrelated rows are skipped. The importer is designed for trading-history exports, but it does not independently require a closing timestamp on every row.

Broker symbols are normalized consistently. Examples include:

- `XAUUSDm` → `XAUUSD`
- `xauusdm` → `XAUUSD`
- `EURUSD.m` → `EURUSD`

Duplicate imported trades are skipped when the same account already contains the same `importSource` and `sourceTradeId`.

## Trading account types

### Real accounts

Real-account trades use the account's initial capital and have no phase.

### Funded accounts

Funded accounts require a destination phase for trade creation, import, statistics, and market analytics. Supported phase types are:

- Evaluation
- Verification
- Funded/Live
- Custom

The backend validates that a requested phase belongs to the selected account.

## Strategy and timeframe normalization

Strategy keys are created by trimming whitespace, collapsing repeated internal spaces, and comparing lowercase values. This prevents case-only or whitespace-only duplicates while leaving spelling differences untouched.

Examples treated as one key:

- `Pullback`
- `pullback`
- ` PULLBACK `

`Pullback` and `Pulback` remain distinct.

Known timeframe aliases are normalized to canonical labels:

- `m5`, `5m`, `5 min`, `5 minutes` → `M5`
- `60m`, `1h`, `h1` → `H1`
- `daily`, `1d` → `D1`
- `weekly`, `1w` → `W1`

Unknown custom timeframe values are preserved after whitespace and case normalization.

## API overview

All API routes use the `/api` prefix.

### System

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |

### Accounts, analytics, imports, and account trades

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/accounts` | List accounts; archived accounts are excluded unless `includeArchived=true` |
| `POST` | `/accounts` | Create a real or funded account |
| `GET` | `/accounts/:id` | Retrieve one account |
| `PUT` | `/accounts/:id` | Update one account |
| `PATCH` | `/accounts/:accountId` | Partially update one account |
| `DELETE` | `/accounts/:id` | Permanently delete an account and cascaded data |
| `POST` | `/accounts/:id/archive` | Archive an account |
| `POST` | `/accounts/:id/restore` | Restore an archived account |
| `GET` | `/accounts/:id/statistics` | Account or phase statistics |
| `GET` | `/accounts/:id/balance-history` | Realized balance history |
| `GET` | `/accounts/:id/markets` | Distinct account/phase markets |
| `GET` | `/accounts/:id/analytics/markets` | Market distribution analytics |
| `GET` | `/accounts/:id/journal/filter-options` | Dynamic market, strategy, and timeframe options |
| `GET` | `/accounts/:accountId/trades` | Paginated account/phase trades |
| `GET` | `/accounts/:accountId/trades/ids` | IDs matching current journal filters |
| `POST` | `/accounts/:accountId/trades` | Create a trade |
| `POST` | `/accounts/:accountId/trades/import/preview` | Parse and preview an uploaded CSV |
| `POST` | `/accounts/:accountId/trades/import/confirm` | Import confirmed valid rows |
| `GET` | `/accounts/:accountId/phases` | List funded phases |
| `POST` | `/accounts/:accountId/phases` | Add a funded phase |

### Trades

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/trades/csv-template` | Download the application CSV template |
| `DELETE` | `/trades/bulk` | Delete selected trades |
| `GET` | `/trades/:id` | Retrieve one trade |
| `PUT` | `/trades/:id` | Update one trade |
| `DELETE` | `/trades/:id` | Delete one trade |
| `POST` | `/trades/:id/duplicate` | Duplicate one trade without its screenshot |
| `POST` | `/trades/:id/screenshot` | Upload or replace a screenshot |
| `DELETE` | `/trades/:id/screenshot` | Remove a screenshot |

### Funded phases

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/phases/:phaseId` | Retrieve a phase |
| `PATCH` | `/phases/:phaseId` | Update a phase |
| `DELETE` | `/phases/:phaseId` | Delete a phase and its trades |
| `POST` | `/phases/:phaseId/pass` | Mark a phase passed |
| `POST` | `/phases/:phaseId/fail` | Mark a phase failed |
| `POST` | `/phases/:phaseId/activate` | Activate a phase |

### Strategies

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/strategies` | List active or archived strategies |
| `GET` | `/strategies/:id` | Retrieve one strategy |
| `POST` | `/strategies` | Create or reuse a normalized strategy |
| `PATCH` | `/strategies/:id` | Rename or update a strategy |
| `DELETE` | `/strategies/:id` | Delete an unused strategy |
| `POST` | `/strategies/:id/archive` | Archive a strategy |
| `POST` | `/strategies/:id/restore` | Restore a strategy |
| `POST` | `/strategies/merge` | Merge a source strategy into a target strategy |

API success responses generally use:

```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully"
}
```

## Database models

### Account

Stores the account identity, account type, currency, broker or prop-firm metadata, initial capital, funded account size, external reference, status, display order, notes, phases, and trades.

### AccountPhase

Stores funded-account phase type, status, order, balances, profit target, loss limits, minimum trading days, lifecycle dates, notes, and phase trades.

### Strategy

Stores the canonical name, unique normalized key, optional description and color, archive state, and related trades.

### Trade

Stores account and optional phase ownership, optional strategy reference, market and execution details, timestamps, timeframe, result, P&L, screenshot, notes, import metadata, calculation values, overrides, warnings, and reconstructed balance information.

Important database constraints include:

- Unique trade number within an account.
- Unique imported source trade within an account and import source.
- Unique strategy normalized key.
- Unique phase order within an account.
- Cascading account deletion for phases and trades.
- Nullable strategy relation with `SET NULL` when a strategy is removed.

## Data and calculation notes

- Balance history is realized-balance history, not floating equity.
- Imported balances are reconstructed by close time, falling back to trade date.
- Fixed session detection uses UTC windows and does not currently apply market-local daylight-saving rules.
- Risk values remain `null` when inputs or instrument metadata are not reliable.
- Current built-in instrument-risk metadata covers `XAUUSD` and `BTCUSD`; other instruments require direct risk input or additional metadata.
- Account currencies are not automatically converted.

## Current limitations

- The application is currently a standalone, single-user system with no authentication or authorization layer.
- Screenshot storage uses the local server filesystem rather than object storage.
- Timeframes use normalized text; there is no persistent Timeframe database model or full custom-timeframe management API.
- The Trading Library UI supports strategy creation, rename, archive, and restore. The merge endpoint exists, but the UI does not expose it.
- Maximum drawdown, profit factor, expectancy, average trade duration, and floating-equity analytics are not implemented.
- The application does not fetch currency conversion rates.
- Session windows are fixed UTC ranges.
- The seed script uses legacy strategy text and is intended only as development sample data.
- There is no automated end-to-end browser test suite.

## Roadmap

The following are potential future improvements, not implemented features:

- Authentication and per-user ownership.
- Persistent custom timeframe management.
- Object storage for screenshots.
- Broader instrument metadata and currency conversion support.
- Drawdown, profit factor, expectancy, and duration analytics.
- DST-aware session detection.
- Account comparison tools.
- End-to-end and component-level browser tests.
- Maintained screenshots and deployment documentation.

## Contributing

1. Create a focused branch.
2. Keep account and funded-phase scoping intact.
3. Add or update tests for service and normalization changes.
4. Run backend tests:

   ```bash
   npm test --prefix server
   ```

5. Run client utility tests and build:

   ```bash
   node --test client/test/*.test.js
   npm run build
   ```

6. Validate Prisma when the schema changes:

   ```bash
   npx prisma format --schema server/prisma/schema.prisma
   npx prisma validate --schema server/prisma/schema.prisma
   ```

Do not create a migration unless the Prisma schema changes. Preserve existing account, phase, trade, and import data in every migration.

## License

This repository does not currently include a license file. Add an explicit license before redistributing or accepting external contributions.
