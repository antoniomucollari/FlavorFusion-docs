# FoodApp Delivery Driver - Project Documentation

## Introduction
This is the technical documentation for the driver counterpart of the Food Delivery application. The app is built natively for Android using Kotlin and Jetpack Compose. The main goal was to create a robust, real-time application capable of handling delivery order management, background location tracking, interactive mapping, and live WebSocket updates.

## 1. Project Architecture & Setup
The project follows the **MVVM (Model-View-ViewModel)** architecture to keep business logic strictly separated from the UI layer.
- **UI Framework:** **Jetpack Compose** is used exclusively for building a declarative and responsive user interface.
- **Dependency Injection:** **Dagger Hilt** is integrated to seamlessly inject ViewModels, background Services, and Network instances. The configuration recently migrated from legacy KAPT to **KSP** (Kotlin Symbol Processing) to improve build performance.
- **State Management:** UI state is managed via Kotlin `StateFlow` and `SharedFlow`, ensuring screens instantly react to data changes.
- **Local Storage:** **DataStore Preferences** securely stores the driver's JWT token locally on the device, allowing for persistent login sessions.

## 2. Real-time WebSockets Integration (Krossbow & STOMP)
To ensure the app receives instant order updates without needing to constantly poll the server, WebSockets were integrated into the core network layer.

### WebSocketManager
A singleton `WebSocketManager` was built using **Krossbow**, a Kotlin multiplatform STOMP client, running over an OkHttp WebSocket connection.
Upon login, the manager automatically connects to the backend (`ws://<backend-ip>:8080/ws/websocket`) and passes the driver's JWT token in the `Authorization` header for secure STOMP authentication.

Once connected, it subscribes to two major channels:
1. **Global Unassigned Pool (`/topic/delivery.global.unassigned`):** Broadcasts new orders that are ready for pickup but haven't been assigned to a specific driver yet.
2. **Personal Driver Queue (`/user/queue/updates`):** Receives targeted updates regarding orders specifically assigned to this driver (e.g., status changes or cancellations).

Incoming STOMP messages are captured as strings and emitted using Kotlin `MutableSharedFlow`s (`globalUnassignedOrders` and `driverQueueUpdates`). ViewModels collect these flows and immediately refresh their order lists, making the UI feel fast and highly responsive.

## 3. App Navigation & Screen Flow
The `navigation-compose` library is utilized to handle routing throughout the application.

- **Auth Flow:** The app starts at the `LoginScreen`. Once credentials are submitted, the `AuthViewModel` triggers the login API. If successful, the token is saved, and the app navigates to the Main Dashboard.
- **Main Dashboard (`MainScreen`):** A scaffold containing a Bottom Navigation bar that allows switching between Active Orders, Unassigned Orders, and the Profile.
- **Unassigned Orders (`UnassignedOrdersScreen`):** Displays a list of orders waiting for a driver. Tapping "Accept" on an `OrderCard` claims the order.
- **Order Queues:**
    - **Ready for Pickup (`ReadyForPickupScreen`):** Orders that have been accepted but not yet picked up.
    - **On the Way (`OnTheWayScreen`):** Orders currently in transit to the customer.
- **Profile & Analytics (`ProfileScreen`):** Displays driver account info and monthly earnings. The `/api/analytics/earnings` endpoint provides historical revenue data, formatting the currency natively to **Lek**.

## 4. Live GPS Location Tracking
Because a delivery app requires the backend to know driver locations, a background location tracker was essential. Since the Android OS strictly limits background tasks, a Foreground Service (`LocationTrackingService`) runs while the driver is actively on shift.
- A persistent notification is displayed to comply with Android's background execution rules.
- `FusedLocationProviderClient` is utilized to fetch high-accuracy GPS coordinates.
- A coroutine loop running on `Dispatchers.IO` fires every 7 seconds. It pulls the device's `lastLocation` and executes a `POST` request to the `/api/delivery-location/location` endpoint, keeping the backend's driver cache up to date.

## 5. Interactive Mapping & Routing
For navigation, `maps-compose` embeds Google Maps directly into the Compose UI (`MapScreen`).
- **Custom Map Markers:** The map is customized by plotting different pins depending on the destination: one for the **Restaurant** (pickup) and one for the **User** (drop-off).
- **Smart Focus:** When an order is "Ready" (unassigned), the map focuses solely on the restaurant location since the food must be picked up there first.
- **Route Visualization:** The Google Maps Directions API is integrated. The app fetches the polyline path connecting the current live location, the restaurant, and the final user destination, drawing it seamlessly on the map.

## 6. REST APIs & Networking (Retrofit)
While WebSockets handle live events, core CRUD operations use standard HTTP requests.
- **Retrofit** and **OkHttp** handle all REST API calls (`ApiService`).
- To keep the codebase DRY (Don't Repeat Yourself), an `AuthInterceptor` is implemented in OkHttp. This interceptor hooks into every outgoing request, fetches the saved token from `DataStore`, and attaches the `Bearer` token to the request headers. This ensures tokens are never passed manually to API definitions.
