# Backend Documentation

This section documents the current Spring Boot backend for FoodApp / Flavor Fusion. The project is a hobby project, but the backend is designed around real food delivery concerns: role separation, branch-level menu control, live operational dashboards, external payment confirmation, route-based delivery pricing, Redis caching, and WebSocket updates.

The backend lives in:
```text
C:\Users\anton\OneDrive\Desktop\Tailwind\FoodApp\backend
```

Main package:

```text
com.toni.FoodApp
```

## Current Backend Scope

Implemented backend areas:

- JWT authentication and role-based authorization.
- Admin, manager, branch manager, customer, and delivery roles.
- Restaurant and branch management.
- Opening hours and manual branch open/closed status.
- Customer delivery locations.
- Restaurant discovery with location filtering, delivery pricing, and cached dashboard pages.
- Master menu items, categories, branch menu items, options, variants, and branch-level option overrides.
- Cart and checkout preview.
- Order creation, order status lifecycle, assignment to delivery drivers, and order history.
- PokPay payment initiation, webhook confirmation, payment status lookup, refund request, and branch refund.
- WebSocket order updates for branch dashboards and delivery clients.
- Delivery driver live coordinate submission to Redis.
- Analytics for revenue, customers, orders, popular items, and delivery earnings.
- AWS S3 image uploads for restaurants, menus, users, categories, and import utilities.
- Internal job endpoints for daily statistics reset and expired payment cleanup.
- k6 customer-journey load testing with `1,451` virtual users, `616 req/s`, `99.95%` successful checks, and documented latency optimization targets.

Known incomplete areas are documented in [Known Gaps](./known-gaps.md). The most important one is delivery-driver location display: the Kotlin delivery app can submit coordinates, and the backend stores them in Redis, but the frontend/admin display and a complete live location stream are not fully implemented yet.

## Technology Stack

| Area | Current choice |
| --- | --- |
| Language/runtime | Java 21 |
| Framework | Spring Boot 3.5.5 |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL with PostGIS |
| Spatial types | Hibernate Spatial + JTS `Point` |
| Cache / ephemeral state | Redis |
| Auth | Spring Security + JWT |
| Realtime | Spring WebSocket + STOMP broker relay |
| Broker relay | RabbitMQ STOMP on port `61613` |
| Payments | PokPay SDK order API and webhook |
| Images | AWS S3, CloudFront, Thumbnailator |
| Routing | Google Distance Matrix and OpenRouteService matrix |
| Templating | Thymeleaf for payment/order HTML templates |
| Build | Maven |
| Containers | Dockerfile and docker-compose with PostGIS, Redis, Nginx |

## Roles

| Role | Purpose |
| --- | --- |
| `ADMIN` | System-level management: restaurants, roles, users, payment method names, admin statistics. |
| `MANAGER` | Restaurant owner/company account. Manages its restaurant, branch managers, branches, categories, master menus, and restaurant-level analytics. |
| `BRANCH_MANAGER` | Operates one physical branch. Manages branch hours, branch menu pricing/availability, branch payment methods, order preparation, branch analytics, and refunds. |
| `CUSTOMER` | Registers, saves delivery locations, browses restaurants, uses cart/checkout, places orders, cancels allowed orders, reviews, and asks for refunds. |
| `DELIVERY` | Uses the delivery app/dashboard, sees unassigned orders, accepts orders, updates delivery statuses, submits live coordinates, and sees earnings/orders. |

## Documentation Map

- [Setup and Configuration](./setup.md): how the backend runs, required config keys, local and Docker notes.
- [Architecture](./architecture.md): layers, packages, data ownership, caching, realtime, and scaling design.
- [Data Model](./data-model.md): entities and relationships.
- [API Reference](./api-reference.md): REST endpoints grouped by domain.
- [Load Testing Results](./load-testing.md): k6 customer-journey load test, results, interpretation, and optimization targets.
- [Business Flows](./business-flows.md): order, payment, delivery, menu, cart, discovery, and analytics behavior.
- [Operations](./operations.md): Redis, WebSocket broker, scheduled jobs, image import, deployment notes.
- [Known Gaps](./known-gaps.md): unfinished features, cleanup items, and recommended next steps.
