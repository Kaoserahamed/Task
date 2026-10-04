/**
 * Admin moderation queue endpoints.
 *
 * The dashboard used to render a hardcoded array of sample reports, so these
 * calls had no counterpart on the server. They now talk to `GET /api/reports`
 * and `PATCH /api/reports/:id/status`, both of which require an admin token —
 * `request()` attaches the bearer from `admin-token` for us.
 *
 * The payload shape is asserted in `endpoints.test.js`, and the backend
 * contract is pinned by `backend/tests/unit/report.routes.test.js`.
 */
import { api } from './client';

export const fetchReports = () => api.get('/api/reports');

/** `payload` is `{ status }` — the endpoint rejects any other field. */
export const updateReportStatus = (id, payload) => api.patch(`/api/reports/${id}/status`, payload);
