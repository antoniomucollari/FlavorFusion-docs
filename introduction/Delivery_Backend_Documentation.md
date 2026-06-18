# Backend Delivery Logic & Workflow Documentation

This document outlines the backend workflow, API endpoints, state management, and real-time WebSocket communication for the Delivery domain.

## 1. Unassigned Orders Flow
When an order is confirmed by the restaurant and is ready to be handled, it enters the global unassigned pool.

- **Fetching Unassigned Orders:**
  - **Endpoint:** `GET /api/orders/unassigned-orders?page=0&size=50`
  - **Description:** Returns a paginated list of all orders that are currently unassigned to any delivery personnel.

- **Assigning an Order:**
  - **Endpoint:** `PUT /api/orders/assign-order-delivery/{orderId}`
  - **Description:** Triggered when a delivery person accepts an order.
  - **Backend Action:** The `deliveryId` column in the database is updated with the accepting user's ID.
  - **Note:** After assignment, the delivery person cannot pick up the order immediately; they must wait for the restaurant branch to finish preparing the food.

## 2. Ready for Pickup Flow
Once the restaurant marks the food as prepared, the order transitions to the "Ready for Pickup" state.

- **Fetching Ready Orders:**
  - **Endpoint:** `GET /api/orders/all?orderStatus=READY_FOR_PICKUP&page=0&size=20&sortDirection=desc`
  - **Description:** Returns orders assigned to the delivery person that are ready to be collected from the restaurant.

- **State Restrictions & Updates:**
  - **Endpoint:** `PUT /api/orders/update-status`
  - **Restriction:** While in the `READY_FOR_PICKUP` state, a delivery client can **only** update the order status to `ON_THE_WAY`. No other status changes (e.g., delivered or failed) are permitted from this state.

## 3. On The Way Flow
When the delivery person collects the order and heads to the customer, the order is in transit.

- **Fetching In-Transit Orders:**
  - **Endpoint:** `GET /api/orders/all?orderStatus=ON_THE_WAY&page=0&size=20&sortDirection=desc`
  - **Description:** Returns active orders currently being delivered by the user.

- **State Restrictions & Updates:**
  - **Endpoint:** `PUT /api/orders/update-status`
  - **Allowed Status Updates:** The delivery person can only change the status to either `DELIVERED` or `FAILED`.
  - **Payment Updates:** If the payment method is "Cash on Delivery", the delivery person has the authority to update the `paymentStatus` to `FAILED` (e.g., if the customer refuses to pay).
  - **Completion Validation:** The order's `paymentStatus` **must** be marked as `COMPLETED` before the order status can successfully be updated to `DELIVERED`.
  - **Terminal State:** Once the order status is marked as `DELIVERED`, it becomes locked. No further modifications to the order status or payment status are allowed.

---

## 4. Real-Time WebSockets Integration (STOMP/RabbitMQ)
To ensure all clients are instantly synchronized, the backend pushes real-time updates via WebSockets. The delivery logic is split into two distinct channels to handle the "Unassigned Pool" and "Personal Assignments" securely and efficiently.

### 4.1 Global Unassigned Pool
This channel drives the "Unassigned Orders" queue. Since delivery drivers can accept orders from any branch they are authorized for, a global topic is utilized.

- **Topic:** `/topic/delivery/global/unassigned`
- **Payload Logic (`wsAction`):** The backend appends a `wsAction` field to the Data Transfer Object (DTO) to instruct the client on how to handle the incoming data:
  - **`ADD`:** Broadcasted if an order meets the unassigned criteria (Status is `CONFIRMED`, `PREPARING`, or `READY_FOR_PICKUP`, and the `deliveryPerson` is `null`). This ensures that as soon as a manager confirms an order, it appears instantly on all active drivers' screens.
  - **`REMOVE`:** Broadcasted if an order was previously unassigned but no longer is (e.g., a driver accepted it, or the order was cancelled). This ensures that if Driver A accepts an order, it instantly disappears from Driver B's screen, preventing conflicts.

### 4.2 Personal Driver Queue
This channel drives the personal queues for individual delivery drivers, such as "My Orders", "Ready for Pickup", and "On The Way".

- **Topic:** `/user/queue/updates`
- **Security:** The backend utilizes `convertAndSendToUser` to ensure absolute privacy. Updates broadcasted on this topic are routed exclusively to the specific driver assigned to the order. Driver A cannot intercept or listen to updates intended for Driver B.
- **Logic:** If an order's `deliveryPerson` is not null, any updates regarding that order are pushed to this specific user queue. This seamlessly handles the lifecycle of the active delivery (e.g., when the driver changes the status to `ON_THE_WAY`, the backend acknowledges it and updates the driver's own dashboard instantly).
