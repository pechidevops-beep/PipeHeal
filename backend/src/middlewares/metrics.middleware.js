import { EventEmitter } from 'events';

// Real-time metric store
export const metricsEmitter = new EventEmitter();

const metrics = {
  requestsPerMinute: 0,
  latencySum: 0,
  requestCount: 0,
  activeErrors: 0,
  recentEvents: []
};

// Reset RPM every minute
setInterval(() => {
  metrics.requestsPerMinute = 0;
  metricsEmitter.emit('update', getMetrics());
}, 60000);

export const getMetrics = () => {
  const avgLatency = metrics.requestCount > 0 
    ? Math.round(metrics.latencySum / metrics.requestCount) 
    : 0;

  return {
    ...metrics,
    avgLatency: `${avgLatency}ms`,
    p95Latency: `${Math.round(avgLatency * 1.5)}ms` // Rough approximation for demo
  };
};

export const recordEvent = (type, message) => {
  metrics.recentEvents.unshift({
    type,
    message,
    time: Date.now()
  });
  if (metrics.recentEvents.length > 10) {
    metrics.recentEvents.pop();
  }
  metricsEmitter.emit('update', getMetrics());
};

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();
  metrics.requestsPerMinute++;
  metrics.requestCount++;

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const latencyMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);
    metrics.latencySum += latencyMs;

    if (res.statusCode >= 500) {
      metrics.activeErrors++;
      recordEvent('error', `${req.method} ${req.originalUrl} failed with ${res.statusCode}`);
    }

    metricsEmitter.emit('update', getMetrics());
  });

  next();
};
