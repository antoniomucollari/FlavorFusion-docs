# API Reference

Base URL in local development is usually:

```text
http://localhost:8080
```

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

Most endpoints return the shared response wrapper:

```json
{
  "statusCode": 200,
  "message": "Message",
  "data": {},
  "meta": {}
}
```

## Public and Auth Behavior

The security filter permits some URL groups publicly, but many individual methods still require role checks through `@PreAuthorize`. Treat the role column below as the source of truth for normal client development.

## Auth

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register-customer` | Public | Register a customer. |
| `POST` | `/api/auth/login` | Public | Login for normal web users. |
| `POST` | `/api/auth/login-delivery` | Public, delivery account only | Login endpoint dedicated to delivery users. Rejects non-`DELIVERY` users. |
| `POST` | `/api/auth/register-manager` | `ADMIN` | Create manager account. |
| `POST` | `/api/auth/register-branch-manager` | `MANAGER` | Create branch manager account. |

### Register Customer

```http
POST /api/auth/register-customer
Content-Type: application/json
```

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "Password123!",
  "phoneNumber": "+355..."
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "customer@example.com",
  "password": "Password123!"
}
```

Returns a `LoginResponse` containing the JWT and user information.

## Users

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users/all` | `ADMIN`, `DELIVERY`, `MANAGER` | Filtered, paginated user list. |
| `GET` | `/api/users/branch_managers` | `MANAGER` | List branch managers with optional filters. |
| `GET` | `/api/users/change-role` | `ADMIN` | Change a user's role. |
| `PUT` | `/api/users/update` | Authenticated | Update current user's profile. Multipart. |
| `DELETE` | `/api/users/deactivate-any` | `ADMIN` | Deactivate any account by ID. |
| `DELETE` | `/api/users/deactivate-branch-managers` | `MANAGER` | Deactivate a manager-owned branch manager account. |
| `POST` | `/api/users/restore-branch-managers` | `MANAGER` | Restore a branch manager account. |
| `POST` | `/api/users/restore-users` | `ADMIN` | Restore a user account. |
| `DELETE` | `/api/users/deactivate-my-account` | Authenticated | Deactivate own account. |
| `GET` | `/api/users/account` | Authenticated | Current user's account details. |
| `PATCH` | `/api/users/change-password` | Authenticated | Change password. Also allowed when password-change is required. |

### User Filtering

`GET /api/users/all` accepts `UserFilterRequest` fields as query/model parameters and pageable values:

```http
GET /api/users/all?page=0&size=20&sort=id
```

### Update Own Account

```http
PUT /api/users/update
Content-Type: multipart/form-data
```

Form fields come from `UserDTO`. Optional file:

```text
imageFile=<profile image>
```

## Roles

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/roles` | `ADMIN` | Create role. |
| `PUT` | `/api/roles` | `ADMIN` | Update role. |
| `GET` | `/api/roles` | `ADMIN` | List roles. |
| `DELETE` | `/api/roles/{id}` | `ADMIN` | Delete role. |

## Restaurant Categories

Restaurant categories are high-level marketplace categories such as pizza, burger, dessert, etc.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/restaurant-categories` | `ADMIN` | Create restaurant category. Multipart with image. |
| `PUT` | `/api/restaurant-categories` | `ADMIN` | Update restaurant category. Multipart with optional image. |
| `GET` | `/api/restaurant-categories/{id}` | Public | Get one category. |
| `GET` | `/api/restaurant-categories` | Public | List categories. |
| `DELETE` | `/api/restaurant-categories/{id}` | `ADMIN` | Delete category. |
| `PUT` | `/api/restaurant-categories/categories` | `MANAGER` | Assign category IDs to manager's restaurant. |

### Assign Restaurant Categories

```http
PUT /api/restaurant-categories/categories
Content-Type: application/json
Authorization: Bearer <manager-jwt>
```

```json
[1, 2, 3]
```

## Menu Categories

Menu categories are restaurant-owned food categories such as burgers, drinks, sides.

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/categories` | `ADMIN`, `MANAGER` | Create menu category. |
| `PUT` | `/api/categories` | `ADMIN`, `MANAGER` | Update category. |
| `GET` | `/api/categories/{id}` | Public | Get category. |
| `GET` | `/api/categories` | Public | List simple categories. |
| `GET` | `/api/categories/manager` | `MANAGER` | List current manager restaurant categories. |
| `DELETE` | `/api/categories/{id}` | `MANAGER` | Soft-delete category. |
| `PUT` | `/api/categories/{id}/restore` | `MANAGER` | Restore category. |

