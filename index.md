---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Flavor Fusion documentation"
  text: ""
  tagline: ""
  actions:
    - theme: brand
      text: Load test results
      link: /backend/load-testing
    - theme: brand
      text: Backend docs
      link: /backend/
    - theme: brand
      text: Quick start
      link: /api-examples
      

features:
  - title: Load tested customer journey
    details: k6 simulated login, profile, delivery location, discovery, search, menu, cart, basket, and checkout with a peak of 1,451 virtual users.
  - title: Strong reliability under pressure
    details: The run completed 67,761 HTTP requests at about 616 requests/second with 99.95% successful checks and only 0.06% HTTP failures.
  - title: Honest optimization target
    details: The reliability threshold passed, while the strict p95 latency target failed at 1.43s, giving a clear next performance target.
---
