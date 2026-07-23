import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  // head: [
  //   ['link', {
  //     rel: 'stylesheet',
  //     href: 'https://www.cdnfonts.com/css/optimistic'
  //   }]
  // ],
  title: "FoodApp docs",
  description: "A VitePress Site",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Load Test', link: '/backend/load-testing' }
    ],

    sidebar: [
      {
        text: 'Flavor Fusion Docs',
        collapsed: false,
        items: [
          { text: 'Quick Start', link: '/introduction/quick-start' },
          { text: 'Architecture Overview', link: '/introduction/architectureOverview' },
          {
            text: 'Backend',
            link: '/backend/',
            collapsed: false,
            items: [
              { text: 'Backend Overview', link: '/backend/' },
              { text: 'Setup', link: '/backend/setup' },
              { text: 'Architecture', link: '/backend/architecture' },
              { text: 'Data Model', link: '/backend/data-model' },
              { text: 'API Reference', link: '/backend/api-reference' },
              { text: 'Load Testing Results', link: '/backend/load-testing' },
              { text: 'Business Flows', link: '/backend/business-flows' },
              { text: 'Operations', link: '/backend/operations' },
              { text: 'Known Gaps', link: '/backend/known-gaps' }
            ]
          },
          {
            text: 'Available Restaurants', link: '/technicalDocs/availableRestaurantDocumentation.md',
            collapsed: false,
            items: [
              { text: 'Caching Restaurants', link: '/technicalDocs/RestaurantCaching/availableRestaurantDocumentation.md' }
            ]
          },

          { text: 'Admin Capabilities', link: '/technicalDocs/adminCapabilities.md' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
