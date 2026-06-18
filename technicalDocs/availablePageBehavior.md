# Available Page Behavior

This note describes how the customer available/discovery page should behave on the frontend.

## Main idea

The available page shows only available restaurant branches. Availability rules are documented in the main available restaurant documentation.

The page is built from two backend endpoints:

- `GET /api/restaurants/available-restaurants-dashboard`
- `GET /api/restaurants/available-restaurants`

## Initial discovery load

On the initial discovery load, the frontend calls:

```http
GET /api/restaurants/available-restaurants-dashboard
```

The dashboard response contains the sections needed by the discovery page:

- `normal`
- `topRated`
- `fastest`
- `trending`

The `normal` section is the same kind of page as:

```http
GET /api/restaurants/available-restaurants?page=0&size=10
```

Because of that, the frontend should use `dashboard.normal` for the first main list page and should not make a second initial request to `available-restaurants?page=0&size=10`.

## Infinite scroll

After the initial dashboard call, the frontend calls `available-restaurants` only when it needs more pages for the normal list:

```http
GET /api/restaurants/available-restaurants?page=1&size=10
GET /api/restaurants/available-restaurants?page=2&size=10
```

The frontend should display the total from backend `totalElements`, not only the currently loaded `numberOfElements`.

Example:

```json
{
  "totalElements": 17,
  "numberOfElements": 10,
  "totalPages": 2,
  "number": 0
}
```

The UI heading should show `17`, not `10`.

## Sections

`Local heroes` shows the highest-reviewed available branches.

Each section should contain unique restaurant branches inside that section. A restaurant company can appear in different sections through different available branches.

Example:

- `KFC Astir` can appear in `Local heroes`
- `KFC Bllok` can appear in `Trending`

This is allowed because they are different restaurant branches, but they must still be available.

## Filters

When filters are active, the frontend removes the dashboard sections and only shows available restaurant results matching the filter.

Example:

```http
GET /api/restaurants/available-restaurants?page=0&size=10&sort=rating
```

Filters use the `available-restaurants` endpoint because filters are a paginated result list, not the dashboard section layout.

Filtered results also use scroll pagination on the frontend.

## Normal ranking

`GET /api/restaurants/available-restaurants` and the dashboard `normal` section do not rank only by distance.

The normal order is:

1. Sponsored/promoted available branches first, ordered by distance.
2. Non-sponsored available branches after that, ordered by distance.

So a sponsored branch may appear before a nearer non-sponsored branch. After sponsored ordering is applied, distance still matters inside each group.
