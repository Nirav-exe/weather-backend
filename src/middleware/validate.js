const ApiError = require('../utils/ApiError');

/**
 * Returns Express middleware that validates req.query against a zod schema.
 * On success, the parsed/coerced value is attached as req.validatedQuery.
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.') || 'query',
      message: issue.message,
    }));
    return next(new ApiError(400, 'Invalid query parameters', details));
  }

  req.validatedQuery = result.data;
  next();
};

module.exports = { validateQuery };
