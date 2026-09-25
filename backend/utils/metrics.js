'use strict';

const metrics = new Map();
const startedAt = Date.now();

function keyFor(method, route, status) {
  return `${method}|${route || 'unmatched'}|${status}`;
}

function recordRequest({ method, route, statusCode, durationMs }) {
  const key = keyFor(method, route, statusCode);
  const current = metrics.get(key) || { count: 0, durationMs: 0 };
  current.count += 1;
  current.durationMs += durationMs;
  metrics.set(key, current);
}

function render() {
  const lines = [
    '# HELP task_http_requests_total Total HTTP requests handled by this process.',
    '# TYPE task_http_requests_total counter',
  ];
  for (const [key, value] of metrics.entries()) {
    const [method, route, status] = key.split('|');
    lines.push(
      `task_http_requests_total{method="${method}",route="${route}",status="${status}"} ${value.count}`
    );
    lines.push(
      `task_http_request_duration_ms_sum{method="${method}",route="${route}"} ${value.durationMs}`
    );
  }
  lines.push('# HELP task_process_uptime_seconds Process uptime in seconds.');
  lines.push('# TYPE task_process_uptime_seconds gauge');
  lines.push(`task_process_uptime_seconds ${Math.floor((Date.now() - startedAt) / 1000)}`);
  return `${lines.join('\n')}\n`;
}

function middleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    recordRequest({
      method: req.method,
      route: req.route?.path || 'unmatched',
      statusCode: res.statusCode,
      durationMs,
    });
  });
  next();
}

module.exports = { middleware, render, recordRequest };
