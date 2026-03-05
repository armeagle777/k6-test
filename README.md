# INTERPOL FIND Stress Test Suite (k6)

This suite stress-tests `POST /interpol/search` with a FIND-style terminal model:

- 7 independent border terminals (7 k6 scenarios)
- 40% HIT and 60% NO HIT queries
- Per terminal: `~10,000` requests (`167 req/min x 60 min = 10,020`)
- Staggered start: `0, 3, 6, 9, 12, 15, 18` minutes

## Project Structure

- `tests/interpolStressTest.js` - main test and scenarios
- `tests/interpolSltdStressTest.js` - SLTD main test and scenarios
- `data/nominals.js` - HIT dataset
- `data/sltdDocuments.js` - SLTD HIT dataset
- `lib/fakePerson.js` - fake person generator (NO HIT)
- `lib/requestFactory.js` - 40/60 request mix
- `lib/fakeSltdDocument.js` - SLTD fake document generator (NO HIT)
- `lib/sltdRequestFactory.js` - SLTD 40/60 request mix
- `logs/` - output folder for request/summary logs

## Run (basic)

```bash
k6 run tests/interpolStressTest.js
```

## Run with CSV request logs

Use raw console output to write per-request CSV lines to `/logs/interpol_test_results.csv`.

```bash
k6 run --log-format raw --console-output logs/interpol_test_results.csv tests/interpolStressTest.js
```

## Run SLTD test

Default SLTD endpoint:

- `http://localhost:3000/api/interpol/sltd/search`

Run:

```bash
k6 run tests/interpolSltdStressTest.js
```

Run with CSV logs:

```bash
k6 run --log-format raw --console-output logs/interpol_sltd_test_results.csv tests/interpolSltdStressTest.js
```

Run with explicit SLTD API URL:

```bash
API_URL="http://localhost:3000/api/interpol/sltd/search" k6 run tests/interpolSltdStressTest.js
```

## Optional environment variables

- `API_URL` (script default: `/interpol/search` for `interpolStressTest.js`, `/api/interpol/sltd/search` for `interpolSltdStressTest.js`)
- `AUTH_TOKEN` (Bearer token)
- `ENABLE_DEBUG=true|false`

Example:

```bash
API_URL="https://api.example.gov/interpol/search" AUTH_TOKEN="<token>" ENABLE_DEBUG=true k6 run tests/interpolStressTest.js
```

## Prometheus Remote Write + Grafana

Run k6 and push metrics to Prometheus Remote Write:

```bash
k6 run \
  -o experimental-prometheus-rw \
  -e K6_PROMETHEUS_RW_SERVER_URL="http://localhost:9090/api/v1/write" \
  -e K6_PROMETHEUS_RW_TREND_STATS="min,avg,max,p(90),p(95),p(99)" \
  tests/interpolStressTest.js
```

Then in Grafana:

1. Add Prometheus as a data source.
2. Build dashboards for:
   - `search_duration`
   - `soap_duration`
   - `errors`
   - `hit_count` / `no_hit_count`
   - response bucket counters (`rt_bucket_*`)

## Notes

- Response validation checks:
  - status is `200`
  - response time `< 3s`
- End-of-run summary includes total requests, error rate, min/max/avg/p90/p95/p99, and response-time bucket distribution.
