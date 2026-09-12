const express = require('express');
const { validateQuery } = require('../middleware/validate');
const { weatherQuerySchema } = require('../validators/weatherValidator');
const weatherService = require('../services/weatherService');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// GET /api/weather?city=delhi
// GET /api/weather?lat=21.17&lon=72.83
router.get(
  '/weather',
  validateQuery(weatherQuerySchema),
  asyncHandler(async (req, res) => {
    const { city, lat, lon } = req.validatedQuery;

    const result = city
      ? await weatherService.getWeatherByCity(city)
      : await weatherService.getWeatherByCoords(lat, lon);

    res.status(200).json({
      success: true,
      data: result,
    });
  })
);

module.exports = router;
