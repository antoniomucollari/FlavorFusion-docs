# Business Flows

## Customer Discovery Flow

Endpoint:

```http
GET /api/restaurants/available-restaurants
GET /api/restaurants/available-restaurants-dashboard
```

Flow:

1. The backend resolves user coordinates from request `lat`/`lng` or from the authenticated user's active delivery location.
2. Redis GEO key `restaurant:locations` finds nearby branch IDs within the system max radius of 8 km.
3. If no nearby branches exist, the endpoint returns an empty page quickly.
4. `RestaurantQueryCacheService` queries restaurants using dynamic sorting.
5. Branches are filtered to active, open, manager-assigned branches inside the Redis candidate set.
6. `RestaurantDtoMapper` calls `PricingService` to calculate delivery info.
7. Only deliverable branches are included.
8. If a restaurant has more than one deliverable branch, the best branch is selected based on sort.

Dashboard endpoint behavior:

- Always fetches `normal`.
- Only fetches `topRated`, `fastest`, and `trending` when the initial normal response contains at least 10 branch entries.

Sort values:

```text
default
rating
prep_time
time
delivery_time
trending
popularity
```

![Restaurant discovery flow](https://cdn.antoniomucollari.com/foodAppDocs/finding_available_restaurantsBasicFlow.png)

## Delivery Pricing and Time Flow

Source:

```text
PricingService
DistanceRoutingManager
GoogleDistanceMatrixService
OpenRouteDistanceMatrixService
```

Inputs:

- branch coordinates,
- user coordinates,
- branch average preparation time,
- branch delivery radius,
- routing provider.

Deliverability requires:

- branch is not closed,
- a valid route exists,
- road distance is within `branch.deliveryRadiusInKm`.

Delivery price tiers:

| Road distance | Delivery price |
| --- | --- |
| `<= 1.5 km` | `80` |
| `<= 3.0 km` | `150` |
| `<= 5.0 km` | `200` |
| `> 5.0 km` | `300` |

Delivery time:

```text
avg prep time + route travel time + 5-10 minute courier buffer
```

The result is rounded to the nearest 5 minutes and formatted like:

```text
25-30 min
```

## Menu Management Flow

The backend separates restaurant-level menu definition from branch-level selling configuration.

Manager creates:

- master menu item (`Menu`),
- menu category (`Category`),
- option groups (`OptionGroup`),
- option variants (`OptionVariant`).

Branch manager controls:

- branch-specific menu item price,
- branch-specific availability,
- branch-specific highlighted flag,
- branch-specific option variant overrides through `BranchOptionConfig`.

This means the same master item can be sold differently by each branch.

Example:

```text
Restaurant: Tony Pizza
Master menu: Pepperoni Pizza
Branch A: price 900, available true
Branch B: price 980, available false
```

Option example:

```text
Option group: Choose sauce
minSelection: 0
maxSelection: 2
Variant: Garlic sauce, recommendedPrice: 50
Branch override: Blloku branch, Garlic sauce, priceOverride: 80, isAvailable: true
```

## Cart Flow

Endpoint group:

```text
/api/cart
```

Add-to-cart steps:

1. Validate option selections against `minSelection` and `maxSelection`.
2. Load the `BranchMenuItem`.
3. Reject unavailable branch menu item.
4. Get or create the customer's cart for that branch.
5. Load effective prices for selected variants, including branch overrides.
6. Calculate final `pricePerUnit`.
7. If an identical cart line already exists with the same branch menu item and same selected variants, increment its quantity.
8. Otherwise create a new cart item and variant joins.
9. Return a rebuilt cart view.

Important rule:

```text
Customers add branchMenuItemId, not menuId.
```

That is required because real price and availability live on `BranchMenuItem`.

## Checkout Preview Flow

Endpoint group:

```text
/api/checkout
```

Checkout preview:

1. Load current user.
2. Load branch cart.
3. Resolve selected payment method:
   - cart selected method if present,
   - otherwise user's last selected payment method,
   - otherwise branch-supported fallback.
4. Build order quote:
   - subtotal,
   - service fee,
   - tip,
   - delivery fee,
   - total,
   - delivery time/distance.
5. Validate delivery zone.
6. Validate branch is open.
7. Validate minimum order amount.
8. Return checkout DTO.

Service fee rule:

```text
5% of subtotal, capped at 150
```

Additional zone rule:

```text
checkout blocks if actual route exceeds branch radius after applying current tolerance logic
```

## Place Order Flow

Endpoint:

```http
POST /api/orders/checkout/{branchId}
```

Flow:

1. Load current customer.
2. Load active customer delivery location.
3. Load cart for branch.
4. Check for existing pending PokPay order for same customer and branch.
5. If existing order has same `cartHash` and latest payment link is still valid, return the same payment URL.
6. If same cart but payment expired, mark old payment expired and generate a new PokPay link.
7. If cart changed, mark old order `FAILED` and payment `ABANDONED`, then continue.
8. Validate item and variant availability.
9. Build order quote using checkout service.
10. Create order, order items, variant snapshots, delivery address snapshot, totals, driver earnings, and `cartHash`.
11. If payment method is `POK`, create PokPay SDK order and return payment URL.
12. If payment method is not `POK`, clear cart, publish order event, increment daily branch order count, return order.

Driver earnings rule:

```text
if deliveryPrice <= 80: driver receives deliveryPrice
else: driver receives 50% of deliveryPrice
driver also receives the full tip
```

## PokPay Payment Flow

Payment creation:

1. Backend logs in to PokPay using `keyId` and `keySecret`.
2. Backend creates SDK order under `merchantId`.
3. Backend stores:
   - transaction ID,
   - payment URL,
   - created date,
   - expiry,
   - amount,
   - gateway `POK`,
   - payment status `PENDING_PAYMENT`.
4. Client redirects user to PokPay confirmation URL.

Webhook:

```http
POST /api/v1/payments/webhook
```

Webhook processing:

1. Find order by payment transaction ID.
2. If order already has `COMPLETED` payment status, return immediately. This makes the webhook idempotent.
3. If order was marked `FAILED` by cleanup but payment arrives late, set order status back to `INITIALIZED`.
4. Set order and payment status to `COMPLETED`.
5. Clear customer cart for the branch.
6. Increment branch daily order count.
7. Publish `OrderSavedEvent` for WebSocket dashboards.

Payment cleanup:

```http
POST /api/internal/jobs/payment-cleanup
```

This marks expired payments and abandoned orders through repository update queries.

## Order Status Flow

Current order statuses:

```text
INITIALIZED
CONFIRMED
PREPARING
READY_FOR_PICKUP
ON_THE_WAY
DELIVERED
CANCELLED
FAILED
```

The controller accepts a partial `OrderDTO` with either `orderStatus` or `paymentStatus`. It rejects requests that send both or neither.

### Delivery Driver Transitions

Delivery users can set:

```text
ON_THE_WAY
DELIVERED
FAILED
```

Valid transitions:

| From | To |
| --- | --- |
| `READY_FOR_PICKUP` | `ON_THE_WAY` |
| `ON_THE_WAY` | `DELIVERED` |
| `ON_THE_WAY` | `FAILED` |

If the order is unassigned and a delivery user updates it, the processor can assign the current driver. If already assigned to another driver, it rejects the update.

Delivery users can update payment status only for non-POK payments, and only to:

```text
COMPLETED
FAILED
```

### Customer Transitions

Customers can only request:

```text
CANCELLED
```

The order must belong to that customer. Customers cannot change payment status.

If cancellation happens while payment is incomplete, the backend sets payment status to:

```text
CANCELED
```

and updates incomplete payment rows too.

### Branch Manager and Manager Updates

Branch manager:

- must manage the order's branch.

Manager:

- must own the order's restaurant.

The current validator enforces ownership but does not restrict branch manager/manager target statuses as tightly as delivery transitions. If stricter production state-machine rules are needed, extend `OrderStatusValidator`.

![Order flow machine](https://cdn.antoniomucollari.com/foodAppDocs/order_state_machine.png)
## Delivery Assignment Flow

Endpoint:

```http
GET /api/orders/unassigned-orders
PUT /api/orders/assign-order-delivery/{orderId}
```

Unassigned pool includes orders where:

- `deliveryPerson` is null,
- status is one of:

```text
CONFIRMED
PREPARING
READY_FOR_PICKUP
```

When a driver accepts:

1. Backend verifies role `DELIVERY`.
2. Backend rejects if order is already assigned.
3. Backend sets `deliveryPerson` to current driver.
4. Backend saves order.

The WebSocket event system removes the order from other drivers' global pool when an order transitions out of unassigned criteria.

## WebSocket Order Update Flow

Source event:

```text
OrderSavedEvent
```

Published when:

- order status changes,
- non-POK order is placed,
- PokPay webhook confirms payment.

Handler:

```text
WebSocketController.handleOrderSaveEvent
```

Broadcasts:

1. Branch dashboard:

```text
/topic/branch.{branchId}.manager
```

2. Delivery global unassigned pool:

```text
/topic/delivery.global.unassigned
```

with `wsAction`:

```text
ADD
REMOVE
```

3. Personal driver queue:

```text
/user/queue/updates
```

## Live Driver Location Flow

Endpoint:

```http
POST /api/delivery-location/location
```

Payload:

```json
{
  "latitude": 41.3275,
  "longitude": 19.8189
}
```

Flow:

1. Kotlin delivery app authenticates as delivery user.
2. App sends current coordinates.
3. Backend gets current user ID.
4. Backend writes payload to Redis:

```text
driver_loc:{driverId}
```

5. TTL is one hour.

Current limitation:

- There is no completed endpoint that reads these Redis keys for customer/admin frontend display.
- `LocationSubscriber` exists for Redis pub/sub topic `driver_locations`, but the write endpoint currently uses Redis `SET`, not `PUBLISH`.
- `LocationSubscriber` currently attempts `messagingTemplate.convertAndSend(location)` without a destination, so it needs completion before use.

Recommended next design:

1. Keep `driver_loc:{driverId}` as latest-position cache.
2. Add `GET /api/delivery-location/driver/{driverId}` for authorized admin/customer/order tracking.
3. Publish to `/topic/orders.{orderId}.driver-location` or `/user/queue/driver-location` when a driver with active order updates location.
4. Include authorization checks so customers can only see the driver for their active order.

## Refund Flow

Customer refund request:

```http
POST /api/payment/ask-for-refund/{orderId}
```

Rules:

- Cash on delivery cannot request refund.
- Order must be `CANCELLED`.
- Order must belong to customer.
- Order payment and completed payment row become `TO_REFUND`.

Branch manager refund:

```http
POST /api/payment/{paymentId}/refund
POST /api/payment/refund/{paymentId}
```

Rules:

- Role-scoped to branch/restaurant ownership.
- Delivery drivers are forbidden.
- Calls PokPay refund API.
- Marks payment and order payment status `REFUNDED`.

There are currently two branch-manager refund endpoints. Keep one canonical endpoint later.

## Analytics Flow

Analytics endpoints build a role-scoped filter:

- Admin can request target branch or target restaurant.
- Manager is forced to their restaurant.
- Branch manager is forced to their branch.
- Delivery is denied restaurant analytics but can access delivery-specific counts and earnings.

Metrics include:

- branch revenue,
- total revenue,
- successful orders,
- unique customers,
- popular items,
- monthly revenue,
- daily revenue,
- assigned preparation order count for delivery,
- delivery earnings.
