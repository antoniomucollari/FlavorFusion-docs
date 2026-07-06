# Operations

This page documents the operational pieces around the backend: caches, jobs, WebSocket broker, image import, and deployment notes.

## Runtime Services

The backend expects these services in a full environment:

| Service | Why it is needed |
| --- | --- |
| PostgreSQL + PostGIS | Primary relational database and branch coordinates. |
| Redis | Caches, branch GEO index, live driver coordinates. |
| RabbitMQ with STOMP | STOMP broker relay for WebSocket topics and user queues. |
| AWS S3 / CloudFront | Image storage and delivery. |
| PokPay API | Payment initiation, payment webhook, refunds. |
| Google Maps or ORS | Route distance and duration calculations. |

## PostgreSQL and PostGIS

`RestaurantBranch.location` uses:

```java
@Column(columnDefinition = "geography(Point,4326)")
private Point location;
```

Use a PostGIS database image locally:

```yaml
image: postgis/postgis:15-3.4-alpine
```

Before production, replace `spring.jpa.hibernate.ddl-auto=update` with migrations such as Flyway or Liquibase. The project already has enough domain rules that schema drift would become painful without migrations.

## Redis

### Branch GEO Index

Key:

```text
restaurant:locations
```

Value:

```text
branchId as Redis GEO member
```

Updated by:

```text
RestaurantBranchListener
BranchServiceImpl.updateRedisGeoIndex
```

Used by:

```text
RestaurantServiceImpl.findAvailableRestaurants
```

Current note:

- A commented `rebuildGeoIndexOnStartup` exists in `BranchServiceImpl`.
- For production, implement a real startup rebuild job or internal admin job so Redis can be rebuilt after cache loss.

### Spring Cache Names

Non-dev profile cache configuration:

| Cache | TTL | Purpose |
| --- | --- | --- |
| `userProfileCache` | 5 seconds | Micro-cache for user profile data. |
| `dashboardRestaurants` | 5 minutes | Restaurant discovery/dashboard pages. |
| `branchMenus` | 2 hours | Full branch menu. |
| `distanceMatrix` | Default config | Distance route results keyed by branch/location/provider. |

Dev profile:

- Only `distanceMatrix` uses in-memory `ConcurrentMapCache`.
- Other caches are no-op.

### Live Driver Coordinates

Key pattern:

```text
driver_loc:{driverId}
```

TTL:

```text
1 hour
```

Example value:

```json
{
  "latitude": 41.3275,
  "longitude": 19.8189
}
```

This is a latest-position cache, not a permanent tracking history.

## RabbitMQ STOMP Broker

`WebSocketConfig` uses a broker relay:

```java
config.enableStompBrokerRelay("/topic", "/queue")
    .setRelayHost(rabbitmqIp)
    .setRelayPort(61613)
```

RabbitMQ must have STOMP enabled. In RabbitMQ this is typically:

```bash
rabbitmq-plugins enable rabbitmq_stomp
```

In production, also configure:

- durable broker deployment,
- credentials not shared with app users,
- TLS or private networking,
- monitoring for queue/topic pressure.

## WebSocket Client Checklist

Client connects to:

```text
/ws
```

STOMP connect header:

```text
Authorization: Bearer <jwt>
```

Subscriptions:

```text
/topic/branch.{branchId}.manager
/topic/delivery.global.unassigned
/user/queue/updates
```

Important: RabbitMQ topic names in the current code use dots, not slashes.

## Internal Jobs

Controller:

```text
InternalJobController
```

Header:

```http
X-Internal-Secret: <app.internal-job-secret>
```

### Daily Reset

```http
POST /api/internal/jobs/daily-reset-order-count
```

Purpose:

- Reset branch daily order counts.
- Supports trending logic.

Recommended schedule:

```text
Daily at 00:00 in the business timezone
```

### Payment Cleanup

```http
POST /api/internal/jobs/payment-cleanup
```

Purpose:

- Expire stale pending payments.
- Mark abandoned orders.

Recommended schedule:

```text
Every 15-30 minutes
```

## Image Upload and Import

### Normal Upload

`AWSS3Service` handles uploading files to S3. `TestAWSUpload` exposes:

```http
POST /api/upload
```

This is useful for testing, but it is public in the current security filter. Protect it or remove it before production.

### Bulk File Import

Class:

```text
ImageUploader
```

Profile:

```text
import_file
```

Behavior:

- Walks `src/main/resources/json/restaurants/img/`.
- Splits filenames by the last underscore.
- Uploads original bytes to S3.
- Does not resize in the current implementation path.

Run example:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=import_file"
```

## Payment Operations

PokPay config keys:

```properties
pok.api.baseUrl=
pok.api.keyId=
pok.api.keySecret=
pok.api.merchantId=
pok.redirectUrl=
pok.failRedirectUrl=
pok.webhookUrl=
```

Operational rules:

- Webhook endpoint must be publicly reachable by PokPay.
- Use HTTPS in production.
- Keep webhook idempotency. Current implementation exits early if order payment is already `COMPLETED`.
- Monitor expired payment cleanup to make sure old pending orders do not pile up.

## Logs to Watch

Important log areas:

- Distance matrix failures or fallback `-1`.
- PokPay login/create/refund failures.
- WebSocket JWT errors.
- Redis connection failures.
- S3 upload failures.
- Payment cleanup counts.
- Delivery coordinate submission logs:

```text
coordinates sent for driverId {id}
```

## Deployment Notes

### Current Docker Compose

The included compose file is good for local/server experiments:

- Spring Boot backend.
- PostGIS.
- Redis.
- Nginx.

Missing for production:

- RabbitMQ service.
- TLS certificates.
- real secrets management.
- database backups.
- frontend artifact serving.
- persistent Redis/RabbitMQ decisions.
- health checks.
- environment-specific property files.

### Recommended Production Shape

For a small real deployment:

1. Spring Boot backend container.
2. Managed PostgreSQL with PostGIS or self-hosted PostGIS with backups.
3. Redis instance for cache/live locations.
4. RabbitMQ with STOMP plugin.
5. Nginx or cloud load balancer with HTTPS.
6. S3 + CloudFront for images.
7. External job scheduler for internal jobs.
8. Centralized logs.
9. Metrics and alerting for payment failures, route API failures, and WebSocket broker health.

## Backup and Data Risk

Back up:

- PostgreSQL database.
- S3 bucket objects.
- production application properties/secrets in a secret manager.

Redis is mostly rebuildable, except live driver coordinates, which are intentionally temporary.

## Security Checklist

Before serious production:

- Move all secrets out of `.properties` files and into environment variables or a secret manager.
- Protect `/api/upload`.
- Add method-level role annotation to payment branch update endpoint.
- Add method-level role annotation to driver location endpoint.
- Restrict review creation to authenticated customers.
- Add CSRF only if browser cookie auth is introduced. For JWT headers, stateless CSRF disabled is acceptable.
- Configure CORS per environment.
- Add HTTPS everywhere.
- Validate webhook authenticity if PokPay provides signatures or shared secrets.
- Rate limit auth and public discovery endpoints.
- Add database migrations.
- Avoid logging sensitive payment/auth data.
