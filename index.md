---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Flavor Fusion documentation"
  text: ""
  tagline: ""

  actions:
    - theme: brand
      text: Start here
      link: /introduction/quick-start.html

    - theme: alt
      text: Load test results
      link: /backend/load-testing

    - theme: alt
      text: Demo website
      link: https://foodapp.antoniomucollari.com/

features:
  - title: Load tested customer journey
    details: k6 simulated an identical customer flow and reached a peak of 1,451 virtual users live.

  - title: Location-aware discovery
    details: Restaurants and branches are filtered using delivery location, distance calculations, geospatial data, cached lookup flows, and map-based delivery support.

  - title: Production-ready features
    details: WebSocket updates, delivery status changes, branch dashboards, admin tools, notifications, and background jobs help keep orders and operational views synchronized.
---