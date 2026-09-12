# Weather Backend

A production-ready Express backend for a weather Android app, built on
[Open-Meteo](https://open-meteo.com/) (free, no API key required).

## Features

- `GET /api/weather?city=<name>` — resolves a city name to coordinates, then fetches its forecast
- `GET /api/weather?lat=<lat>&lon=<lon>` — fetches a forecast directly for a coordinate pair
- `GET /health` — liveness/readiness check, reports whether Redis or the in-memory fallback is active
- Clean layering: `routes` → `services` → Open-Meteo (geocoding + forecast services are separate and composed by a `weatherService`)
- Redis caching (10 minutes by default) with an automatic **in-memory fallback** if Redis is unreachable — the app still works on platforms without a Redis add-on (e.g. Replit)
- Rate limiting (`express-rate-limit`) on the `/api` surface
- Security headers via `helmet`, `cors` enabled
- Request validation via `zod` (rejects missing/invalid `city`, `lat`, `lon`, partial coordinate pairs, or both `city` and coordinates at once)
- Centralized error handling: distinguishes "city not found" (404) from "upstream API down" (502) from "bad input" (400)
- Docker + docker-compose (backend + Redis)

## Project structure

```
src/
  config/env.js            # loads and validates env vars
  services/
    geocodingService.js    # calls Open-Meteo geocoding API
    forecastService.js     # calls Open-Meteo forecast API
    weatherService.js      # orchestrates geocoding + forecast + caching
  routes/weatherRoutes.js  # HTTP layer — thin, calls services only
  middleware/
    validate.js            # zod query validation middleware
    errorHandler.js        # 404 + centralized error responses
  validators/weatherValidator.js
  utils/
    ApiError.js            # operational error type
    asyncHandler.js        # wraps async route handlers
    cache.js               # Redis client with in-memory fallback
  app.js                   # Express app wiring (middleware, routes)
  server.js                # entry point (starts the HTTP server)
```

## Requirements

- Node.js 18+
- (Optional but recommended) Redis, for caching across restarts/instances

## Local setup

```bash
npm install
cp .env.example .env
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

The server starts on `http://localhost:3000` by default.

If `REDIS_URL` isn't reachable, you'll see a one-time warning in the logs
and the app automatically falls back to an in-memory cache — it keeps
working, it just won't share cache across restarts or multiple instances.

### Environment variables (`.env`)

| Variable            | Default                   | Description                              |
|----------------------|---------------------------|-------------------------------------------|
| `PORT`               | `3000`                    | Port the server listens on               |
| `REDIS_URL`          | `redis://localhost:6379`  | Redis connection string (optional)       |
| `CACHE_TTL_SECONDS`  | `600`                     | Cache lifetime in seconds (10 minutes)   |
| `NODE_ENV`           | `development`             | `development` or `production`            |

## API

### `GET /api/weather?city=<name>`

```bash
curl "http://localhost:3000/api/weather?city=delhi"
```

### `GET /api/weather?lat=<number>&lon=<number>`

```bash
curl "http://localhost:3000/api/weather?lat=21.17&lon=72.83"
```

Both return:

```json
{
  "success": true,
  "data": {
    "location": { "name": "Delhi", "country": "India", "latitude": 28.66, "longitude": 77.23, "timezone": "Asia/Kolkata" },
    "forecast": { "current": { "...": "..." }, "daily": { "...": "..." } },
    "cached": false
  }
}
```

`cached: true` means the response came from Redis/memory instead of a
fresh Open-Meteo call.

### `GET /health`

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "uptime": 12.3, "timestamp": "...", "cache": "redis" }
```

### Errors

| Status | Meaning                                              |
|--------|-------------------------------------------------------|
| 400    | Invalid/missing query params (see `error.details`)   |
| 404    | City not found, or unknown route                     |
| 429    | Rate limit exceeded (100 requests / 15 min / IP)      |
| 502    | Open-Meteo (geocoding or forecast) is unreachable     |

Error shape:

```json
{ "success": false, "error": { "message": "City \"asdlkj\" not found" } }
```

## Docker

```bash
docker compose up --build
```

This starts the backend on `localhost:3000` and a Redis container it
connects to automatically. Data persists in a `redis-data` volume.

To run the backend image standalone against your own Redis:

```bash
docker build -t weather-backend .
docker run -p 3000:3000 -e REDIS_URL=redis://<your-redis-host>:6379 weather-backend
```

## Deploying

### Render

1. Push this repo to GitHub, create a new **Web Service** on Render pointing at it.
2. Build command: `npm install`  Start command: `npm start`
3. Render sets `PORT` automatically — you don't need to set it.
4. (Optional) Add a Redis instance (Render's managed Redis, or an external
   one like Upstash) and set `REDIS_URL` in the service's environment
   variables. Without it, the app runs fine on the in-memory fallback.

### Replit

1. Create a Node.js Repl and import this repo (or upload the files).
2. Replit sets `PORT` for you; the app already respects `process.env.PORT`.
3. Redis isn't available on Replit by default — the app will automatically
   use its in-memory cache fallback, no configuration needed. If you want
   real Redis, point `REDIS_URL` (in Replit **Secrets**) at a hosted Redis
   like Upstash.
4. Run command: `npm start`

## Notes on caching

- City lookups are cached by lowercased city name; coordinate lookups are
  cached by lat/lon rounded to 2 decimal places (~1.1 km) so nearby
  requests share a cache entry.
- TTL is 10 minutes by default (`CACHE_TTL_SECONDS`).
- If Redis is unavailable, caching silently continues in-memory per
  process — this only matters if you run multiple instances or restart
  often, in which case each process/restart starts with a cold cache.
