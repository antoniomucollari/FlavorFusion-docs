# Chapter I: Introduction

## I.1 Background
The growth of the food service industry has led to more on-demand food delivery platforms. These systems have logistical challenges, requiring real-time coordination between consumers, restaurant branches, and delivery personnel. Historically, platforms relied on simple web interfaces and periodic polling to update order statuses. Today, applications often use spatial databases, in-memory caching, and bidirectional communication protocols. While large companies often use microservice architectures to handle global traffic, there is a need for maintainable and scalable monolithic solutions that can serve regional markets efficiently. This thesis addresses the architectural and implementation challenges of building such a platform, named "Flavor Fusion."

## I.2 Research Problem
Existing mid-tier food delivery systems can struggle to handle real-time spatial queries and order synchronization efficiently under load, causing delivery delays, slow status updates, and poor user experience. Specifically, using standard relational queries for geographic proximity and HTTP polling for state changes can create bottlenecks.

## I.3 Research Gap
While there is extensive literature on the extreme scalability of microservices for global platforms, there remains a significant gap in understanding the precise operational limits of modern, monolithic architectures for mid-sized logistics applications. Specifically, it is not well documented how tools like in-memory caching can extend the viability of a monolithic backend before the underlying relational database becomes an insurmountable bottleneck. This thesis addresses this gap by exploring how the integration of in-memory caching (Redis) affects the scalability of a monolithic food delivery platform, and at what concurrent user load the database threshold is reached.

## I.4 Objectives
- To implement a modular monolithic food delivery platform ("Flavor Fusion") utilizing Spring Boot, React, and Kotlin.
- To evaluate the performance gains of Redis caching by load-testing read-heavy endpoints using k6.
- To identify the concurrent user load limit where the PostgreSQL database becomes a bottleneck during write-heavy operations (e.g., order checkout) despite caching.
- To integrate a comprehensive role-based access control (RBAC) system.
- To integrate a comprehensive role-based access control (RBAC) system supporting Customers, Branch Managers, Delivery Drivers, and Administrators.

## I.5 Scope and Limitations
**Scope:**
- The system includes a web application (React) for customers/managers and a mobile application (Kotlin) for delivery drivers.
- The backend is a single Spring Boot application (monolith) with PostgreSQL and Redis.
- Real-world menu and restaurant data is ingested via Python web scraping scripts.
- Payment integration is limited to the POK platform.

**Limitations:**
- The system will be load-tested using simulated traffic, not real-world user traffic.
- Advanced machine learning for predictive Estimated Time of Arrival (ETA) is out of scope; the system relies on static averages and Google Distance Matrix estimations.
- The dataset is limited to specific geographical regions scraped during the data ingestion phase.

This thesis contributes practically by providing a functional food delivery platform. Academically, it offers a detailed architectural analysis of how monolithic applications can use tools like Redis to perform well under load, and explicitly identifies the scaling limits of standard relational databases in this context. It demonstrates that a monolithic setup keeps the structure simple while meeting real-world business needs up to a specific, measurable threshold.
