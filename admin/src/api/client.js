// @ts-check
/**
 * The single HTTP entry point for the admin dashboard.
 *
 * Every network call in the app goes through `request()`: components import a
 * resource module from `src/api/` instead of calling `fetch` or `axios`
 * themselves, so the base URL, the bearer token and the error envelope are
 * handled in one place.
 *
 * This file opts into `checkJs` even though the apps are JavaScript: it is the
 * boundary every screen depends on, so the type gate has to cover it. The
 * surrounding components stay untyped until they grow JSDoc.
 */
import API_BASE_URL from '../config/api';

const TOKEN_KEY = 'admin-token';

/**
 * Machine-readable detail attached to a failed request.
 *
 * @typedef {Object} ApiErrorOptions
 * @property {number} [status]     HTTP status, or 0 for a transport failure
 * @property {string | null} [code] Error code from the API envelope
 * @property {unknown[]} [errors]  Per-field validation details
 */

/**
 * Options accepted by `request()` and by every `api.*` verb.
 *
 * @typedef {Object} RequestOptions
 * @property {string} [method]                  HTTP verb, defaults to GET
 * @property {unknown} [body]                   JSON-serialisable value, or FormData
 * @property {Record<string, string>} [headers] Extra request headers
 * @property {boolean} [auth]                   Attach the bearer token, defaults to true
 */

/**
 * Narrow an unknown JSON payload to a record whose properties can be read.
 *
 * @param {unknown} value
 * @returns {Record<string, unknown> | null}
 */
const asRecord = (value) => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return /** @type {Record<string, unknown>} */ (value);
};

/** Error thrown for any non-2xx response or transport failure. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {ApiErrorOptions} options
   */
  constructor(message, { status = 0, code = null, errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Bearer token used by authenticated requests.
 *
 * @returns {string | null}
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Human-readable message for a failed response.
 *
 * @param {unknown} payload
 * @param {number} status
 * @returns {string}
 */
const messageFrom = (payload, status) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }
  const record = asRecord(payload);
  if (record) {
    if (typeof record.message === 'string' && record.message) return record.message;
    if (typeof record.error === 'string' && record.error) return record.error;
  }
  return `Request failed with status ${status}`;
};

/**
 * Parse a response body, tolerating 204 and non-JSON payloads.
 *
 * @param {Response} response
 * @returns {Promise<unknown>}
 */
const parseBody = async (response) => {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/**
 * Perform an API request and return the parsed payload.
 *
 * @param {string} path API path, e.g. `/api/tours/42`
 * @param {RequestOptions} options
 * @returns {Promise<unknown>}
 */
export const request = async (path, { method = 'GET', body, headers = {}, auth = true } = {}) => {
  /** @type {Record<string, string>} */
  const requestHeaders = { ...headers };

  /** @type {BodyInit | undefined} */
  let payload;
  if (body instanceof FormData) {
    // Let the browser set the multipart boundary itself.
    payload = body;
  } else if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    payload = JSON.stringify(body);
  }

  const token = auth ? getToken() : null;
  if (token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  /** @type {Response} */
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
    });
  } catch {
    throw new ApiError('Network request failed. Check your connection and try again.', {
      code: 'NETWORK_ERROR',
    });
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const record = asRecord(data);
    throw new ApiError(messageFrom(data, response.status), {
      status: response.status,
      code: record && typeof record.code === 'string' ? record.code : null,
      errors: record && Array.isArray(record.errors) ? record.errors : [],
    });
  }

  return data;
};

export const api = {
  /**
   * @param {string} path
   * @param {RequestOptions} [options]
   */
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {RequestOptions} [options]
   */
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {RequestOptions} [options]
   */
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  /**
   * @param {string} path
   * @param {unknown} body
   * @param {RequestOptions} [options]
   */
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  /**
   * @param {string} path
   * @param {RequestOptions} [options]
   */
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
