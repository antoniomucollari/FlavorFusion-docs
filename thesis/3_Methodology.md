# Chapter III: Methodology

## III.1 Research Design
This thesis employs an Applied/Design Science research methodology. The primary objective is to design, implement, and evaluate a software artifact—the "Flavor Fusion" food delivery platform. The research is structured in three phases: architecture design based on identified problems, system implementation, and quantitative evaluation of the system's performance and scalability.

## III.2 Data and Dataset
To ensure the system is tested under realistic conditions, a synthetic but realistic dataset was constructed. 
- **Source:** Python web scraping scripts were utilized to extract real restaurant names, menu items, prices, and geographic coordinates from public directories (wolt).
- **Descriptive Statistics:** The initial database seed contains approximately 50 restaurant branches, 2,000 menu items, and simulated customer data. 
- **Preprocessing:** Scraped geographic data (latitude/longitude) was converted into PostGIS `Point` geometries during ingestion to enable spatial indexing.

## III.3 Tools and Technologies

**Table 3.1: Tools and Technologies Justification**

| Category | Tool / Technology | Reason for Choice |
| :--- | :--- | :--- |
| **Backend Framework** | Java 17 + Spring Boot 3 | Robust ecosystem, enterprise-grade security, excellent ORM (Hibernate) support. |
| **Frontend Framework** | React (Vite) | Component-based UI, fast rendering, vast ecosystem for dashboards. |
| **Mobile Application** | Kotlin | Native performance for delivery drivers utilizing GPS and background services. |
| **Database** | PostgreSQL + PostGIS | ACID compliance, robust relational data handling, and native spatial query capabilities. |
| **Caching/Messaging** | Redis | Ultra-fast in-memory store for session management and fast data retrieval. |
| **Cloud & Storage** | Azure VM + AWS S3/CloudFront | Reliable hosting and high-performance CDN for image delivery. |
| **Version Control** | Git + GitHub | Tracking changes, branch management, and collaborative development. |

## III.4 Evaluation Metrics
The success and performance of the Flavor Fusion platform will be measured using the following quantitative metrics:
- **API Latency (ms):** The time taken for the backend to process and respond to critical requests (e.g., fetching nearby restaurants).
- **Throughput (req/s):** The maximum number of concurrent requests the system can handle before response times degrade beyond 500ms.
- **Spatial Query Efficiency (ms):** Comparison of execution time between standard SQL distance calculations and PostGIS indexed queries.
- **WebSocket Synchronization Delay (ms):** The latency between a state change (e.g., driver marks order as 'Delivered') and the client receiving the update.
