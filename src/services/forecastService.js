const axios = require('axios');
const ApiError = require('../utils/ApiError');

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Fetches current conditions + a short daily forecast for a coordinate pair
 * from Open-Meteo. Throws ApiError(502) if the upstream service is
 * unreachable/erroring.
 */
async function getForecast(latitude, longitude) {
  let response;

  try {
    response = await axios.get(FORECAST_URL, {
      params: {
        latitude,
        longitude,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
        ].join(','),
        timezone: 'auto',
      },
      timeout: 5000,
    });
  } catch (err) {
    throw new ApiError(
      502,
      'Forecast service is currently unavailable. Please try again shortly.',
      err.message
    );
  }

  return response.data;
}

module.exports = { getForecast };
