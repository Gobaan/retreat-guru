# Benchmark Results — 2026-04-09

## pytest-benchmark (unit-level, SQLite in-process)

### sync_activities (serializer internals)
| Test                        | Mean     | OPS        |
|-----------------------------|----------|------------|
| test_sync_activities_empty  | 151 µs   | 6,643/s    |
| test_sync_activities_full   | 363 µs   | 2,752/s    |

Writing all 4 activities is ~2.4× slower than clearing them — expected given
the extra bulk_create inserts.

### upsert (serializer create vs update)
| Test                | Mean     | OPS      |
|---------------------|----------|----------|
| test_upsert_update  | 1,337 µs | 748/s    |
| test_upsert_create  | 1,755 µs | 570/s    |

Create is ~1.3× slower than update, consistent with the extra INSERT vs UPDATE.

### HTTP endpoints (Django test client, no network overhead)
| Test                | Mean     | OPS      |
|---------------------|----------|----------|
| test_get_missing    | 1,106 µs | 904/s    |
| test_get_existing   | 1,787 µs | 560/s    |
| test_put_update     | 1,687 µs | 593/s    |
| test_put_create     | 3,266 µs | 306/s    |
| test_proxy_overhead | 322 µs   | 3,102/s  |

All 9 tests passed.

---

## Locust (HTTP load test, 20 users, 30 seconds)

Full report: locust_report.html
Raw data:    locust_stats.csv, locust_stats_history.csv, locust_failures.csv

### Throughput
| Endpoint | req/s  | Median | p95    | p99    |
|----------|--------|--------|--------|--------|
| GET      | 21.6   | 81 ms  | 280 ms | 340 ms |
| PUT      | 17.1   | 220 ms | 2,400 ms | 4,600 ms |
| DELETE   | 6.1    | 200 ms | 1,700 ms | 2,900 ms |
| Total    | 44.8   | 120 ms | 1,500 ms | 2,900 ms |

### Failures (12.4% overall)
| Count | Error | Category |
|-------|-------|----------|
| ~120  | PUT 500 — `sqlite3.OperationalError: database is locked` | Real SQLite limit |
| ~40   | GET 404 — DELETE ran before GET on same registration_id | Test design artifact |
| ~10   | DELETE 404 — double-delete on same registration_id | Test design artifact |
| ~6    | PUT 400 — `DisallowedHost` / validation error | Test design artifact |

### What was a real bug vs. what was a test artifact

**Real bug (fixed):** `RegistrationInfo.put` had a TOCTOU race — it checked
whether the row existed, then later created or updated it. A concurrent
request could create the same row in between, causing a unique constraint
violation. Fixed by replacing the check-then-act with `get_or_create` inside
`transaction.atomic()`, which also makes `_sync_activities` (delete + bulk
create) atomic so two concurrent PUTs can't interleave those two steps.

**Test artifact (404s):** The locust script assigned multiple virtual users
to the same registration_id buckets using `id(self) % 20`. This caused
genuine races between GET/DELETE on the same row, which wouldn't happen in
single-user real usage.

**Known SQLite limitation (500s):** SQLite uses file-level locking. Under
concurrent writes, connections queue on the same lock. When the queue depth
exceeds the `timeout` setting (20s), Django raises
`OperationalError: database is locked` → 500. `transaction.atomic()` prevents
partial-write interleave races but cannot fix this fundamental limit.
Production deployments should use Postgres, where row-level locking
eliminates both the TOCTOU and the lock-contention 500s.

### Key findings
1. **GET is healthy.** Median 64–81 ms, p99 340–360 ms — reads scale well.
2. **PUT/DELETE tail latency is high under load.** p95 2,100–2,400 ms on PUT
   is entirely SQLite lock-wait time, not query complexity.
3. **Concurrency ceiling is ~1 concurrent writer.** SQLite allows only one
   writer at a time. For this single-user local app that is fine; for a
   multi-user deployment it is not.
