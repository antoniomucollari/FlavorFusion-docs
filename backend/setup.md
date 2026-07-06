# Setup and Configuration

## Backend Location

```text
C:\Users\anton\OneDrive\Desktop\Tailwind\FoodApp\backend
```

## Requirements

- Java 21.
- Maven, or the included Maven wrapper.
- PostgreSQL with PostGIS enabled.
- Redis.
- RabbitMQ with the STOMP plugin enabled if WebSocket broker relay is used.
- AWS S3 credentials for image upload.
- PokPay credentials for card / wallet payment flow.
- Google Maps API key and/or ORS matrix URL for route calculation.

## Run Locally

From the backend folder:

```powershell
cd C:\Users\anton\OneDrive\Desktop\Tailwind\FoodApp\backend
.\mvnw.cmd spring-boot:run
```

To build:

```powershell
.\mvnw.cmd clean package
```

To run tests:

```powershell
.\mvnw.cmd test
```

## Configuration File

The template is:

```text
backend/src/main/resources/application-example.properties
```

Create your real local config as:

```text
backend/src/main/resources/application.properties
```

Do not commit real secrets.

## Important Properties

| Property | Purpose |
| --- | --- |
| `spring.datasource.url` | PostgreSQL JDBC URL. |
| `spring.datasource.username` / `spring.datasource.password` | Database credentials. |
| `spring.jpa.hibernate.ddl-auto` | Currently set to `update` in the example. Use migrations before serious production. |
| `secreteJwtString` | JWT signing secret. Rename later to a clearer name such as `security.jwt.secret`. |
| `spring.mail.*` | SMTP credentials for email notifications. |
| `aws.s3.bucket` | S3 bucket for uploaded images. |
| `aws.s3.region` | S3 region. |
| `aws.accessKeyId` / `aws.secretKey` | AWS credentials. Use environment variables or a secret manager in production. |
| `aws.cloudfront.domain` | Public CDN domain returned to frontend. |
| `spring.servlet.multipart.max-file-size` | Upload file size limit. |
| `spring.data.redis.host` / `spring.data.redis.port` | Redis connection. |
| `spring.cache.type` | Example disables Spring cache with `none`; use Redis cache in normal non-dev profile. |
| `google.maps.api.key` | Google Distance Matrix key. |
| `ors.matrix.url` | OpenRouteService matrix API URL, usually internal/on-premise. |
| `pok.api.baseUrl` | PokPay API URL. |
| `pok.api.keyId` / `pok.api.keySecret` | PokPay API login credentials. |
| `pok.api.merchantId` | Merchant ID used to create SDK orders and refunds. |
| `pok.expiersAfterMinutes` | Payment expiry duration. Typo exists in property name. |
| `pok.redirectUrl` / `pok.failRedirectUrl` | Frontend redirect URLs after payment. |
| `pok.webhookUrl` | Public webhook URL registered with PokPay. |
| `app.internal-job-secret` | Secret required by internal job endpoints. |
| `checkout.tip.suggestions` | Tip suggestions shown during checkout. |
| `app.default.payment-method-id` | Default payment method fallback. |

## Profiles

| Profile | Behavior |
| --- | --- |
| default / non-`dev` | Uses `RedisConfig`, Redis cache manager, Redis message listener for driver locations. |
| `dev` | Uses `DevCachingConfig`; only `distanceMatrix` has an in-memory cache and other caches are no-op. |
| `import_file` | Runs `ImageUploader` on startup to upload local image files to S3. |
| `import_url` | Mentioned in config comments; verify before relying on it. |

## Docker

`backend/docker-compose.yml` defines:

- `backend`: Spring Boot app.
- `postgres-db`: PostGIS image.
- `redis-cache`: Redis.
- `nginx-proxy`: Nginx reverse proxy.

Run:

```powershell
cd C:\Users\anton\OneDrive\Desktop\Tailwind\FoodApp\backend
docker compose up --build
```

The included `Dockerfile` builds the app with Maven in a Java 21 build image, then runs the packaged jar in a Java 21 JRE Alpine image.

## Nginx

`backend/nginx/nginx.conf` proxies:

- `/api/` to `http://backend:8080/api/`
- `/` to static frontend files under `/usr/share/nginx/html`

For production, add:

- HTTPS / TLS.
- Real domain in `server_name`.
- WebSocket proxy rules for `/ws`.
- Frontend build volume or image stage.

## Health Check

```http
GET /health
```

Returns:

```text
OK
```

Use this for container health checks and uptime checks.
