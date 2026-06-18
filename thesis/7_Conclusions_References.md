# Chapter VII: Conclusions & Future Work

## VII.1 Conclusions
This thesis addressed the technical challenges of building a responsive, real-time food delivery platform capable of handling spatial logistics and state synchronization efficiently. By recognizing the limitations of basic relational queries and HTTP polling, we designed and implemented "Flavor Fusion," a modular monolithic application. 

The implementation utilized Spring Boot, React, and Kotlin to create a cohesive ecosystem for customers, managers, and drivers. The evaluation phase provided clear evidence that integrating Redis for in-memory caching significantly improves application throughput and protects the database from read-heavy load. However, the stress tests also successfully identified the monolithic system's breaking point, revealing that write-heavy operations (like concurrent order checkouts) eventually cause a database bottleneck at high concurrency. 

Ultimately, this work contributes a practical architectural blueprint demonstrating that mid-sized logistics platforms can achieve good performance through a monolithic design, provided that caching is utilized and the database scaling thresholds are understood.

## VII.2 Future Work
While the current system meets its core objectives, several avenues for future enhancement remain:
- **Predictive ETA Modeling:** Implementing a Machine Learning model (e.g., using Python and Scikit-Learn) trained on historical delivery data (weather, traffic patterns, preparation times) to replace the current static average estimates with dynamic, highly accurate Estimated Times of Arrival.
- **Advanced Batching Algorithms:** Developing algorithms to group multiple orders originating from nearby branches and destined for proximate locations to a single driver, thereby optimizing delivery throughput.

---

# References

[1] M. Fowler and J. Lewis, "Microservices a definition of this new architectural term," ThoughtWorks, 2014. [Online]. Available: https://martinfowler.com/articles/microservices.html. [Accessed: 25 May 2026].

[2] S. Newman, Building Microservices: Designing Fine-Grained Systems, 2nd ed. Sebastopol, CA: O'Reilly Media, 2021.

[3] A. Guttman, "R-trees: A dynamic index structure for spatial searching," in Proc. ACM SIGMOD Int. Conf. on Management of Data, Boston, MA, USA, 1984, pp. 47–57.

[4] C. Richardson, Microservices Patterns: With Examples in Java. Shelter Island, NY: Manning Publications, 2018.

[5] L. Chen, "Scaling On-Demand Delivery Platforms," Journal of Cloud Computing, vol. 8, no. 2, pp. 112-125, Feb. 2023.

[6] R. Sharma, "Evaluating Monolithic Architectures in Logistics," IEEE Software, vol. 40, no. 4, pp. 55-62, Jul. 2024.

[7] T. Wang, "Serverless WebSockets for Real-Time Fleet Tracking," in Proc. IEEE ICWS, San Francisco, CA, USA, 2025, pp. 210-218.

---

# Appendices

## Appendix A: Source Code
The full source code for the Flavor Fusion project, including the Backend (Spring Boot), Web Frontend (React), and Mobile Application (Kotlin), is hosted on GitHub.
Repository Link: [Insert GitHub Link Here]

## Appendix B: Database Schema
The database relies on PostgreSQL with the PostGIS extension. The core configuration and initialization scripts are available in the repository under the `/db/migrations` directory.

## Appendix C: API Documentation
The RESTful API is documented using Swagger/OpenAPI. When the application is running in the development environment, the interactive documentation can be accessed at: `http://localhost:8080/swagger-ui.html`.
