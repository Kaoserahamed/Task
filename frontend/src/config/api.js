/**
 * API Configuration
 *
 * The one place the frontend learns where the API lives. Every request goes
 * through `src/api/`, which imports this value; no component talks to the
 * network on its own.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default API_BASE_URL;
