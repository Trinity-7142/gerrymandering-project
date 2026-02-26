# Gerrymandering & Representational Quality Project

Measuring how well congressional representatives' voting records align with their constituents' policy preferences, using gerrymandering as the explanatory framework for misalignment.

Covers all 50 states at the state level, with district-level analysis for California and Texas.

## Tech Stack

- **Data pipeline:** R (tidyverse, haven, survey) → JSON files
- **Frontend:** Next.js, React, Tailwind CSS, Recharts
- **Hosting:** Vercel (static deployment)

## Getting Started

### Prerequisites
- Download the datasets from Google Drive (I'll send the link in Slack)
- [Node.js](https://nodejs.org/) (v18 or later)
- [R](https://cran.r-project.org/) (for data pipeline scripts)
- npm (comes with Node.js)

### Setup

1. Clone the repo:
```bash
   git clone <repo-url>
   cd gerrymandering-project
```

2. Install dependencies:
```bash
   npm install
```

3. Start the dev server:
```bash
   npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
gerrymandering-project/
├── app/              # Next.js pages and layouts
├── components/       # React components (panels, modals, etc.)
├── lib/              # Utility functions and data loaders
├── public/data/      # Pre-computed JSON files (R pipeline output)
├── scripts/          # R scripts for data processing
├── data-raw/         # Raw survey data (not committed — see below)
├── docs/             # Project documentation and contracts
└── config.R          # Shared R configuration
```

## Architecture

This is a **static-first** application. R scripts process survey data into JSON files, which Next.js reads at build time to generate pre-rendered HTML pages. There is no backend server or database. See `docs/` and the Data Contract for full details.

## Data Sources

- **CES 2024** — Constituent policy positions (district-level)
- **AP VoteCast 2024** — Issue salience / importance (state-level)
- **Princeton Gerrymandering Project** — Gerrymandering grades
- **Congressional roll-call votes** — Representative voting records

### Raw Data

Raw survey files (`.dta`) are large and licensed, so they are **not committed** to the repo. They live in `data-raw/` (gitignored).

## Key Documentation

- **Data Contract v1.5** (View in Notion) — Schemas, task assignments, and architecture details
- **Timeline v4** (View in Notion) — Project phases, milestones, and dependencies