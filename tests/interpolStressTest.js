import http from 'k6/http';
import { check } from 'k6';
import exec from 'k6/execution';
import { Counter, Trend } from 'k6/metrics';
import { buildSearchRequest } from '../lib/requestFactory.js';

const API_URL = __ENV.API_URL || 'http://localhost:3000/interpol/search';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const ENABLE_DEBUG = (__ENV.ENABLE_DEBUG || 'false').toLowerCase() === 'true';

const searchDuration = new Trend('search_duration', true);
const soapDuration = new Trend('soap_duration', true);
const hitCount = new Counter('hit_count');
const noHitCount = new Counter('no_hit_count');
const errors = new Counter('errors');
const totalRequests = new Counter('total_requests');

const rtLt500 = new Counter('rt_bucket_lt_500');
const rt500to1000 = new Counter('rt_bucket_500_1000');
const rt1000to1500 = new Counter('rt_bucket_1000_1500');
const rt1500to2000 = new Counter('rt_bucket_1500_2000');
const rt2000to2500 = new Counter('rt_bucket_2000_2500');
const rt2500to3000 = new Counter('rt_bucket_2500_3000');
const rtGt3000 = new Counter('rt_bucket_gt_3000');

function terminalScenario(startTime) {
  return {
    executor: 'constant-arrival-rate',
    duration: '60m',
    rate: 167,
    timeUnit: '1m',
    preAllocatedVUs: 20,
    maxVUs: 80,
    startTime,
  };
}

