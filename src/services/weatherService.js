const geocodingService = require('./geocodingService');
const forecastService = require('./forecastService');
const cache = require('../utils/cache');
const env = require('../config/env');

// Round coordinates so nearby lat/lon requests (e.g. 21.1701 vs 21.1699)
// share a cache entry instead of each missing the cache individually.
function roundCoord(n) {
  return Math.round(n * 100) / 100; // ~1.1km precision
}

async function getWeatherByCity(cityRaw) {
  const cacheKey = `weather:city:${cityRaw.trim().toLowerCase()}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const location = await geocodingService.geocodeCity(cityRaw);
  const forecast = await forecastService.getForecast(location.latitude, location.longitude);

  const result = { location, forecast };
  await cache.set(cacheKey, result, env.cacheTtlSeconds);

  return { ...result, cached: false };
}

async function getWeatherByCoords(lat, lon) {
  const cacheKey = `weather:coords:${roundCoord(lat)}:${roundCoord(lon)}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  const forecast = await forecastService.getForecast(lat, lon);

  const result = {
    location: { latitude: lat, longitude: lon },
    forecast,
  };
  await cache.set(cacheKey, result, env.cacheTtlSeconds);

  return { ...result, cached: false };
}

module.exports = { getWeatherByCity, getWeatherByCoords };
