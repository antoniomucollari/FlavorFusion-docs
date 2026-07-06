# Backend Architecture

## Big Picture

FoodApp is organized as a modular Spring Boot monolith. That is a good fit for the current stage: one deployable backend, clear domain packages, relational consistency, and enough Redis/WebSocket support to scale operational features later.

The application is not a toy CRUD backend. It already has real delivery-app concerns:

- Separate roles and ownership checks.
- Branch-specific menus and pricing.
- Location-aware restaurant discovery.
- Payment webhooks and payment cleanup.
- Realtime order updates.
- External route providers.
- Redis caches and geospatial indexes.
- Driver live location ingestion.

## Backend Module Diagram
![Module Diagram](https://cdn.antoniomucollari.com/foodAppDocs/module_diagram.png)

## Layering

Most packages follow this structure:

```text
controller -> service -> repository -> entity
              |
              -> mapper / dto / specification / validator
```

Controllers should stay thin. They parse HTTP inputs and delegate to services.

Services contain business rules: ownership, status transitions, pricing, payment initiation, cache decisions, and validation.

Repositories own database queries and specifications.

DTOs are used for responses and request bodies. Entity classes should not be returned directly from controllers.

## Main Packages

| Package | Purpose |
| --- | --- |
| `auth_users` | Registration, login, user profile, user filtering, account activation/deactivation, password changes. |
| `role` | Role CRUD and role entities. |
| `security` | JWT generation/validation, request filter, user details, CORS, Spring Security chain. |
| `restaurant` | Restaurants, branches, opening hours, reviews, branch menu items, branch option overrides, restaurant discovery. |
| `category` | Menu categories and restaurant discovery categories. |
| `menu` | Master menu items, options, variants, branch manager menu views, cached branch menus. |
| `cart` | Customer basket, checkout preview, totals, tips, delivery note, payment method selection. |
| `order` | Order creation, order status updates, assignment, order history, WebSocket event publishing. |
| `payment` | Payment methods, payment listing/filtering, PokPay integration, refunds, webhooks. |
| `deliverTo` | Customer saved delivery locations and live driver coordinate submission. |
| `location` | Route providers and distance matrix routing manager. |
| `analytics` | Revenue, customer, popular item, order, and delivery earnings metrics. |
| `aws` | S3 upload service. |
| `scheduler` | Internal job endpoints and startup import helpers. |
| `config` | Redis, WebSocket, Google Maps, ModelMapper, JTS, application beans. |
| `exceptions` | Global error handling and domain exceptions. |
| `response` | Shared API response wrapper and serializable page wrapper. |

## Shared Response Shape

Most endpoints return:

```json
{
  "statusCode": 200,
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```

`meta` is optional. `data` can be an object, array, page, or omitted.

## Authentication

REST authentication uses:

```http
Authorization: Bearer <jwt>
```

`AuthFilter` extracts the token, validates it, loads the user, checks token version, checks active account status, and blocks users who must change their password except for:

```http
PATCH /api/users/change-password
```

Important security details:

- Stateless sessions are used.
- CSRF is disabled for the API.
- CORS currently allows `http://localhost:5173` and `http://localhost:8080`.
- `@PreAuthorize` method annotations are the real role boundary for many endpoints.
- Some URL patterns are public in the HTTP filter but still protected by method annotations.

## JWT Token Versioning

`User.tokenVersion` is stored in the database and included in the JWT. If the database value differs from the token value, the backend returns:

```json
{ "error": "Session expired. Please log in again." }
```

This supports forced logout after password changes or security events.

## Account Deactivation

`User.isActive` controls whether a user can keep using the system. If inactive, the auth filter returns:

```json
{ "error": "User account is deactivated." }
```

## Required Password Change

Manager-created users can be forced to change password through `User.requirePasswordChange`. If set, all routes except password change are blocked with:

```json
{
  "error": "Password change required.",
  "code": "PASSWORD_CHANGE_REQUIRED"
}
```

## WebSocket Architecture

WebSocket endpoint:

```text
/ws
```

The backend uses STOMP with a broker relay:

```text
/topic
/queue
```

RabbitMQ STOMP relay is configured with:

```text
host = spring.rabbitmq.host
port = 61613
login = spring.rabbitmq.username
passcode = spring.rabbitmq.password
```

Clients pass the JWT in the STOMP `CONNECT` native header:

```text
Authorization: Bearer <jwt>
```

`WebSocketConfig` extracts the user email from the token and sets the WebSocket principal. This is important because personal driver updates use:

```java
convertAndSendToUser(driverEmail, "/queue/updates", order)
```

## WebSocket Topics

| Topic | Audience | Purpose |
| --- | --- | --- |
| `/topic/branch.{branchId}.manager` | Branch dashboard | Order updates for a branch. |
| `/topic/delivery.global.unassigned` | Delivery drivers | Global pool of unassigned orders. Uses `wsAction` as `ADD` or `REMOVE`. |
| `/user/queue/updates` | Individual delivery driver | Personal assigned-order updates. |

Important: the existing older delivery doc used slash-style topics. The current code uses dot-style topic names for RabbitMQ topic exchange compatibility.

## Redis Responsibilities

Redis is used for three different purposes:

| Purpose | Key/cache | Notes |
| --- | --- | --- |
| Restaurant branch GEO index | `restaurant:locations` | Stores active branch IDs by coordinates for nearby discovery. |
| Dashboard restaurant cache | `dashboardRestaurants` | Five-minute cache in non-dev profile. |
| Branch menu cache | `branchMenus` | Two-hour cache in non-dev profile. |
| Distance matrix cache | `distanceMatrix` | Key includes branch, rounded user location, and provider. |
| User profile cache | `userProfileCache` | Five-second micro-cache. |
| Live driver location | `driver_loc:{driverId}` | JSON payload with one-hour TTL. |

## Location and Routing Strategy

Restaurant discovery uses a two-stage design:

1. Redis GEO narrows candidate branches within the system maximum delivery radius of 8 km.
2. Database queries and route calculations decide which restaurants/branches are actually deliverable and how they should be sorted.

Route providers:

| Provider enum | Implementation | Use |
| --- | --- | --- |
| `HIGH_ACCURACY` | Google Distance Matrix | Precise single route calculations, especially checkout. |
| `STANDARD` | OpenRouteService matrix | Cheaper/on-premise bulk route calculations. |

The pricing service calculates:

- deliverability,
- delivery fee,
- delivery time range,
- road distance,
- route duration.

## Image Storage

The backend uploads images to AWS S3 and stores URLs in PostgreSQL. It does not store raw image bytes in the database.

CloudFront is configured through:

```properties
aws.cloudfront.domain=...
```

Thumbnailator is included and should be used where images need resizing/compression before upload.

## Internal Jobs

Internal job endpoints are protected by:

```http
X-Internal-Secret: <app.internal-job-secret>
```

The current internal jobs:

- Daily reset for order counts.
- Payment cleanup for expired pending payments.

Use an external scheduler, cron, cloud job, or Kubernetes CronJob to call these endpoints.
