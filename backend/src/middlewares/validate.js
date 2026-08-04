import { ApiError } from '../utils/ApiError.js';

/**
 * Zod validation middleware factory.
 * Pass a Zod schema to validate req.body, req.params, or req.query.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'params'|'query'} [source='body']
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/incidents', validate(createIncidentSchema), controller.create);
 */
export const validate = (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        received: e.received,
      }));
      return next(ApiError.validationError(details));
    }
    // Replace request data with parsed (coerced) values
    req[source] = result.data;
    next();
  };

export default validate;
