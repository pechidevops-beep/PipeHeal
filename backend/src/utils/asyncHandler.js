/**
 * Wraps async route handlers to automatically catch errors
 * and forward them to the global error middleware.
 *
 * Eliminates try/catch boilerplate in every controller.
 *
 * @param {Function} fn - Async express route handler
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/incidents', asyncHandler(incidentController.list));
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
