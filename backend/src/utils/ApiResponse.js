/**
 * Uniform API response shape.
 * All endpoints should use this for consistency with the React frontend.
 */
export class ApiResponse {
  /**
   * @param {number} statusCode
   * @param {any} data
   * @param {string} message
   * @param {object} [meta] - Optional pagination/meta info
   */
  constructor(statusCode, data, message = 'Success', meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Send the response via Express res object.
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json(this);
  }

  // ── Static factories ───────────────────────────────────────────────────────

  static ok(res, data, message = 'Success', meta = null) {
    return new ApiResponse(200, data, message, meta).send(res);
  }

  static created(res, data, message = 'Created') {
    return new ApiResponse(201, data, message).send(res);
  }

  static noContent(res) {
    return res.status(204).send();
  }

  static paginated(res, data, { total, page, limit, pages }) {
    return new ApiResponse(200, data, 'Success', {
      total,
      page,
      limit,
      pages,
    }).send(res);
  }
}

export default ApiResponse;