## Restaurants

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/restaurants` | `ADMIN`, `MANAGER` | Create restaurant. Multipart with cover and profile images. |
| `GET` | `/api/restaurants/all-restaurants` | Public | Public paginated restaurant list. |
| `GET` | `/api/restaurants/all-restaurants-admin` | `ADMIN` | Admin paginated list, includes deleted filter. |
| `GET` | `/api/restaurants/available-restaurants-dashboard` | Public/auth optional | Dashboard groups: normal, fastest, trending, top rated. |
| `GET` | `/api/restaurants/available-restaurants` | Public/auth optional | Location-aware available restaurants with filters and sort. |
| `GET` | `/api/restaurants/search-by-restaurant/{id}` | Public | Restaurant summary by restaurant ID. |
| `GET` | `/api/restaurants/manager/restaurant-branches` | `MANAGER` | Branch list for current manager's restaurant. |
| `PUT` | `/api/restaurants/manager/change-manager/{branchId}` | `MANAGER` | Assign/unassign branch manager. Body is user ID or empty/null. |
| `DELETE` | `/api/restaurants/manager/delete-branch/{branchId}` | `MANAGER` | Soft-delete branch. |
| `PUT` | `/api/restaurants/manager/restore-branch/{branchId}` | `MANAGER` | Restore branch. |
| `GET` | `/api/restaurants/restaurant` | `MANAGER` | Current manager's restaurant. |
| `DELETE` | `/api/restaurants/admin/delete-restaurant/{restaurantId}` | `ADMIN` | Soft-delete restaurant. |
| `PUT` | `/api/restaurants/admin/restore/{restaurantId}` | `ADMIN` | Restore restaurant. |
| `PUT` | `/api/restaurants/admin/unassign-restaurant/{restaurantId}` | `ADMIN` | Unassign restaurant owner. |

### Create Restaurant

```http
POST /api/restaurants
Content-Type: multipart/form-data
Authorization: Bearer <admin-or-manager-jwt>
```

Form fields:

```text
name=<restaurant name>
description=<description>
phoneNumber=<phone>
coverImage=<file>
profileImage=<file>
```

### Available Restaurants

```http
GET /api/restaurants/available-restaurants?lat=41.3275&lng=19.8189&page=0&size=10&sort=delivery_time
```

Supported sort values in service:

```text
default
rating
prep_time
time
delivery_time
trending
popularity
```

The filter object is `RestaurantFilterCriteria` and is passed as query/model attributes.

## Restaurant Branches

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `PUT` | `/api/restaurant-branch/edit-branch/{id}` | `MANAGER` | Edit any owned branch. |
| `PUT` | `/api/restaurant-branch/edit-branch/my-branch` | `BRANCH_MANAGER` | Edit current branch manager's branch operations data. |
| `PUT` | `/api/restaurant-branch/myBranch/opening-hours` | Authenticated/currently no annotation | Save opening hours. Should be protected. |
| `POST` | `/api/restaurant-branch/branch` | `ADMIN`, `MANAGER` | Create branch. |
| `GET` | `/api/restaurant-branch/{id}` | Public | Get branch details. |
| `GET` | `/api/restaurant-branch/{branchId}/menu` | Public | Get branch menu, optional search. |
| `GET` | `/api/restaurant-branch/myBranch` | `BRANCH_MANAGER` | Current branch manager's branch. |
| `PUT` | `/api/restaurant-branch/change-opening-status` | `BRANCH_MANAGER` | Toggle current branch open/closed. |
| `GET` | `/api/restaurant-branch/location/{orderId}` | `DELIVERY` | Get branch location for assigned delivery order. |

### Save Opening Hours

```http
PUT /api/restaurant-branch/myBranch/opening-hours
Content-Type: application/json
```

```json
{
  "openingHours": [
    {
      "dayOfWeek": "MONDAY",
      "openTime": "09:00",
      "closeTime": "22:00"
    }
  ]
}
```

## Reviews

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/reviews/{branchId}` | Public | List branch reviews. |
| `POST` | `/api/reviews` | Currently public in controller | Create review. Should be authenticated/customer in production. |
| `GET` | `/api/reviews/menu-item/{menuId}` | Public | Average rating for menu item. |

