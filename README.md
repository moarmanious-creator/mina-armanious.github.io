# mina-armanious.github.io

Strategic Partnerships Register — an interactive, real-time dashboard for tracking partnerships, MoUs, contracts, pipeline stages, and strategic value drivers.

## Features

- **Register Table** — sortable/filterable table of all partnerships with inline editing of stage, priority, and health status
- **Pipeline Kanban** — drag-and-drop board across partnership stages
- **Strategic Value Matrix** — interactive grid of strategic value drivers per partner
- **Analytics & Insights** — charts for pipeline progression, category breakdown, driver coverage, and document status
- **Real-time sync** — edits broadcast instantly across every open tab/window in the same browser (via `BroadcastChannel`)
- **Shareable live links** — "Publish Live" encodes the current dataset into a compressed URL so anyone with the link sees the latest published snapshot, no backend required
- **Local persistence** — changes auto-save to `localStorage`
- **Export** — Excel, PowerPoint, PDF, and CSV export of the register

## Tech stack

React 19 + TypeScript + Vite + Tailwind CSS 4, charts via Recharts. Fully static — no backend required, deployed via GitHub Actions to GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Outputs a static site to `dist/`, deployed automatically by `.github/workflows/deploy.yml` on push to `main`.
