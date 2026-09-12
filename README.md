# weather-backend
# Weather Backend - Android

Secure and fast backend for Weather Android App. Proxies Open-Meteo API with caching and security.

### Features
- City search & lat/lon weather
- 7-day forecast & current weather
- Redis caching (10 min) to avoid rate limits
- Rate limiting + Helmet + CORS security
- No API key exposed on client
- Docker ready + Replit/Render deploy ready

### Tech Stack
Node.js, Express, Axios, Redis (node-cache fallback), Docker

### API Used
Open-Meteo - 100% free, open source, no key required
- Geocoding: `https://geocoding-api.open-meteo.com`
- Forecast: `https://api.open-meteo.com`

### Endpoints