## Menus

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/menu` | `MANAGER` | Create master menu item. Multipart with image. |
| `PUT` | `/api/menu` | `MANAGER` | Update master menu item. Multipart, optional image. |
| `GET` | `/api/menu/{id}` | Public | Get menu response by branch menu ID. |
| `DELETE` | `/api/menu/{id}` | `MANAGER` | Delete menu. |
| `GET` | `/api/menu` | `MANAGER` | List manager menus with optional category/search/myMenus. |
| `POST` | `/api/menu/option` | `MANAGER` | Create option group and variants for a menu. |
| `PUT` | `/api/menu/option` | `MANAGER` | Edit option group and variants. |
| `GET` | `/api/menu/options-restaurant` | `MANAGER` | Options for a restaurant menu item. |
| `GET` | `/api/menu/options-customer/{branchMenuId}/{branchId}` | Public | Customer-visible option groups with branch overrides applied. |
| `GET` | `/api/menu/options-branch-manager` | `BRANCH_MANAGER` | Branch manager option data for branch menu item. |
| `PUT` | `/api/menu/unlink` | `MANAGER` | Unlink option group from menu. |
| `PUT` | `/api/menu/link` | `MANAGER` | Link option group to menu. |
| `GET` | `/api/menu/allOptions` | `MANAGER` | All option groups for current restaurant. |
| `GET` | `/api/menu/available-options` | `MANAGER` | Available option groups for linking to a menu. |
| `DELETE` | `/api/menu/options` | `MANAGER`, `BRANCH_MANAGER` | Delete option group/option config depending service logic. |
| `PUT` | `/api/menu/option-branch` | `BRANCH_MANAGER` | Override branch variant config. |

### Create Menu Item

```http
POST /api/menu
Content-Type: multipart/form-data
Authorization: Bearer <manager-jwt>
```

Fields come from `CreateMenuRequest`, plus:

```text
imageFile=<file>
```

### Create Option Group

```http
POST /api/menu/option?menuId=10
Content-Type: application/json
Authorization: Bearer <manager-jwt>
```

```json
{
  "name": "Choose sauce",
  "minSelection": 0,
  "maxSelection": 2,
  "variants": [
    { "name": "Garlic sauce", "recommendedPrice": 50 },
    { "name": "Spicy sauce", "recommendedPrice": 60 }
  ]
}
```

### Branch Option Override

```http
PUT /api/menu/option-branch?optionId=15
Content-Type: application/json
Authorization: Bearer <branch-manager-jwt>
```

```json
[
  {
    "variantId": 101,
    "priceOverride": 80,
    "isAvailable": true
  },
  {
    "variantId": 102,
    "priceOverride": null,
    "isAvailable": false
  }
]
```

## Branch Manager Menu

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/branch-manager/menu` | `BRANCH_MANAGER` | Paginated branch menu items. |
| `POST` | `/api/branch-manager/menu` | `BRANCH_MANAGER` | Add/inherit a restaurant menu item to branch. |
| `GET` | `/api/branch-manager/menu/restaurant` | `BRANCH_MANAGER` | List simple restaurant master menus. |
| `PUT` | `/api/branch-manager/menu` | `BRANCH_MANAGER` | Update branch menu price, availability, highlighted. |

### Update Branch Menu Item

```http
PUT /api/branch-manager/menu
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <branch-manager-jwt>
```

```text
id=44
price=550
available=true
highlighted=false
```

## Cart

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/cart/basket` | `CUSTOMER` | Add item to cart. |
| `GET` | `/api/cart/basket/{branchId}` | `CUSTOMER` | Get cart for branch. |
| `POST` | `/api/cart/basket/increment/{cartItemId}` | `CUSTOMER` | Increase quantity. |
| `POST` | `/api/cart/basket/decrement/{cartItemId}` | `CUSTOMER` | Decrease quantity. Removes item at zero. |
| `DELETE` | `/api/cart/basket/remove/{cartItemId}` | `CUSTOMER` | Remove item. |
| `DELETE` | `/api/cart/basket/clear/{branchId}` | `CUSTOMER` | Clear branch cart. |
| `PUT` | `/api/cart/orderAgain/{orderId}` | `CUSTOMER` | Rebuild cart from previous order. |

### Add Item to Cart

Use `branchMenuItemId`, not `menuId`.

```http
POST /api/cart/basket
Content-Type: application/json
Authorization: Bearer <customer-jwt>
```

```json
{
  "branchMenuItemId": 44,
  "quantity": 2,
  "options": [
    {
      "optionGroupId": 7,
      "variantIds": [21, 22]
    }
  ]
}
```

## Checkout

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/checkout/{branchId}` | `CUSTOMER` | Checkout preview with totals, delivery info, tips, selected method. |
| `POST` | `/api/checkout/increment/{cartItemId}` | `CUSTOMER` | Increment and return checkout preview. |
| `POST` | `/api/checkout/decrement/{cartItemId}` | `CUSTOMER` | Decrement and return checkout preview. |
| `PUT` | `/api/checkout/tip/{cartId}` | `CUSTOMER` | Update tip. |
| `PUT` | `/api/checkout/delivery-note/{cartId}` | `CUSTOMER` | Update delivery note. |
| `PUT` | `/api/checkout/payment-method` | `CUSTOMER` | Update cart payment method. |

