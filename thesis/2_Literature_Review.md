# Chapter II: Literature Review

## II.1 Presentation of the Research Field
The domain of on-demand food delivery systems intersects with cloud computing, geographic information systems (GIS), and real-time bidirectional communication. The primary goal of these systems is to optimize the matching of customer orders with restaurant branches and delivery personnel, minimizing latency and maximizing throughput. The theoretical context involves distributed systems architecture, specifically the debate between microservices and modular monoliths.

## II.2 Existing Methods and Systems
Current literature heavily emphasizes microservice architectures for large-scale applications like UberEats or FoodPanda. These architectures allow independent scaling of services (e.g., payment, routing, user management) [1]. However, recent studies highlight the "microservice premium"—the inherent complexity, network overhead, and operational costs associated with distributed systems [2]. For spatial querying, traditional systems often rely on application-level filtering or complex SQL mathematical formulas (like the Haversine formula) to calculate distances, which can be computationally expensive [3]. Modern approaches advocate for spatial database extensions like PostGIS or dedicated geospatial search engines.

## II.3 Critical Comparison
While microservices offer high scalability, they introduce challenges in data consistency and deployment complexity. Conversely, traditional monoliths struggle with maintainability. The modular monolith approach, combined with in-memory caching (Redis), offers a middle ground, providing good performance for read-heavy operations without the deployment overhead of microservices [4]. However, even with aggressive caching, monolithic architectures eventually face bottlenecks at the database level during write-heavy operations, a threshold that varies based on the ORM implementation and database tuning.

Table 2.1 compares existing architectural approaches in the context of system scaling.

**Table 2.1: Comparison of Existing System Architectures for Logistics**

| Author/Year | Architecture | Data Retrieval Approach | Scaling Limit | Result |
| :--- | :--- | :--- | :--- | :--- |
| Chen et al. [5] | Microservices | Direct DB Queries | Database connection limits | High Scalability |
| Sharma [6] | Monolith | Memcached | CPU bounds on single server | Simple to deploy |
| Wang [7] | Serverless | Redis | API Gateway quotas | Excellent read performance |
| **Our Proposal** | **Modular Monolith** | **Redis Caching** | **PostgreSQL Write Locks** | **Optimized read latency, bounded write scale** |

## II.4 Research Gap
A significant portion of existing research either focuses on large-scale microservice platforms or simple academic monoliths. There is a lack of empirical studies analyzing the exact performance impact of Redis caching within a modern Spring Boot monolith, and specifically measuring the precise breaking point where the relational database (PostgreSQL) becomes a bottleneck for write operations. This thesis fills this gap by implementing and evaluating "Flavor Fusion."
