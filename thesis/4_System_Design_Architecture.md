# Chapter IV: System Design & Architecture

## IV.1 Architectural Overview
The Flavor Fusion platform is designed as a modular monolith. This architectural style was chosen to strike a balance between the simplicity of deployment and the organizational benefits of microservices. The backend is a unified Spring Boot application that exposes RESTful APIs and WebSocket endpoints. It communicates with a PostgreSQL database equipped with the PostGIS extension for spatial data management. Redis is utilized for fast, in-memory caching and session management. The frontend ecosystem consists of a React-based web application and a Kotlin-based mobile application.

*(Note: Add Architecture Diagram here - Figure 4.1: High-Level System Architecture Diagram)*

## IV.2 Data Modeling and Entities
The system relies on a robust relational database schema to maintain data integrity. Key entities include `User` (handling authentication and roles), `RestaurantBranch`, `Order`, and `MenuItem`.

*(Note: Add Entity Relationship (ER) Diagram here - Figure 4.2: Entity Relationship (ER) Diagram)*

**Design Decision: Geographic Data Storage**
- **Problem:** Storing and querying restaurant locations to find branches within a user's delivery radius.
- **Alternatives:** 
  1. Store Latitude and Longitude as standard `DOUBLE` fields and use mathematical formulas (e.g., Haversine) in the application layer or SQL queries.
  2. Use specialized spatial database extensions.
- **Chosen Solution:** We integrated the PostGIS extension with PostgreSQL. The `RestaurantBranch` entity stores location data as a `Point` geometry (SRID 4326). This allows the database to utilize spatial indexes (GIST), drastically reducing query times for geographic searches compared to mathematical SQL computations.

## IV.3 Real-Time Communication Strategy
To ensure synchronization across different user interfaces (Customer Web, Branch Manager Dashboard, Driver App), real-time communication is paramount.

*(Note: Add Sequence Diagram here - Figure 4.3: Sequence Diagram for Order Placement and Delivery Tracking)*

**Design Decision: State Synchronization**
- **Problem:** Updating order status (e.g., "Preparing", "On the Way") instantly on the customer's and manager's screens.
- **Alternatives:**
  1. HTTP Long Polling: Clients repeatedly request updates from the server.
  2. Server-Sent Events (SSE): Unidirectional updates from server to client.
  3. WebSockets: Persistent, bidirectional communication.
- **Chosen Solution:** WebSockets using Spring's STOMP protocol messaging. This provides low-latency, bidirectional communication, allowing the server to push updates instantly without the overhead of repeated HTTP handshakes associated with polling.

## IV.4 External Integrations
The architecture incorporates several external services to offload specialized processing:
- **AWS S3 & CloudFront:** Used for storing and rapidly delivering static assets (restaurant logos, menu item images) via a CDN.
- **Google Distance Matrix API:** Utilized to calculate accurate driving distances and estimated delivery times, complementing direct spatial distances.
- **POK Payment Integration:** A secure gateway for handling transaction processing.