### Update Tip

```json
{
  "amount": 100
}
```

### Update Delivery Note

```json
{
  "note": "Call me when outside."
}
```

### Update Payment Method

```json
{
  "paymentMethodId": 3,
  "branchId": 12
}
```

## Orders

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/orders/checkout/{branchId}` | `CUSTOMER` | Place order from cart. |
| `GET` | `/api/orders/order-item/{orderItemId}` | Authenticated/public by filter config | Get order item details. |
| `GET` | `/api/orders/all` | Authenticated | Paginated, role-scoped orders. |
| `PUT` | `/api/orders/update-status` | Authenticated | Update one order status or payment status. |
| `PUT` | `/api/orders/assign-order-delivery/{orderId}` | `DELIVERY` | Assign current driver to order. |
| `GET` | `/api/orders/unique-customers` | `ADMIN`, `MANAGER` | Customer statistics. |
| `GET` | `/api/orders/stats/total-orders` | `ADMIN`, `DELIVERY` | Total order statistics. |
| `GET` | `/api/orders/stats/total-revenue` | `ADMIN` | Total revenue statistics. |
| `GET` | `/api/orders/stats/status-distribution` | `ADMIN` | Count by order status. |
| `GET` | `/api/orders/unassigned-orders` | `DELIVERY` | Global delivery pool. |
| `GET` | `/api/orders/order-details/{orderId}` | `CUSTOMER` | Customer order details. |

### Search Orders

```http
GET /api/orders/all?page=0&size=20&orderStatus=READY_FOR_PICKUP&sortBy=lastUpdated&sortDirection=desc
```

`OrderSearchCriteria` supports filters such as:

- `orderId`
- `orderStatus`
- `paymentStatus`
- `customerId`
- `page`
- `size`
- `sortBy`
- `sortDirection`

Role scoping is applied in service:

- Customer sees own orders.
- Manager sees own restaurant.
- Branch manager sees own branch.
- Delivery sees assigned delivery orders.
- Admin can see all.

### Update Order Status

Only update one status field at a time.

```http
PUT /api/orders/update-status
Content-Type: application/json
Authorization: Bearer <jwt>
```

```json
{
  "id": 9001,
  "orderStatus": "PREPARING"
}
```

or:

```json
{
  "id": 9001,
  "paymentStatus": "COMPLETED"
}
```

## Payments

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/payment` | `ADMIN` | List system payment methods. |
| `PUT` | `/api/payment/{paymentMethodId}` | `ADMIN` | Edit payment method display name. |
| `GET` | `/api/payment/restaurant-branch` | `BRANCH_MANAGER` | Branch payment method config. |
| `PUT` | `/api/payment/my-branch/update-methods` | Authenticated but should be `BRANCH_MANAGER` | Update current branch accepted payment methods. |
| `GET` | `/api/payment/check-payment-successful` | Authenticated | Check payment status by transaction ID. |
| `POST` | `/api/payment/{paymentId}/refund` | `BRANCH_MANAGER` | Refund payment with JSON reason object. |
| `GET` | `/api/payment/all` | Authenticated | Paginated, role-scoped payment list. |
| `POST` | `/api/payment/ask-for-refund/{orderId}` | `CUSTOMER` | Customer asks for refund after cancellation. |
| `POST` | `/api/payment/refund/{paymentId}` | `BRANCH_MANAGER` | Duplicate refund endpoint taking raw string reason. |

### Branch Payment Methods

```http
PUT /api/payment/my-branch/update-methods
Content-Type: application/json
Authorization: Bearer <branch-manager-jwt>
```

```json
{
  "paymentMethodIds": [1, 3]
}
```

### Check Payment Status

```http
GET /api/payment/check-payment-successful?transactionId=sdk-order-id
Authorization: Bearer <customer-jwt>
```

