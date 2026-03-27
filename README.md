# Ordnungsamt Berlin Map

An interactive heatmap that visualizes citizen reports filed with Berlin's Ordnungsamt (regulatory office). Explore where and what Berliners are reporting — from illegal dumping and parking violations to noise complaints and construction issues.

**Live data** is fetched directly from the [Berlin Ordnungsamt Open Data API](https://ordnungsamt.berlin.de) and refreshed every 15 minutes.

---

## Features

- **Three visualization modes** that adapt to zoom level:
  - **Bubble clusters** (city/district view) — pre-aggregated counts per location
  - **Heatmap** (neighborhood view) — density visualization with adjustable radius and blur
  - **Individual pins** (street view) — raw reports with popup details
- **Filter by district** (all 12 Berlin boroughs) and **category** (30 issue types)
- **Statistics sidebar** with overview counts, daily trend chart, and category/district breakdowns
- **Dark CartoDB map** theme optimized for data visibility
- **Redis caching** and PostGIS spatial queries for fast map tile responses
- UI preferences (map position, filters, layer visibility) persist in `localStorage`

---

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  Collector  │───▶│  PostgreSQL  │◀───│   Backend    │
│  (cron job) │    │  + PostGIS   │    │  (Express)   │
└─────────────┘    └──────────────┘    └──────┬───────┘
                                              │
                   ┌──────────────┐           │
                   │    Redis     │◀──────────┤
                   └──────────────┘           │
                                              ▼
                                       ┌──────────────┐
                                       │   Frontend   │
                                       │ (React+Leaflet│
                                       └──────────────┘
```

| Service | Stack |
|---------|-------|
| **Frontend** | React 19, Vite, Leaflet, Tailwind CSS 4, Radix UI |
| **Backend** | Express 5, Node.js, PostGIS, Redis |
| **Collector** | Node.js, node-cron, PostgreSQL |
| **Database** | PostgreSQL 18 + PostGIS 3.6 |
| **Cache** | Redis 7 |

All services run in Docker and are orchestrated with Docker Compose. The codebase is a **Yarn workspaces monorepo** with a shared TypeScript package (`packages/shared`) used by all three apps.

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 20+ and [Yarn](https://yarnpkg.com/) (for local development)
- [Make](https://www.gnu.org/software/make/)

### Quick Start (Production)

```bash
# 1. Clone the repo
git clone https://github.com/your-username/ordnungsamt-map.git
cd ordnungsamt-map

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD, CORS_ORIGIN, and VITE_API_URL

# 3. Start the stack
make up
```

The frontend will be available at `http://localhost:3000` and the backend API at `http://localhost:4000`.

> **First run**: The collector fetches ~100k reports from the Ordnungsamt API on startup. The initial bulk fetch can take 5–10 minutes. The map will show data once the first run completes.

### Development (Hot Reload)

```bash
# Install dependencies
make install

# Start dev stack with hot reload
make dev
```

Both the backend (tsc + node --watch) and frontend (Vite HMR) support hot reload out of the box.

---

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | `change_me_in_production` | **Change this** in production |
| `DATABASE_URL` | `postgresql://...@postgres:5432/ordnungsamt` | Full connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `CORS_ORIGIN` | `https://your-frontend-domain.com` | Allowed CORS origin for the backend |
| `VITE_API_URL` | `https://your-api-domain.com` | Backend API URL (baked into frontend build) |
| `BACKEND_PORT` | `4000` | Port exposed by the backend container |
| `FRONTEND_PORT` | `3000` | Port exposed by the frontend container |
| `COLLECTOR_INTERVAL_MINUTES` | `15` | How often to collect new reports |
| `OA_BULK_FETCH_TIMEOUT_MS` | `600000` | Timeout for the initial bulk fetch (10 min) |
| `OA_DETAIL_FETCH_TIMEOUT_MS` | `15000` | Timeout per detail request (15 sec) |
| `POSTGIS_PLATFORM` | `linux/amd64` | Docker platform for the PostGIS image (use `linux/arm64` on Apple Silicon) |

---

## Makefile Reference

### Production

| Command | Description |
|---------|-------------|
| `make up` | Build and start all services (foreground) |
| `make up-detach` | Build and start all services (background) |
| `make stop` | Stop all services (data preserved) |
| `make reset` | Stop and remove all volumes (data deleted) |
| `make logs [SERVICE=name]` | Tail logs, optionally filtered by service |
| `make ps` | Show container status |

### Development

| Command | Description |
|---------|-------------|
| `make dev` | Start dev stack with hot reload (foreground) |
| `make dev-detach` | Start dev stack (background) |
| `make dev-stop` | Stop dev stack |
| `make dev-reset` | Stop and remove dev volumes |
| `make db-shell` | Open a `psql` shell in the database container |
| `make redis-shell` | Open a `redis-cli` shell |
| `make backend-shell` | Open a shell in the backend container |
| `make frontend-shell` | Open a shell in the frontend container |

### Code Quality

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make build` | Build all workspaces |
| `make lint` | Lint all packages |
| `make lint:fix` | Auto-fix linting issues |
| `make format` | Format with Prettier |
| `make typecheck` | TypeScript type-check backend and frontend |

---

## API Reference

### Map Data

```
GET /api/meldungen
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `zoom` | number | Map zoom level (9–18); determines clustering strategy |
| `minLat`, `maxLat` | number | Latitude bounds of the viewport |
| `minLng`, `maxLng` | number | Longitude bounds of the viewport |
| `district` | string | Filter by Berlin district (optional) |
| `category` | string | Filter by issue category (optional) |

Response varies by zoom:
- **Zoom 9–11**: Bubble clusters (pre-aggregated `{lat, lng, count}`)
- **Zoom 12–14**: Heatmap grid points
- **Zoom 15–18**: Raw report pins with popup data (max 1000)

```
GET /api/meldungen/:id
```

Returns full details for a single report.

### Statistics

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats/overview` | Total counts and last-updated timestamp |
| `GET /api/stats/timeseries` | Daily counts for the last 30 days |
| `GET /api/stats/districts` | Report counts grouped by district |
| `GET /api/stats/categories` | Report counts grouped by category |

All responses include an `X-Cache: HIT|MISS` header.

---

## Data Source

This project uses the **Berlin Ordnungsamt Open Data API** — a publicly available dataset of citizen reports submitted to Berlin's regulatory office. Reports include issue category, district, street address, and submission date.

Only reports that include geographic coordinates (latitude/longitude from the detail endpoint) are stored and displayed. As of early 2026, the dataset contains ~105,000 reports spanning multiple years.

**Top reported categories** (based on analysis of the full dataset):
1. Müll / Abfall — ~76% of all reports
2. Straßenaufsicht (street supervision) — ~12%
3. Parkraumbewirtschaftung (parking violations) — ~4%

---

## Project Structure

```
ordnungsamt-map/
├── apps/
│   ├── backend/          # Express REST API
│   ├── collector/        # Cron-based data fetcher
│   └── frontend/         # React + Leaflet SPA
├── packages/
│   └── shared/           # Shared TypeScript types, constants, validators
├── docker-compose.yml    # Production stack
├── docker-compose.dev.yml # Development overrides
├── Makefile
└── .env.example
```

---

## License

MIT