export const options = {
  scenarios: {
    terminal_1: { ...terminalScenario('0s'), exec: 'terminal_1', tags: { terminal_id: '1' } },
    terminal_2: { ...terminalScenario('3m'), exec: 'terminal_2', tags: { terminal_id: '2' } },
    terminal_3: { ...terminalScenario('6m'), exec: 'terminal_3', tags: { terminal_id: '3' } },
    terminal_4: { ...terminalScenario('9m'), exec: 'terminal_4', tags: { terminal_id: '4' } },
    terminal_5: { ...terminalScenario('12m'), exec: 'terminal_5', tags: { terminal_id: '5' } },
    terminal_6: { ...terminalScenario('15m'), exec: 'terminal_6', tags: { terminal_id: '6' } },
    terminal_7: { ...terminalScenario('18m'), exec: 'terminal_7', tags: { terminal_id: '7' } },
  },
  thresholds: {
    search_duration: ['p(95)<3000'],
    errors: ['count<1'],
  },
  summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export function setup() {
  // Use: k6 run --log-format raw --console-output logs/interpol_test_results.csv tests/interpolStressTest.js
  console.log('timestamp,request_id,terminal_id,payload,duration_ms,hit_or_nohit,status');
  return { startedAt: new Date().toISOString() };
}

function normalizeTerminalId() {
  const scenarioName = exec.scenario.name || 'terminal_unknown';
  const parts = scenarioName.split('_');
  return parts[parts.length - 1] || 'unknown';
}

function recordRtBucket(durationMs) {
  if (durationMs < 500) rtLt500.add(1);
  else if (durationMs < 1000) rt500to1000.add(1);
  else if (durationMs < 1500) rt1000to1500.add(1);
  else if (durationMs < 2000) rt1500to2000.add(1);
  else if (durationMs < 2500) rt2000to2500.add(1);
  else if (durationMs < 3000) rt2500to3000.add(1);
  else rtGt3000.add(1);
}

function extractSoapDurationMs(response) {
  try {
    const json = response.json();
    if (!json || typeof json !== 'object') return response.timings.waiting;

    const candidates = [
      json.soapDuration,
      json.soapDurationMs,
      json.soap_duration,
      json.meta && json.meta.soapDuration,
      json.meta && json.meta.soapDurationMs,
      json.timings && json.timings.soap,
    ];

    for (const value of candidates) {
      const asNumber = Number(value);
      if (!Number.isNaN(asNumber) && asNumber >= 0) return asNumber;
    }
  } catch (_) {
    // Not JSON response; use waiting time as proxy.
  }
  return response.timings.waiting;
}

function createRequestId(terminalId) {
  return `${terminalId}-${exec.vu.idInTest}-${exec.vu.iterationInScenario}-${Date.now()}`;
}

function runTerminal() {
  const terminalId = normalizeTerminalId();
  const { payload, hitOrNoHit } = buildSearchRequest();
  const requestId = createRequestId(terminalId);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  const response = http.post(API_URL, JSON.stringify(payload), { headers, tags: { terminal_id: terminalId } });
  const duration = response.timings.duration;
  const soapMs = extractSoapDurationMs(response);

  totalRequests.add(1);
  searchDuration.add(duration);
  soapDuration.add(soapMs);
  recordRtBucket(duration);

  if (hitOrNoHit === 'HIT') hitCount.add(1);
  else noHitCount.add(1);

  const ok = check(response, {
    'status is 200': (r) => r.status === 200,
    'response < 3s': (r) => r.timings.duration < 3000,
  });

  if (!ok) {
    errors.add(1);
  }

  const csvPayload = JSON.stringify(payload).replace(/"/g, '""');
  console.log(
    `${new Date().toISOString()},${requestId},${terminalId},"${csvPayload}",${duration.toFixed(2)},${hitOrNoHit},${response.status}`
  );

  if (ENABLE_DEBUG) {
    console.log(`[DEBUG] terminal=${terminalId} request_id=${requestId} duration=${duration.toFixed(2)} status=${response.status}`);
  }
}

export function terminal_1() {
  runTerminal();
}

export function terminal_2() {
  runTerminal();
}

export function terminal_3() {
  runTerminal();
}

export function terminal_4() {
  runTerminal();
}

export function terminal_5() {
  runTerminal();
}

export function terminal_6() {
  runTerminal();
}

export function terminal_7() {
  runTerminal();
}

function metricCount(data, metricName) {
  const metric = data.metrics[metricName];
  if (!metric || !metric.values) return 0;
  return metric.values.count || 0;
}

function safeTrendValue(data, metricName, key) {
  const metric = data.metrics[metricName];
  if (!metric || !metric.values || metric.values[key] === undefined) return 0;
  return metric.values[key];
}

export function handleSummary(data) {
  const total = metricCount(data, 'total_requests');
  const errorCount = metricCount(data, 'errors');
  const errorRate = total > 0 ? ((errorCount / total) * 100).toFixed(2) : '0.00';

  const buckets = [
    ['<500 ms', metricCount(data, 'rt_bucket_lt_500')],
    ['500-1000 ms', metricCount(data, 'rt_bucket_500_1000')],
    ['1000-1500 ms', metricCount(data, 'rt_bucket_1000_1500')],
    ['1500-2000 ms', metricCount(data, 'rt_bucket_1500_2000')],
    ['2000-2500 ms', metricCount(data, 'rt_bucket_2000_2500')],
    ['2500-3000 ms', metricCount(data, 'rt_bucket_2500_3000')],
    ['>3000 ms', metricCount(data, 'rt_bucket_gt_3000')],
  ];

  const lines = [];
  lines.push('INTERPOL /interpol/search - Stress Test Summary');
  lines.push('================================================');
  lines.push(`Total requests: ${total}`);
  lines.push(`Error rate: ${errorRate}% (${errorCount}/${total})`);
  lines.push(`Min latency: ${safeTrendValue(data, 'search_duration', 'min').toFixed(2)} ms`);
  lines.push(`Max latency: ${safeTrendValue(data, 'search_duration', 'max').toFixed(2)} ms`);
  lines.push(`Average latency: ${safeTrendValue(data, 'search_duration', 'avg').toFixed(2)} ms`);
  lines.push(`P90 latency: ${safeTrendValue(data, 'search_duration', 'p(90)').toFixed(2)} ms`);
  lines.push(`P95 latency: ${safeTrendValue(data, 'search_duration', 'p(95)').toFixed(2)} ms`);
  lines.push(`P99 latency: ${safeTrendValue(data, 'search_duration', 'p(99)').toFixed(2)} ms`);
  lines.push('');
  lines.push('Response Time Distribution');
  lines.push('--------------------------');
  for (const [bucket, count] of buckets) {
    const pct = total > 0 ? ((count / total) * 100).toFixed(2) : '0.00';
    lines.push(`${bucket.padEnd(12)} : ${String(count).padStart(8)} (${pct}%)`);
  }

  const summaryText = `${lines.join('\n')}\n`;

  return {
    stdout: summaryText,
    'logs/summary.txt': summaryText,
  };
}
