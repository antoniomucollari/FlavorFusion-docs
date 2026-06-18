# Chapter V: Implementation

## V.1 Development Environment Setup
The backend was developed using Java 21 and Spring Boot 3.x. The local development environment utilized Docker to containerize the PostgreSQL database (with PostGIS enabled) and the Redis instance, ensuring consistency across development and testing phases. 

## V.2 Core Algorithm: Spatial Querying
A critical component of the system is the ability to fetch available restaurant branches based on the user's current location and the branch's defined delivery radius. This is implemented in the Repository layer utilizing native PostGIS queries.

```java
// Code 5.1: Spatial query for finding branches within delivery radius
@Query(value = "SELECT * FROM restaurant_locations rl " +
       "WHERE rl.is_active = true AND rl.is_closed = false AND rl.deleted = false " +
       "AND ST_DWithin(" +
       "  rl.location\\:\\:geography, " +
       "  ST_SetSRID(ST_MakePoint(:userLng, :userLat), 4326)\\:\\:geography, " +
       "  rl.delivery_radius_in_km * 1000" +
       ")", nativeQuery = true)
List<RestaurantBranch> findAvailableBranchesWithinRadius(
        @Param("userLat") Double userLat, 
        @Param("userLng") Double userLng);
```
*As shown in Code 5.1, the `ST_DWithin` function leverages spatial indexing to efficiently calculate distances on the earth's surface (geography type).*

## V.3 Database Implementation: Order Entity
The `Order` entity acts as the central hub linking users, branches, delivery personnel, and payment details. It is heavily annotated to map to the relational database structure.

```java
// Code 5.2: Order Entity Core Attributes
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private OrderStatus orderStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_branch_id")
    private RestaurantBranch branch;
    
    // Additional fields and mappings omitted for brevity
}
```
*(See Appendix A for full source code)*

## V.4 API and Real-Time Interface Layer
The REST API is secured using JSON Web Tokens (JWT). When an order status changes, the backend simultaneously updates the database and broadcasts the new state via WebSockets.

```java
// Code 5.3: WebSocket Broadcast Implementation
public void broadcastOrderStatus(Order order) {
    String topic = "/topic/branch/" + order.getBranch().getId() + "/orders";
    OrderDTO payload = orderMapper.toDto(order);
    messagingTemplate.convertAndSend(topic, payload);
}
```
This ensures that any client subscribed to the specific branch's topic receives the update immediately.
