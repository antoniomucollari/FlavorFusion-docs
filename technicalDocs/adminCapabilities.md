# Admin Capabilities

This document summarizes what an admin user can do in the Flavor Fusion frontend.

## Access

Admins use the `/admin` area of the application. The route is protected and requires an authenticated user with the admin role.

The admin sidebar currently exposes:

- Dashboard
- All Orders
- Categories
- Customers
- Delivery
- Delivery Earnings
- Managers
- Restaurants
- More Graphs
- Payment Methods
- Profile

The old Admin Live Orders page is intentionally not shown because it is not currently working. Requests to `/admin/live-orders` are redirected to `/admin/all-orders`.

## Dashboard

The dashboard gives the admin an operational overview of the platform.

Admins can:

- View total revenue.
- View total orders.
- View unique customer metrics.
- Review recent or filtered order activity.
- See popular menu items.
- View order-status analytics.

This page is intended as the first place an admin checks platform health and high-level performance.

## All Orders

The All Orders page is the main order-management screen for admins.

Admins can:

- View paginated orders.
- Search orders by order ID.
- Filter orders by customer.
- Filter orders by delivery person.
- Filter by order status.
- Filter by payment status.
- Sort orders by fields such as last updated, amount, order date, or delivery date.
- Change order status or payment status when controls are available.
- Open order details.
- View customer, delivery, restaurant, branch, payment, and item information inside the order detail modal.

The customer and delivery filters use the user lookup endpoint and support the backend paginated response format.

## Categories

The Categories page allows admins to manage restaurant categories.

Admins can:

- View all restaurant categories.
- Add a category.
- Edit a category.
- Delete a category.

Categories are used to organize restaurants and improve discovery.

## Customers

The Customers page uses the shared user-management screen for users with the `CUSTOMER` role.

Admins can:

- View paginated customers.
- Search customers by name or email.
- See customer contact information.
- See customer status.
- Change a customer's role.
- Deactivate or restore customer access.
- Navigate to the customer's orders.

## Delivery Personnel

The Delivery page uses the shared user-management screen for users with the `DELIVERY` role.

Admins can:

- View paginated delivery personnel.
- Search delivery users by name or email.
- See contact information and account status.
- Change a delivery user's role.
- Deactivate or restore delivery-user access.
- Navigate to orders associated with a delivery person.

## Delivery Earnings

The Delivery Earnings page helps admins inspect delivery-person earnings.

Admins can:

- Select a delivery person.
- Select a year.
- View total earnings for the selected delivery person and year.
- View monthly earnings in a chart.

This page depends on delivery users and delivery earnings analytics.

## Managers

The Managers page allows admins to manage restaurant-manager accounts.

Admins can:

- View paginated managers.
- Search managers by name or email.
- Create a new manager account.
- Provide manager name, email, phone number, and address.
- Deactivate a manager.
- Restore a manager.
- Review manager contact and status information.

When a manager is created, the backend is expected to generate and deliver the initial password.

## Restaurants

The Restaurants page lets admins manage restaurants at the platform level.

Admins can:

- View paginated restaurants.
- Change page size.
- Switch between active and deleted restaurants.
- View restaurant name, ID, image, promoted status, branch count, assigned manager, and created date.
- Unassign a manager from a restaurant.
- Delete a restaurant.
- Restore a deleted restaurant.

The restaurant list uses the backend paginated response from `/api/restaurants/all-restaurants-admin`.

## More Graphs

The More Graphs page contains extra analytics views.

Admins can:

- Review revenue analytics.
- Review order-related charts.
- Inspect additional performance graphs beyond the main dashboard.

## Payment Methods

The Payment Methods page allows admins to manage available payment-method labels.

Admins can:

- View payment methods.
- Edit a payment method name.

Payment method availability for branches is handled elsewhere by branch-management workflows.

## Profile

Admins can open their profile from the admin area.

Admins can:

- View account details.
- Update supported account information.
- Change password.
- Deactivate their own account if the profile workflow allows it.

## Notes

- Admin actions are backed by protected API routes and require a valid JWT.
- Mutation success and error messages are shown through the frontend API interceptor and toast system.
- Paginated admin screens should read list data from `content` and metadata from fields such as `totalElements`, `totalPages`, and `number`.
