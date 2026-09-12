const { z } = require('zod');

/**
 * Accepts EITHER:
 *   - ?city=<non-empty string>
 *   - ?lat=<number -90..90>&lon=<number -180..180>
 * but not both, and not a partial lat/lon pair.
 */
const weatherQuerySchema = z
  .object({
    city: z.string().trim().min(1, 'city must be a non-empty string').max(100).optional(),
    lat: z.coerce
      .number({ invalid_type_error: 'lat must be a number' })
      .min(-90, 'lat must be between -90 and 90')
      .max(90, 'lat must be between -90 and 90')
      .optional(),
    lon: z.coerce
      .number({ invalid_type_error: 'lon must be a number' })
      .min(-180, 'lon must be between -180 and 180')
      .max(180, 'lon must be between -180 and 180')
      .optional(),
  })
  .superRefine((data, ctx) => {
    const hasCity = !!data.city;
    const hasLat = data.lat !== undefined;
    const hasLon = data.lon !== undefined;

    if (hasLat !== hasLon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Both lat and lon must be provided together',
      });
      return;
    }

    const hasCoords = hasLat && hasLon;

    if (!hasCity && !hasCoords) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either "city" or both "lat" and "lon"',
      });
    }

    if (hasCity && hasCoords) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide either "city" or "lat"/"lon", not both',
      });
    }
  });

module.exports = { weatherQuerySchema };
