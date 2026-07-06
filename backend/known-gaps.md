# Known Gaps and Next Steps

This page is intentionally honest. These are the backend and product areas that are incomplete, risky, duplicated, or worth cleaning before treating the system like a real production food delivery platform.

## Highest Priority

### 1. Live Driver Location Display Is Not Finished

Current implemented part:

- Kotlin delivery app can call:

```http
POST /api/delivery-location/location
```

- Backend stores:

```text
driver_loc:{driverId}
```

- TTL is one hour.

Missing:

- Frontend display for admin, branch manager, customer, or dispatcher.
- Endpoint to read a driver's latest location.
- WebSocket topic for live location updates.
- Authorization rules tying a customer to only the driver assigned to their active order.
- Location history policy.

Recommended implementation:

```http
GET /api/delivery-location/driver/{driverId}
GET /api/orders/{orderId}/driver-location
```

and WebSocket:

```text
/topic/orders.{orderId}.driver-location
```

Only allow:

- assigned delivery driver to publish own location,
- customer to read location only for their active order,
- branch manager to read location only for orders from their branch,
- manager to read location only for their restaurant,
- admin to read all.

### 2. Location Pub/Sub Class Is Incomplete

`LocationSubscriber` subscribes to Redis topic:

```text
driver_locations
```

But the live location endpoint currently writes with Redis `SET`, not `PUBLISH`.

Also, `LocationSubscriber` calls:

```java
messagingTemplate.convertAndSend(location);
```

That method usage needs a destination. It should become something like:

```java
messagingTemplate.convertAndSend(
    "/topic/orders." + orderId + ".driver-location",
    location
);
```

The payload also needs driver ID and probably order ID. Current `LocationPayload` only contains latitude and longitude.

### 3. Add a Real Order State Machine

Current status validation is strict for delivery drivers, but looser for managers and branch managers.

Recommended explicit transitions:

| Actor | From | To |
| --- | --- | --- |
| Customer | `INITIALIZED` / payment pending | `CANCELLED` |
| PokPay webhook | any pending payment state | payment `COMPLETED` |
| Branch manager | `CONFIRMED` | `PREPARING` |
| Branch manager | `PREPARING` | `READY_FOR_PICKUP` |
| Delivery | `READY_FOR_PICKUP` | `ON_THE_WAY` |
| Delivery | `ON_THE_WAY` | `DELIVERED` |
| Delivery | `ON_THE_WAY` | `FAILED` |
| System cleanup | stale payment | `FAILED` / `ABANDONED` |

Also decide what `INITIALIZED` versus `CONFIRMED` means after PokPay completion. The current webhook marks payment completed but does not clearly move order to `CONFIRMED` in the code shown.

## Security and Access Control Cleanup

### 4. Public URL Patterns Are Too Broad

The security filter permits entire groups:

```text
/api/menu/**
/api/restaurant-branch/**
/api/roles/**
/api/restaurant-categories/**
```

Many methods are still protected by `@PreAuthorize`, but public URL rules can create accidental exposure if a future method forgets method-level security.

Recommendation:

- Keep only truly public GET endpoints public.
- Require authentication by default.
- Use method-level security for role-specific actions.

### 5. Protect Test Upload Endpoint

Current:

```http
POST /api/upload
```

This is public by security config. It can upload arbitrary files to S3 if credentials are configured.

Recommendation:

- Remove it,
- or restrict to `ADMIN`,
- or keep only in `dev` profile.

### 6. Add Missing Role Annotations

Review these endpoints:

```http
PUT /api/payment/my-branch/update-methods
POST /api/delivery-location/location
PUT /api/restaurant-branch/myBranch/opening-hours
POST /api/reviews
GET /api/analytics/popular-items
```

Some are protected by global authenticated rule, but they should have clear method-level annotations.

Recommended:

```java
@PreAuthorize("hasAuthority('BRANCH_MANAGER')")
```

for branch payment methods and opening hours.

```java
@PreAuthorize("hasAuthority('DELIVERY')")
```

for live driver location submission.

```java
@PreAuthorize("hasAuthority('CUSTOMER')")
```

for review creation unless anonymous reviews are intentionally supported.

### 7. Verify PokPay Webhook Authenticity

The webhook endpoint accepts payloads publicly. That is normal for payment providers, but production should verify a signature, secret, or provider authenticity mechanism if PokPay supports one.

## Data and Schema Cleanup

### 8. Add Database Migrations

Current config uses:

```properties
spring.jpa.hibernate.ddl-auto=update
```

That is convenient while building, but risky for production.

Recommendation:

- Add Flyway or Liquibase.
- Convert current schema to a baseline migration.
- Track future schema changes explicitly.

### 9. Fix Typo and Naming Issues

Examples:

```properties
secreteJwtString
pok.expiersAfterMinutes
fonntend.base.url
```

Keep backward compatibility temporarily if already deployed, but add correctly named replacements.

### 10. Branch Payment Join Column Looks Suspicious

