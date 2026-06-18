# Frontend Discovery Changes

This note documents recent frontend behavior changes in the customer discovery and restaurant branch pages.

## Discovery page

- Clicking a restaurant brand now calls `GET /api/restaurants/search-by-restaurant/{id}`.
- The selected restaurant view shows only branches from that restaurant and no branches from other restaurants.
- A `Go back` button clears the selected restaurant and returns the user to normal discovery.
- Branch cards hide icons when the backend value is missing.
- Branch cards also hide distance when `distanceInKm` is `0`, because this value is used by some restaurant-branch responses and should not be shown as a real distance.
- Filtered discovery results use scroll pagination instead of manual previous/next pagination.
- The first normal discovery page is taken from `available-restaurants-dashboard.normal`.
- The frontend no longer also calls `available-restaurants?page=0&size=10` on initial discovery load.
- `GET /api/restaurants/available-restaurants` is called later for normal discovery only when infinite scroll needs page `1` or higher.
- The heading `Order from X places near you` uses backend `totalElements`, not the number of currently rendered cards.

## Mobile discovery UI

- Mobile discovery has reduced page margins, tighter restaurant cards, smaller category chips, and tighter section spacing.
- The search input uses smaller mobile text.
- Desktop filters are now available on mobile through a filter icon.
- The mobile filter icon opens the same filter controls in a popup/drawer with a close button.

## Restaurant branch page

- Mobile restaurant title typography was reduced so the restaurant name, branch address, and description do not dominate the page.
- Restaurant info metrics show two items in the first mobile row and the third item below.
- Menu items use a compact mobile list layout similar to Lieferando: text on the left, image on the right, and separators between rows.
- Mobile users get a sticky `View basket` button only when the current branch basket has at least one item.
- Tapping `View basket` opens the existing basket UI in a mobile bottom panel/sidebar with an `X` close button.
- Checkout navigation happens from the basket's checkout button, not from the sticky mobile basket button.

## Checkout success behavior

- Successful checkout no longer invalidates and refetches the checkout preview.
- This prevents the old checkout page from refetching an emptied cart and showing `Cannot proceed to checkout with an empty cart` while the user is already on order history.
- After successful checkout, the frontend refreshes orders and clears basket/checkout cache without displaying the stale empty-cart error.
