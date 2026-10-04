const AppError = require('../utils/AppError');

// validate(schema, 'body' | 'query' | 'params')
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    const first = errors[0];
    const message = first ? `${first.field ? first.field + ': ' : ''}${first.message}` : 'Validation failed';
    return next(new AppError(message, 400, errors));
  }
  if (source === 'query') {
    req.validatedQuery = result.data; // Express 4 allows reassigning, kept separate for clarity
  } else {
    req[source] = result.data;
  }
  next();
};
