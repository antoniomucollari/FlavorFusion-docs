# Main technologies used:

Flavor fusion uses a monolith architecture featuring spring boot for backend, react for frontend, and kotlin for mobile (delivery driver app).
It uses rational database design (PostgreSQL + postgis extension) and with an ultra-fast in-memory data structure store redis.
Hosting is done on a virtual machine inside Azure cloud. Also AWS is used for CDN (s3 bucket with cloudfront).
Python is used for web scraping (only used to fill the database with real data).
Encryption is done with JWT.
Other services used are:
- Google distance matrix
- POK for full payment integration