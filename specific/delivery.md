unassigned orders:(getall ->
    http://localhost:8080/api/orders/unassigned-orders?page=0&size=50
)


after they select the preferable order they click accpet which trigger this 

http://localhost:8080/api/orders/assign-order-delivery/10
{
    "statusCode": 200,
    "message": "Order was assigned successfully.",
    "data": {
    "id": 10,
    "quantity": 0
    }
}
now the column `deliveryId` in orders table will change.
The delivery can't pickup the order yet though, he has to wait for the restaurant-branch to finish cooking it.

when order will be ready it will apear in `ready for pickup`: http://localhost:8080/api/orders/all?orderStatus=READY_FOR_PICKUP&page=0&size=20&sortDirection=desc
```json
{
    "statusCode": 200,
    "message": "Orders retrieved successfully.",
    "data": {
        "content": [
            {
                "id": 9,
                "orderDate": "2026-05-20T21:12:35.299052",
                "totalAmount": 1982.50,
                "orderStatus": "READY_FOR_PICKUP",
                "paymentStatus": "PENDING",
                "user": {
                    "id": 4,
                    "name": "Zaimin Krizi",
                    "email": "customer0@emaildomain.com",
                    "phoneNumber": "0123456789",
                    "profileUrl": "https://d3u269mlo8clta.cloudfront.net/user-profile-image/3.png",
                    "address": "Yzberisht, Rruga tre deshmoret",
                    "roles": [
                        {
                            "id": 2,
                            "name": "CUSTOMER"
                        }
                    ],
                    "active": true
                },
                "orderItems": [
                    {
                        "id": 16,
                        "quantity": 3,
                        "menu": {
                            "id": 367,
                            "name": "Waffle me Akullore & Nutella",
                            "imageUrl": "https://d3u269mlo8clta.cloudfront.net/yogurteria/68b7ecaa4b362b5df6fe50de.png"
                        },
                        "pricePerUnit": 550.00,
                        "subTotal": 1650.00,
                        "variants": []
                    }
                ],
                "deliveryPerson": {
                    "id": 6,
                    "name": "Argjend Kaika",
                    "email": "argjendkaika@gmail.com",
                    "phoneNumber": "684490156",
                    "profileUrl": "https://d3u269mlo8clta.cloudfront.net/user-profile-image/5.png",
                    "address": "Tirane,Albania",
                    "roles": [
                        {
                            "id": 5,
                            "name": "DELIVERY"
                        }
                    ],
                    "active": true
                },
                "latitude": 41.3360771,
                "longitude": 19.7732305,
                "address": "Rruga Sokrat Miho, Tiranë 1001, Albania",
                "paymentMethod": "CASH_ON_DELIVERY",
                "distanceInMeters": 2670
            }
        ],
        "pageable": {
            "pageNumber": 0,
            "pageSize": 20,
            "sort": {
                "empty": false,
                "sorted": true,
                "unsorted": false
            },
            "offset": 0,
            "paged": true,
            "unpaged": false
        },
        "last": true,
        "totalPages": 1,
        "totalElements": 1,
        "size": 20,
        "number": 0,
        "sort": {
            "empty": false,
            "sorted": true,
            "unsorted": false
        },
        "numberOfElements": 1,
        "first": true,
        "empty": false
    }
}
```
the delivery here can only do two things change the status to `on-the-way`
http://localhost:8080/api/orders/update-status
source:
```{"id":9,"orderStatus":"ON_THE_WAY"}```
response:
```{
    "statusCode": 200,
    "message": "Order updated successfully.",
    "data": {
        "id": 9,
        "orderDate": "2026-05-20T21:12:35.299052",
        "totalAmount": 1982.50,
        "orderStatus": "ON_THE_WAY",
        "paymentStatus": "PENDING",
        "user": {
            "id": 4,
            "name": "Zaimin Krizi",
            "email": "customer0@emaildomain.com",
            "phoneNumber": "0123456789",
            "profileUrl": "https://d3u269mlo8clta.cloudfront.net/user-profile-image/3.png",
            "address": "Yzberisht, Rruga tre deshmoret",
            "roles": [
                {
                    "id": 2,
                    "name": "CUSTOMER"
                }
            ],
            "active": true
        },
        "orderItems": [
            {
                "id": 16,
                "quantity": 3,
                "menu": {
                    "id": 367,
                    "name": "Waffle me Akullore & Nutella",
                    "imageUrl": "https://d3u269mlo8clta.cloudfront.net/yogurteria/68b7ecaa4b362b5df6fe50de.png"
                },
                "pricePerUnit": 550.00,
                "subTotal": 1650.00,
                "variants": []
            }
        ],
        "deliveryPerson": {
            "id": 6,
            "name": "Argjend Kaika",
            "email": "argjendkaika@gmail.com",
            "phoneNumber": "684490156",
            "profileUrl": "https://d3u269mlo8clta.cloudfront.net/user-profile-image/5.png",
            "address": "Tirane,Albania",
            "roles": [
                {
                    "id": 5,
                    "name": "DELIVERY"
                }
            ],
            "active": true
        },
        "latitude": 41.3360771,
        "longitude": 19.7732305,
        "address": "Rruga Sokrat Miho, Tiranë 1001, Albania",
        "paymentMethod": "CASH_ON_DELIVERY",
        "deliveryEarnings": 175.00,
        "distanceInMeters": 2670
    }
}
```

--

on_the_way
http://localhost:8080/api/orders/all?orderStatus=ON_THE_WAY&page=0&size=20&sortDirection=desc
now the delivery person can change the status to failed or delivered
http://localhost:8080/api/orders/update-status
{"id":9,"orderStatus":"FAILED"}
{"id":9,"orderStatus":"DELIVERED"}
{"id":9,"paymentStatus":"FAILED"} (ALSO PAYMENT STATUS if order is payment method on delivery and not card)

## about websocket
: The Incoming Orders, Preparation Queue, and Dispatch Board are updated in real-time via WebSockets. For technical details on the /topic/branch/{branchId}/manager channel, see below:

Delivery Channels The delivery logic is split into two distinct channels to handle the "Unassigned Pool" and "Personal Assignments" securely and efficiently.
Global Unassigned Pool This channel drives the "Unassigned Orders" page. Since delivery drivers can accept orders from any branch they are authorized for,
a global topic is used. Topic: /topic/delivery/global/unassigned Payload logic (wsAction): The backend appends a wsAction field to the DTO to tell the client 
how to react. ADD: Sent if the order matches the isUnassignedCriteriaMet() check (Status is CONFIRMED, PREPARING, or READY_FOR_PICKUP, and deliveryPerson is null).
REMOVE: Sent if the order was unassigned before the update, but is not anymore (e.g., a driver accepted it, or it was cancelled). 
This ensures that as soon as a manager marks an order as "CONFIRMED", it appears instantly on all drivers' screens. Conversely, if Driver 
A accepts it, it disappears instantly from Driver B's screen via the REMOVE action. 2. Driver Queue This channel drives the "My Orders",
"Ready for Pickup", and "On The Way" pages. Topic: /user/queue/updates Security: This uses convertAndSendToUser. The update is sent only to the specific driver 
assigned to the order. Driver A cannot listen to Driver B's updates. Logic: If the delivery person is not null, the update is sent here. This handles the lifecycle 
of the active delivery (e.g., changing status to ON_THE_WAY updates the driver's own dashboard).