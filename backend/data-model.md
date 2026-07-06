# Data Model

This document explains the core database model. The backend uses JPA entities and PostgreSQL. Branch coordinates use PostGIS-compatible geography points.
![Backend data model ERD](https://cdn.antoniomucollari.com/foodAppDocs/database.png)
## Users and Roles

### `User`

Table:

```text
users
```

Important fields:

| Field | Meaning |
| --- | --- |
| `id` | Primary key. |
| `name`, `email`, `password` | Core identity fields. Email is unique. Password is hashed. |
| `phoneNumber`, `profileUrl`, `address` | Profile information. |
| `isActive` | Account activation flag. Inactive users are blocked by `AuthFilter`. |
| `roles` | Many-to-many relation through `users_roles`. |
| `deliveryLocation` | Current active delivery location. |
| `restaurant` | One-to-one restaurant owned by a manager. |
| `managedBranch` | Branch assigned to a branch manager. |
| `lastSelectedPaymentMethod` | Last used payment method for checkout defaults. |
| `requirePasswordChange` | Forces created users to change password before using app. |
| `createdByCompany` | Tracks who created a company-owned/managed account. |
| `tokenVersion` | Used to invalidate old JWTs. |

### `Role`

Roles are enum-backed through `RoleName`:

```text
ADMIN
DELIVERY
MANAGER
CUSTOMER
BRANCH_MANAGER
```

## Restaurant Structure

### `Restaurant`

Table:

```text
restaurant
```

Represents a brand/company, not a physical store.

Important fields:

- `name`
- `description`
- `coverImageUrl`
- `profileImageUrl`
- `phoneNumber`
- `isPromoted`
- `isDeleted`
- `owner`
- `categories`
- `createdAt`

### `RestaurantBranch`

Table:

```text
restaurant_locations
```

Represents a physical branch.

Important fields:

| Field | Meaning |
| --- | --- |
| `address` | Human-readable branch address. |
| `location` | PostGIS `geography(Point,4326)`. |
| `phoneNumber` | Branch contact. |
| `isActive` | Whether branch is active in system. |
| `restaurant` | Parent restaurant. |
| `openingHours` | Weekly opening hours. |
| `availableItems` | Branch-specific menu items. |
| `deliveryRadiusInKm` | Maximum delivery radius. Current annotation max is `8`. |
| `isClosed` | Manual/current closed flag. |
| `minOrderAmount` | Minimum subtotal for checkout. |
| `avgPrepTimeInMinutes` | Preparation time used in delivery estimate. |
| `averageRating`, `reviewCount` | Denormalized review stats. |
| `paymentMethods` | Accepted branch payment methods. |
| `manager` | Assigned branch manager user. |
| `deleted` | Soft-delete flag. |
| `dailyOrderCount` | Used for trending logic and reset job. |

The `RestaurantBranchListener` updates Redis GEO key `restaurant:locations` after branch saves and removes branch IDs after branch deletes.

### `OpeningHour`

Table:

```text
opening_hours
```

Fields:

- `dayOfWeek`
- `openTime`
- `closeTime`
- `branch`

## Menus, Options, and Branch Customization

The menu model is deliberately two-level so the app can scale to restaurants with many branches.

### `Menu`

Table:

```text
menus
```

This is a master menu item created by a restaurant manager.

Fields:

- `name`
- `description`
- `imageUrl`
- `category`
- `optionGroups`

The master item does not hold branch-specific price or availability.

### `BranchMenuItem`

Table:

```text
branch_menu_items
```

This joins a master menu item to a branch.

Fields:

| Field | Meaning |
| --- | --- |
| `branch` | Physical branch. |
| `menu` | Master menu item. |
| `price` | Branch-specific price. |
| `isHighlighted` | Branch-specific promotion/highlight toggle. |
| `isAvailable` | Branch-specific sold-out toggle. |

Customers add `BranchMenuItem.id` to the cart, not `Menu.id`, because price and availability belong to the branch.

### `OptionGroup`

Represents a group of choices for a menu item.

Example:

```text
Choose sauce
```

Fields:

- `name`
- `minSelection`
- `maxSelection`
- `variants`
- `isDeleted`
- `restaurant`

### `OptionVariant`

Represents one selectable option inside a group.

Example:

```text
Garlic sauce
```

Fields:

- `name`
- `recommendedPrice`
- `group`
- `isDeleted`

### `BranchOptionConfig`

Represents branch-level override for an option variant.

Fields:

- `branch`
- `variant`
- `priceOverride`
- `isAvailable`

Database business rule:

```text
(branch_id, variant_id) must be unique
```

That prevents duplicate override rows such as "Blloku branch + Garlic sauce" twice.

## Cart Model

### `Cart`

Table:

```text
carts
```

Fields:

- `user`
- `cartItems`
- `restaurantBranch`
- `tipAmount`
- `deliveryNote`
- `selectedPaymentMethod`
- `promoCode` TODO

A cart is branch-specific. The current repository lookup is by user and branch.

### `CartItem`

Table:

```text
cart_items
```

Fields:

- `cart`
- `branchMenuItem`
- `quantity`
- `pricePerUnit`
- `subTotal`
- `cartItemVariants`

`pricePerUnit` includes the branch item price plus selected variant effective prices at the time the item was added.

### `CartItemVariant`

Stores selected option variants for a cart item.

## Order Model

### `Order`

Table:

```text
orders
```

Important fields:

| Field | Meaning |
| --- | --- |
| `user` | Customer. |
| `deliveryPerson` | Assigned delivery user. |
| `orderStatus` | Current order state. |
| `paymentStatus` | Current payment state. |
| `payment` | Payment attempts/records. |
| `orderItems` | Snapshot of purchased items. |
| `totalAmount`, `serviceFee`, `tipAmount`, `subtotal`, `deliveryPrice` | Monetary values. |
| `distanceInMeters` | Route distance at checkout/order time. |
| `estAvgDeliveryTimeInMinutes` | Estimated average delivery time. |
| `actualDeliveryTime` | Delivery duration after completion. |
| `actualDeliveryDate` | Set when delivery starts. |
| `pickedUpAt` | Timestamp field exists; current code sets it when marking delivered. |
| `orderDate` | Created at persist time. |
| `paymentMethod` | `CASH_ON_DELIVERY`, `CARD`, or `POK`. |
| `deliveryNote` | Customer note copied from cart. |
| `latitude`, `longitude`, `address` | Delivery destination snapshot. |
| `branch` | Branch fulfilling the order. |
| `lastUpdated` | Hibernate update timestamp. |
| `driverEarnings` | Delivery driver earnings. |
| `reasonOfFailure` | Failure reason, when relevant. |
| `cartHash` | Detects duplicate unchanged PokPay checkout attempts. |

### `OrderStatus`

Current enum values:

```text
INITIALIZED
CONFIRMED
DELIVERED
ON_THE_WAY
CANCELLED
FAILED
PREPARING
READY_FOR_PICKUP
```

### `OrderItem`

Snapshot of menu item at order time. It stores quantity, item name, unit price, subtotal, and selected variants.

### `OrderItemVariant`

Snapshot of selected variant data. This is important because variant names/prices may change later, but historical orders should remain stable.

## Payment Model

### `PaymentMethodEntity`

Table:

```text
payment_method
```

Fields:

- `id`
- `name`
- `paymentMethod`

`paymentMethod` enum:

```text
CASH_ON_DELIVERY
CARD
POK
```

### `Payment`

Table:

```text
payments
```

Fields:

- `paymentGateway`
- `order`
- `amount`
- `paymentStatus`
- `transactionId`
- `paymentDate`
- `createdDate`
- `paymentUrl`
- `expiresAt`
- `refundStatus`

### `PaymentStatus`

Current enum values:

```text
PENDING
REJECTED
COMPLETED
FAILED
REFUNDED
PENDING_PAYMENT
CANCELED
TO_REFUND
EXPIRED
ABANDONED
```

## Delivery Location Model

### `DeliveryLocation`

Table:

```text
delivery-location
```

Fields:

- `latitude`
- `longitude`
- `locationName`
- `nickname`
- `user`

These are saved customer addresses/locations.

## Live Driver Location

Live delivery-driver coordinates are not saved in the `DeliveryLocation` table.

They are written to Redis:

```text
driver_loc:{driverId}
```

Stored JSON:

```json
{
  "latitude": 41.3275,
  "longitude": 19.8189
}
```

TTL:

```text
1 hour
```

This is correct for live tracking: it avoids permanently storing every driver movement. The missing piece is a read/display path for frontend/admin/customer tracking.

## Reviews

Reviews belong to:

- customer user,
- branch,
- optionally menu item depending on service flow.

Branch average rating and review count are denormalized onto `RestaurantBranch`.