In `RestaurantBranch.paymentMethods`, the inverse join column is:

```java
@JoinColumn(name = "payment_   method_id")
```

There are spaces in the name. Verify the actual database schema. This may create an awkward column name or mismatch existing data.

### 11. DeliveryLocation Table Name Contains Hyphen

Current table:

```java
@Table(name = "delivery-location")
```

A hyphenated SQL table name can require quoting and can be annoying in manual queries. Consider renaming to:

```text
delivery_locations
```

with a migration.

## API Cleanup

### 12. Duplicate Refund Endpoints

Current:

```http
POST /api/payment/{paymentId}/refund
POST /api/payment/refund/{paymentId}
```

They both refund through PokPay but use different request body shapes.

Recommendation:

Keep one canonical endpoint:

```http
POST /api/payment/{paymentId}/refund
```

with:

```json
{
  "reason": "Customer cancelled before preparation"
}
```

### 13. Standardize Endpoint Naming

Examples:

```text
branch_managers
myBranch
all-restaurants-admin
orderAgain
underPrepare/delivery
deliveryLocation
```

Recommendation:

- Use kebab-case in URLs.
- Use plural nouns for collections.
- Use verbs only for actions.

Example cleanup:

```text
/api/users/branch-managers
/api/restaurant-branch/my-branch
/api/cart/order-again/{orderId}
/api/analytics/delivery/preparing-count
```

### 14. Add OpenAPI

The endpoint reference in these docs is manually written from code. For a scaling project, add:

- springdoc-openapi,
- generated Swagger UI,
- API schema examples,
- frontend/client typing if possible.

## Feature Gaps

### 15. Promo Codes Are Not Implemented

`Cart.promoCode` exists with TODO. There is no complete promotion domain.

Needed:

- promo code entity,
- discount type,
- validity dates,
- max uses,
- branch/restaurant scope,
- minimum spend,
- checkout validation,
- order snapshot.

### 16. Automatic Opening Hours Enforcement

Opening hours exist and branch closed status exists, but branch availability still relies heavily on manual state.

Needed:

- scheduled recalculation,
- timezone strategy,
- holiday/special hours,
- override mode for manual emergency closure.

### 17. Restaurant Verification Is Not Complete

`VerificationStatus` exists on `User`, and restaurants have admin/manager operations, but a complete restaurant onboarding/verification workflow is not fully documented or visible from the current controllers.

Needed:

- verification endpoint,
- document upload if required,
- admin approval/rejection,
- frontend status display.

### 18. Delivery Dispatch Is Manual

Current flow:

- drivers see unassigned orders,
- drivers accept orders.

Missing for larger scale:

- dispatch assignment rules,
- driver availability state,
- driver capacity,
- nearest-driver matching,
- batching/multi-order delivery,
- timeout/reassignment.

### 19. Customer Tracking Page

Needed:

- order status timeline,
- estimated delivery time updates,
- driver location,
- branch location,
- support/cancel/refund actions by status.

### 20. Notifications Need a Full Strategy

Notification entities/services exist, and email templates exist, but a full notification plan should include:

- email,
- in-app notifications,
- push notifications for Kotlin app,
- WebSocket notification events,
- retry and failure handling.

## Performance and Scaling Notes

### 21. Rebuild Redis GEO Index

If Redis is flushed or restarted, `restaurant:locations` may be empty until branches are saved again.

Add a startup or admin rebuild:

```text
load active branches from PostgreSQL -> write GEO members to Redis
```

### 22. Cache Invalidation Needs Review

Branch menu cache has explicit eviction, but discovery cache invalidation should be reviewed for:

- branch open/closed changes,
- delivery radius changes,
- branch manager assignment,
- menu availability,
- daily trending changes,
- restaurant category changes.

Short TTL helps, but explicit eviction improves freshness.

### 23. Bulk Routing Provider Coverage

Google provider's `calculateBulk` currently returns an empty map.

That is fine if bulk is always intended for ORS, but document/enforce provider choices so discovery does not silently use an empty Google bulk result.

## Testing Gaps

Existing visible tests:

- Spring context test.
- Cart service test.

Recommended test coverage:

- order status transitions by role,
- PokPay webhook idempotency,
- expired payment cleanup,
- cart option validation,
- branch option override pricing,
- checkout delivery zone failures,
- restaurant discovery cache behavior,
- delivery assignment conflict,
- live driver location authorization,
- refund permission checks,
- security tests for sensitive endpoints.

## Suggested Next Implementation Order

1. Secure the risky endpoints and remove/protect test upload.
2. Finish delivery live location read/display and WebSocket publishing.
3. Add strict order state machine for manager and branch manager transitions.
4. Add database migrations.
5. Add OpenAPI generation.
6. Add Redis GEO rebuild job.
7. Add tests for order/payment/cart/security.
8. Clean duplicate refund and naming inconsistencies.
9. Build customer order tracking page and admin/branch driver tracking display.