Returns:

```json
{
  "transactionId": "sdk-order-id",
  "paymentStatus": "COMPLETED"
}
```

### PokPay Webhook

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/payments/webhook` | Public | PokPay webhook receiver. |

The webhook body maps to `PokWebhookPayload`. The backend finds the order by transaction ID and marks payment/order state.

## Delivery Locations and Live Driver Location

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/delivery-location/deliverTo` | Authenticated | Save/select a customer delivery address. |
| `DELETE` | `/api/delivery-location/deliveryLocation/{id}` | Authenticated | Delete saved delivery location. |
| `GET` | `/api/delivery-location/deliveryLocation` | Authenticated | Get active delivery location. |
| `GET` | `/api/delivery-location/all-delivery-locations` | Authenticated | List current user's delivery locations. |
| `POST` | `/api/delivery-location/location` | Authenticated, intended `DELIVERY` | Kotlin delivery app submits current driver coordinates. |

### Save Delivery Address

```http
POST /api/delivery-location/deliverTo?latitude=41.3275&longitude=19.8189&locationName=Tirana&nickname=Home
Authorization: Bearer <customer-jwt>
```

Optional:

```text
prevLocationId=<id>
```

### Submit Driver Live Location

```http
POST /api/delivery-location/location
Content-Type: application/json
Authorization: Bearer <delivery-jwt>
```

```json
{
  "latitude": 41.3275,
  "longitude": 19.8189
}
```

Backend behavior:

- Reads current authenticated user ID.
- Serializes payload as JSON.
- Stores in Redis key `driver_loc:{driverId}`.
- TTL is one hour.

## Analytics

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/analytics` | `MANAGER` | Branch revenue list. |
| `GET` | `/api/analytics/total-revenue` | `MANAGER` | Manager total revenue. |
| `GET` | `/api/analytics/successful-orders` | `MANAGER` | Manager successful orders. |
| `GET` | `/api/analytics/unique-customer-metrics` | `ADMIN`, `MANAGER`, `BRANCH_MANAGER` | Unique customer metrics. |
| `GET` | `/api/analytics/popular-items` | Authenticated by global rule, no method annotation | Most popular items with role filter. |
| `GET` | `/api/analytics/revenue/monthly` | `ADMIN`, `MANAGER`, `BRANCH_MANAGER` | Monthly revenue for year. |
| `GET` | `/api/analytics/revenue/daily` | `ADMIN`, `MANAGER`, `BRANCH_MANAGER` | Daily revenue for month/year. |
| `GET` | `/api/analytics/underPrepare/delivery` | `DELIVERY` | Count assigned preparation orders. |
| `GET` | `/api/analytics/earnings` | `DELIVERY`, `ADMIN` | Delivery earnings by year, optional delivery ID. |

### Monthly Revenue

```http
GET /api/analytics/revenue/monthly?year=2026&targetBranchId=12
Authorization: Bearer <jwt>
```

Role scoping:

- Admin can pass branch or restaurant filters.
- Manager is forced to own restaurant.
- Branch manager is forced to own branch.
- Delivery cannot access restaurant analytics except delivery-specific endpoints.

## Upload

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/upload` | Public by security config | Test/direct S3 upload endpoint. |

```http
POST /api/upload
Content-Type: multipart/form-data
```

```text
file=<file>
keyName=<s3 key>
```

For production, protect or remove this test endpoint.

## Internal Jobs

These endpoints also require normal authentication unless explicitly permitted by configuration, and they require the internal header.

| Method | Path | Required header | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/internal/jobs/daily-reset-order-count` | `X-Internal-Secret` | Reset daily branch order counts. |
| `POST` | `/api/internal/jobs/payment-cleanup` | `X-Internal-Secret` | Expire pending payments and abandon old orders. |

Example:

```http
POST /api/internal/jobs/payment-cleanup
X-Internal-Secret: <secret>
```

## Health

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Health check. |

Returns:

```text
OK
```

## WebSocket

Endpoint:

```text
/ws
```

STOMP `CONNECT` header:

```text
Authorization: Bearer <jwt>
```

Subscribe:

```text
/topic/branch.{branchId}.manager
/topic/delivery.global.unassigned
/user/queue/updates
```

Payloads are mostly `OrderDTO`. Delivery global updates include:

```json
{
  "wsAction": "ADD"
}
```

or:

```json
{
  "wsAction": "REMOVE"
}
```
