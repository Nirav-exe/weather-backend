const axios = require('axios');
const ApiError = require('../utils/ApiError');

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Resolves a city name to coordinates using Open-Meteo's geocoding API.
 * Throws ApiError(404) if no match is found, or ApiError(502) if the
 * upstream service is unreachable/erroring.
 */
async function geocodeCity(city) {
  let response;

  try {
    response = await axios.get(GEOCODING_URL, {
      params: {
        name: city,
        count: 1,
        language: 'en',
        format: 'json',
      },
      timeout: 5000,
    });
  } catch (err) {
    throw new ApiError(
      502,
      'Geocoding service is currently unavailable. Please try again shortly.',
      err.message
    );
  }

  const results = response.data?.results;

  if (!results || results.length === 0) {
    throw new ApiError(404, `City "${city}" not found`);
  }

  const match = results[0];

  return {
    name: match.name,
    country: match.country || null,
    admin1: match.admin1 || null,
    latitude: match.latitude,
    longitude: match.longitude,
    timezone: match.timezone || null,
  };
}

module.exports = { geocodeCity };
