# Main technologies used:

Flavor Fusion uses a monolithic architecture with Spring Boot for the backend, React for the frontend, and Kotlin for the mobile delivery driver app.
It uses a relational database design with PostgreSQL and the PostGIS extension, together with Redis as an ultra-fast in-memory data store.
Hosting is done on a virtual machine in Azure. AWS is also used for CDN delivery through an S3 bucket and CloudFront.
For demo purposes, hosting is also configured through a TrueNAS SCALE all-in-one service.
Python is used for web scraping, only to populate the database with real data.
Authentication and authorization are secured with JWT.
Other services used are:
- Google distance matrix
- POK for full payment integration
