import { defineConfig } from 'vitepress'

// =============================================================================
// Live Website / Demo URL
// Update this single variable whenever the URL changes:
// =============================================================================
const DEMO_URL = 'https://flavor-fusion.196102.xyz'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [
      {
        name: 'replace-demo-url',
        enforce: 'pre',
        transform(code, id) {
          if (id.split('?')[0].endsWith('.md')) {
            return code
              .replaceAll('__DEMO_URL__', DEMO_URL)
              .replaceAll('{{DEMO_URL}}', DEMO_URL)
              .replaceAll('https://foodapp.antoniomucollari.com/', DEMO_URL)
              .replaceAll('https://foodapp.antoniomucollari.com', DEMO_URL)
          }
        }
      }
    ]
  },
  title: "FoodApp docs",
  description: "A VitePress Site",
  ignoreDeadLinks: true,
  themeConfig: {
    demoUrl: DEMO_URL,
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
          { text: 'Data Ingestion & Scraping', link: '/scraping documentation.md' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
