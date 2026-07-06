# Load Testing Results

This page documents the k6 load test executed for the FoodApp backend. The test was designed to simulate a realistic customer journey, not just a single endpoint ping. It exercised authentication, profile loading, delivery location lookup, restaurant discovery, search/filtering, menu viewing, cart creation, basket retrieval, and checkout preview.

Evidence artifacts:
- Shared evidence link: [Google Drive test archive](https://drive.google.com/file/d/1DzhE6RkDKY4sNIlM3VcxhMImgqNpTQls/view?usp=sharing)
- The archive contains:
   - Local script: `load_test.js`
   - Local summary: `test1.txt`
   - Local CSV results: `test_results.csv`

## Executive Summary

The backend handled a peak load of `1,451` virtual users with a very low HTTP failure rate of `0.06%`. The test completed `67,761` HTTP requests in about `1m50s`, averaging about `616 requests/second`. Functional checks were highly successful: `99.95%` of all checks passed, and the custom successful transaction rate was `99.92%`.

The most important interpretation is:

- Reliability target passed: `http_req_failed < 1%` passed with `0.06%`.
- Business journey checks were strong: `102,999 / 103,045` checks passed.
- Latency target did not pass: `p(95)<500ms` failed because global p95 was `1.43s`.

So this is a respectable and useful result for a hobby project moving toward a real scalable delivery platform. It proves the backend stayed mostly reliable under aggressive load, while also showing where optimization is still needed before claiming production-grade low latency.

## Test Environment

The high-stress k6 run was executed through a Dockerized Nginx reverse proxy in front of two Spring Boot backend replicas.

| Component | Machine / service |
| --- | --- |
| Reverse proxy | Dockerized Nginx |
| Primary backend replica | Desktop with AMD Ryzen 7 7700X, 8 cores, 32 GB DDR5 RAM, NVMe SSD |
| Secondary backend replica | Laptop with AMD Ryzen 5 3500U, 23 GB RAM |
| Shared infrastructure | Separate TrueNAS SCALE machine with Intel Core i7-2600 at 3.40 GHz and 16 GB DDR3 RAM |

The TrueNAS SCALE machine hosted PostgreSQL/PostGIS, Redis, RabbitMQ, and OpenRouteService. This means the benchmark tested two application replicas while the database, cache, message broker, and routing engine remained centralized shared dependencies.

Nginx used weighted load balancing to favor the faster Ryzen 7 7700X backend replica. With a `3:1` weight ratio, approximately `75%` of requests were assigned to the desktop backend and `25%` to the laptop backend. This setup demonstrates multi-replica request distribution at the application layer, while still leaving shared infrastructure services as possible bottlenecks.

## Test Scenario

The k6 scenario used `ramping-vus`:

| Phase | Duration | Target VUs | Purpose |
| --- | ---: | ---: | --- |
| Ramp up | `30s` | `1,451` | Quickly increase traffic to peak load. |
| Steady state | `1m` | `1,451` | Hold high pressure on the backend. |
| Ramp down | `15s` | `0` | Stop load gradually. |
| Graceful ramp down | `5s` | - | Let in-flight work finish where possible. |

The run completed:

| Metric | Result |
| --- | ---: |
| Total runtime | `1m50s` |
| Max VUs | `1,451` |
| Completed iterations | `5,493` |
| Interrupted iterations | `1,109` |
| HTTP requests | `67,761` |
| Request throughput | `616 req/s` |
| Checks total | `103,045` |
| Checks passed | `102,999` |
| Checks failed | `46` |
| Data received | `223 MB` |
| Data sent | `24 MB` |

The interrupted iterations happened during shutdown/ramp-down and should be read separately from application failures.

## Simulated Customer Journey

Each virtual user followed a realistic browsing and ordering path:

1. Login with a unique generated customer account.
2. Fetch the authenticated customer profile.
3. Fetch the active delivery location.
4. Load restaurant categories for discovery.
5. Load the available restaurant dashboard.
6. Run restaurant search and filter queries.
7. Open a restaurant/branch and load menu-related data.
8. For 30% of users, simulate cart and checkout behavior:
   - read branch details,
   - read menu,
   - select an available item,
   - calculate quantity to satisfy minimum order amount,
   - open single menu item,
   - add item to cart,
   - retrieve basket,
   - request checkout preview.

This matters because a real food delivery app does not fail from one endpoint alone. A normal customer session combines authentication, cached and uncached discovery, route-aware restaurant filtering, branch menu reads, cart writes, and checkout validation.

## Endpoint Coverage

The script exercised these backend areas:

| Area | Endpoint examples |
| --- | --- |
| Auth | `POST /api/auth/login` |
| User profile | `GET /api/users/account` |
| Delivery location | `GET /api/delivery-location/deliveryLocation` |
| Categories | `GET /api/restaurant-categories` |
| Discovery dashboard | `GET /api/restaurants/available-restaurants-dashboard` |
| Search and filters | `GET /api/restaurants/available-restaurants?...` |
| Branch details | `GET /api/restaurant-branch/{branchId}` |
| Branch menu | `GET /api/restaurant-branch/{branchId}/menu` |
| Single menu item | `GET /api/menu/{branchMenuItemId}` |
| Cart | `POST /api/cart/basket` |
| Basket | `GET /api/cart/basket/{branchId}` |
| Checkout preview | `GET /api/checkout/{branchId}` |

## Threshold Results

Configured thresholds:

```js
thresholds: {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
}
```

Actual results:

| Threshold | Target | Actual | Result |
| --- | ---: | ---: | --- |
| HTTP failure rate | `< 1%` | `0.06%` | Passed |
| HTTP p95 duration | `< 500ms` | `1.43s` | Failed |

The latency threshold was intentionally strict. A `500ms` p95 target is a strong production target, especially for endpoints that perform geospatial filtering, route calculations, database reads, and cart/checkout validation. The backend did not meet that latency bar under `1,451` VUs, but the failure rate stayed very low.

## Functional Check Results

Overall:

| Check metric | Result |
| --- | ---: |
| Checks total | `103,045` |
| Checks succeeded | `99.95%` |
| Checks failed | `0.04%` |
| Custom successful transactions | `99.92%` |

Passed checks included:

- login status is `200`,
- login contains token,
- profile status is `200`,
- profile email matches,
- delivery location status is `200`,
- delivery location coordinates present,
- categories status is `200`,
- categories array is not empty,
- dashboard status is `200`,
- dashboard data present,
- search status is `200`,
- minimum order amount filter status is `200`,
- multi-filter search status is `200`,
- menu status is `200`,
- menu retrieved successfully,
- single menu status is `200`,
- add to cart status is `201` or `200`,
- basket status is `200`.

The only failed functional check group was checkout:

| Checkout check | Result |
| --- | ---: |
| Successful checkout checks | `1,588` |
| Failed checkout checks | `46` |
| Checkout success rate | `97%` |

Those `46` checkout failures account for the visible check failures and the `0.06%` HTTP failure rate. The next debugging step is to inspect the checkout failure bodies in the k6 logs and correlate them with backend logs. Possible causes include minimum order edge cases, delivery-zone validation, payment method selection, item availability changes, or route calculation failures under load.

## HTTP Performance Summary

| Metric | Result |
| --- | ---: |
| Average request duration | `244.8ms` |
| Median request duration | `54.53ms` |
| p90 request duration | `723.77ms` |
| p95 request duration | `1.43s` |
| Max request duration | `8.17s` |
| HTTP failure rate | `0.06%` |
| HTTP requests/sec | `616 req/s` |

The median is very good, which means the common request path was fast. The p90/p95 and max values show long-tail latency under high concurrency. That is the main performance improvement area.

## Endpoint-Level Timing

| Metric | Average | Median | p90 | p95 | Max |
| --- | ---: | ---: | ---: | ---: | ---: |
| Login | `208ms` | `86ms` | `481ms` | `1.00s` | `4.83s` |
| Account profile | `234ms` | `33ms` | `706ms` | `1.46s` | `5.96s` |
| Delivery location | `248ms` | `29ms` | `785ms` | `1.59s` | `5.57s` |
| Categories | `238ms` | `28ms` | `741ms` | `1.53s` | `4.91s` |
| Dashboard | `265ms` | `44ms` | `833ms` | `1.58s` | `5.40s` |
| Search | `280ms` | `57ms` | `857ms` | `1.68s` | `8.17s` |
| Branch/menu details | `139ms` | `20ms` | `414ms` | `948ms` | `4.78s` |
| Cart | `262ms` | `51ms` | `779ms` | `1.51s` | `6.97s` |
| Checkout | `308ms` | `60ms` | `957ms` | `1.70s` | `6.01s` |

The slowest p95 domain was checkout at `1.70s`, followed by search at `1.68s`, delivery location at `1.59s`, dashboard at `1.58s`, and categories at `1.53s`.

## What This Test Proves

This test proves that the backend can withstand a very aggressive burst of realistic customer traffic while keeping errors rare. The system processed more than `67k` requests at about `616 req/s`, with only `46` failed HTTP requests and `99.95%` successful checks.

It also proves that the app-level customer flow is testable end-to-end:

- authentication works under load,
- JWT-protected endpoints remain usable,
- discovery endpoints respond under pressure,
- branch and menu reads work under load,
- cart writes and basket reads work under load,
- checkout mostly works, with a small failure cluster that needs investigation.

## What Still Needs Work

The backend should not be described as fully passing every performance threshold, because the global latency threshold failed:

```text
p(95)<500ms failed with p(95)=1.43s
```

Recommended optimization targets:

1. Investigate checkout failures by logging checkout response bodies and backend exceptions.
2. Profile checkout and route calculation under load.
3. Confirm Redis cache hit rates for `dashboardRestaurants`, `branchMenus`, and `distanceMatrix`.
4. Add database indexes for common discovery, cart, order, and payment filters.
5. Review connection pool sizing for PostgreSQL, Redis, and external HTTP clients.
6. Separate high-accuracy routing from discovery when possible; use bulk ORS/cached routes for discovery and reserve precise routing for checkout.
7. Add a second k6 test after optimization with the same scenario to compare p95 and checkout failures.

## Reproducibility

The load test can be run with:

```powershell
k6 run load_test.js
```

Useful environment overrides:

```powershell
k6 run -e BASE_URL=http://localhost -e LOGIN_PASSWORD=... -e BRANCH_ID=22 load_test.js
```

The script defaults:

| Variable | Default |
| --- | --- |
| `BASE_URL` | `http://localhost` |
| `LOGIN_PASSWORD` | `Toni145@!` |
| `BRANCH_ID` | `22` |

The script generates customer emails using the VU ID:

```text
customerFlavorFusionTest{vuId}@gmail.com
```

It skips the range `501-568`, matching the existing generated test-user dataset.

## Final Assessment

For the current project stage, this is a strong result. The backend remained stable under `1,451` virtual users, achieved `99.92%` successful transactions, and kept HTTP failures at only `0.06%`.

The correct next claim is:

> The backend demonstrated strong reliability under high simulated customer traffic, while p95 latency and checkout edge failures remain the main optimization targets before production-scale claims.
