# Chapter VI: Evaluation & Results

## VI.1 Experimental Setup
To validate the system's performance, tests were conducted on an Azure Virtual Machine (Standard_D2s_v3: 2 vCPUs, 8 GiB RAM). k6 was utilized to simulate concurrent user traffic and measure API latency. 

**Baselines:**
1. **Phase 1 (Read-Heavy Load):** Comparing the latency and throughput of the `GET /api/menu/branch/{id}` endpoint with Redis caching enabled versus disabled.
2. **Phase 2 (Write-Heavy Load):** Incrementally increasing concurrent user load on the `POST /api/orders/checkout` endpoint until a database bottleneck is observed.

## VI.2 Results

### Phase 1: Caching Performance (Read-Heavy)
The menu retrieval endpoint was tested under a load of [X] concurrent users using k6.

**Table 6.1: Load Testing Results for Menu Endpoint**

| Condition | Average Latency (ms) | p95 Latency (ms) | Throughput (req/s) | Error Rate (%) |
| :--- | :--- | :--- | :--- | :--- |
| **No Cache (Direct DB)** | [Value] | [Value] | [Value] | [Value] |
| **Redis Cache Enabled** | [Value] | [Value] | [Value] | [Value] |

### Phase 2: Database Bottleneck Analysis (Write-Heavy)
To identify the system's absolute limits, the checkout endpoint was subjected to a stress test. 

*(Note: Add Line Chart here - Figure 6.2: Latency vs. Concurrent Users during Checkout)*
- **Threshold Identified:** The PostgreSQL database became a bottleneck at approximately [X] concurrent users.
- **Limiting Factor:** Analysis showed that [CPU utilization / active connections / table locks] reached maximum capacity, causing requests to queue and eventually timeout.

## VI.3 Discussion
The results directly address the research gap identified in Chapter I:
1. Redis caching provides a massive performance boost for read operations, effectively protecting the database from read-exhaustion during peak browsing hours.
2. However, the monolith is ultimately constrained by the relational database's capacity to handle concurrent writes. Once the load surpasses [X] users placing orders simultaneously, the system requires either vertical scaling of the database or queueing mechanisms (e.g., Kafka/RabbitMQ) to prevent failure.

## VI.4 Threats to Validity
- **Internal Validity:** Network latency between the k6 client and the Azure server may have influenced the absolute latency numbers, though the relative comparisons remain valid.
- **External Validity:** The synthetic dataset, while based on real data, may not perfectly simulate the distribution complexities of a massive urban environment.
