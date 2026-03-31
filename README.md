# Multi-View Data Explorer

A high-performance data exploration tool that presents a single dataset through three **synchronized** views — Table, Graph, and Raw JSON — ensuring that filters and interactions apply uniformly without data duplication or drift.

![React](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple)

> **Live Demo →** _https://multi-view-data-explorer.vercel.app_ _(update after deployment)_

---

## Features

### Core

| Requirement | Implementation |
|---|---|
| **Table View** | Virtualized rows via `@tanstack/react-virtual`; columns derived dynamically from data keys |
| **Graph View** | Aggregation chart (Bar / Pie / Donut) via `recharts`; derived from the same filtered dataset |
| **Raw JSON View** | Virtualized, syntax-highlighted JSON output; exact same data the table & graph consume |
| **Filtering** | Global text search + per-field categorical filters; applied once in a central context, consumed by all views |
| **Synchronization** | All views read from a single `useMemo`-derived `filteredData`; no view owns or mutates data independently |

### Bonus

- **Switch aggregation dimension** — dynamically group the graph by any categorical field (e.g. `department`, `status`, `country`)
- **Table → Graph highlighting** — selecting rows in the table dims unrelated chart segments
- **Virtualized table rendering** — smooth scrolling through 50 k+ rows at 60 fps
- **Pluggable view architecture** — `ViewPanel` wrapper decouples presentation from view logic
- **Dark / Light mode** with one-click toggle
- **Upload your own JSON** to explore arbitrary datasets
- **Download filtered data** as a JSON file

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Source Data                        │  ← immutable, loaded once
├────────────────────┬─────────────────────────────────┤
│   Filter State     │  searchQuery + fieldFilters     │  ← useReducer (no global mutable state)
├────────────────────┴─────────────────────────────────┤
│           filteredData  (useMemo)                     │  ← single derived dataset
├──────────┬──────────────┬────────────────────────────┤
│  Table   │    Graph     │        JSON View            │  ← all consume the same ref
│  View    │  aggregation │                             │
│          │  (useMemo)   │                             │
└──────────┴──────────────┴────────────────────────────┘
```

### Key Design Decisions

| Concern | Approach |
|---|---|
| **State modeling** | `useReducer` for source + filter state; `useMemo` selectors for derived data |
| **No data duplication** | `filteredData` is computed once and passed to all three views via context |
| **No global mutable state** | All state lives inside React's component tree (context + reducer) |
| **No hardcoded data shape** | Columns, field types, and categorical detection are inferred at runtime |
| **Performance** | Debounced search (150 ms), virtualized table & JSON, memoized aggregation, early-exit filtering |

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + TypeScript |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Virtualization | @tanstack/react-virtual |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or pnpm / yarn)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/AdityaYInamdar/MultiViewDataExplorer.git
cd MultiViewDataExplorer

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

### Deploy to Vercel

```bash
# Option 1: Vercel CLI
npx vercel

# Option 2: Connect the GitHub repo in the Vercel dashboard
#            → Framework Preset: Vite
#            → Build Command: npm run build
#            → Output Directory: dist
```

---

## Usage

1. **Generate data** — Click the _Data_ button in the header and choose a record count (100 – 2 000 000), then hit _Generate_.
2. **Upload JSON** — Or upload your own `.json` file (array of objects with uniform shape).
3. **Filter** — Use the search bar for free-text search, or the categorical filter chips for field-level filtering.
4. **Switch views** — Use the view tabs (Dashboard / Table / Graph / JSON) to focus or see all views at once.
5. **Change aggregation** — In the Graph panel, click _"Group by: …"_ to pick a different categorical dimension.
6. **Select rows** — Click rows in the table; the corresponding graph segments will be highlighted.
7. **Export** — Copy or download the filtered JSON from the JSON panel toolbar.

---

## Project Structure

```
src/
├── types/index.ts                 # TypeScript interfaces & action types
├── utils/
│   ├── generateData.ts            # Deterministic sample data generator
│   └── dataHelpers.ts             # Field analysis, filtering, aggregation
├── context/
│   └── DataExplorerContext.tsx     # Central state (reducer) + derived data (memoized)
├── components/
│   ├── Header.tsx                 # App header, view switcher, data menu, theme toggle
│   ├── FilterBar.tsx              # Search bar + field-based filter chips
│   ├── TableView.tsx              # Virtualized table with dynamic columns
│   ├── GraphView.tsx              # Recharts bar/pie/donut with dimension switching
│   ├── JsonView.tsx               # Virtualized syntax-highlighted JSON
│   ├── ViewPanel.tsx              # Reusable panel wrapper
│   └── EmptyState.tsx             # Welcome screen
├── App.tsx                        # Layout orchestration
├── main.tsx                       # Entry point
└── index.css                      # Tailwind layers + custom utilities
```

---

## Performance Considerations

- **Filtering** — Single-pass array filter with early short-circuit on field filters; debounced search input prevents excessive re-computation.
- **Aggregation** — Single-pass `Map`-based counting, only recomputed when `filteredData` or the aggregation field changes.
- **Table rendering** — `@tanstack/react-virtual` renders only visible rows + overscan buffer (~20 rows), supporting 1 M+ records smoothly.
- **JSON rendering** — Lines are virtualized (overscan ~50); large datasets are display-capped at 10 000 records with full download available.
- **Memoization** — `useMemo` ensures derived state is never recomputed unless its dependencies change.

---

## License

MIT
