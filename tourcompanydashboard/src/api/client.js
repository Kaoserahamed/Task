/**
 * The single HTTP entry point for the company dashboard.
 *
 * Every network call in the app goes through `request()`: components import a
 * resource module from `src/api/` instead of calling `fetch` themselves, so the
 * base URL, the bearer token and the error envelope are handled in one place.
 */
import API_BASE_URL from '../config/api';

const TOKEN_KEY = 'company-token';

/** Error thrown for any non-2xx response or transport failure. */
export class ApiError extends Error {
  constructor(message, { status = 0, code = null, errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/** Bearer token used by authenticated requests. */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

const messageFrom = (payload, status) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
  }
  return `Request failed with status ${status}`;
};

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
 * @param {string} path   API path, e.g. `/api/tours/42`
 * @param {object} [options]
 * @param {string} [options.method]  HTTP method, defaults to GET
 * @param {*}      [options.body]    JSON body or FormData
 * @param {object} [options.headers] Extra headers
 * @param {boolean} [options.auth]   Attach the bearer token, defaults to true
 */
export const request = async (path, { method = 'GET', body, headers = {}, auth = true } = {}) => {
  const requestHeaders = { ...headers };
  let payload = body;

  if (body instanceof FormData) {
    // Let the browser set the multipart boundary itself.
  } else if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    payload = JSON.stringify(body);
  }

  const token = auth ? getToken() : null;
  if (token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

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
    throw new ApiError(messageFrom(data, response.status), {
      status: response.status,
      code: data && typeof data === 'object' ? data.code : null,
      errors: (data && typeof data === 'object' && data.errors) || [],
    });
  }

  return data;
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
