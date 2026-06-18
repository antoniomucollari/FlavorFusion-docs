import http from 'k6/http';
import { check, sleep } from 'k6';

// This script contains two phases of testing:
// 1. Read-Heavy (Menu Fetching) to test Redis Caching
// 2. Write-Heavy (Checkout) to find the Database Bottleneck

export const options = {
  scenarios: {
    // Phase 1: Test Caching (High concurrent reads)
    // Run this scenario first with Cache OFF, then with Cache ON
    read_heavy_menu: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp up to 50 users
        { duration: '1m', target: 50 },   // Hold 50 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '10s',
      exec: 'menuTest', // Function to execute
    },
    
    // Phase 2: Test Database Bottleneck (High concurrent writes)
    // IMPORTANT: You might want to run this scenario completely separately 
    // to not mix up the latency results in the k6 summary.
    /*
    write_heavy_checkout: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // Ramp up slowly
        { duration: '30s', target: 50 },   // Push harder
        { duration: '1m', target: 200 },   // Push to the limit (adjust this until DB breaks)
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'checkoutTest', // Function to execute
    }
    */
  },
  thresholds: {
    // We want the 95th percentile of requests to be below 500ms
    http_req_duration: ['p(95)<500'], 
    // We want less than 1% of requests to fail
    http_req_failed: ['rate<0.01'],   
  },
};

const BASE_URL = 'http://localhost:8080/api';
// Replace with a valid branch ID from your database
const BRANCH_ID = 1; 

// --- SCENARIO 1: Read-Heavy (Menu) ---
export function menuTest() {
  const url = `${BASE_URL}/menu/branch/${BRANCH_ID}`;
  
  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Small sleep to simulate real user behavior between clicks
  sleep(1); 
}

// --- SCENARIO 2: Write-Heavy (Checkout) ---
export function checkoutTest() {
  const url = `${BASE_URL}/orders/checkout`;
  
  // Replace this payload with exactly what your frontend sends during checkout
  const payload = JSON.stringify({
    branchId: BRANCH_ID,
    userId: 1, // Optional: might need a real JWT token in headers instead
    items: [
      { menuItemId: 1, quantity: 2 },
      { menuItemId: 3, quantity: 1 }
    ],
    paymentMethod: "CASH" 
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' 
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  // Short sleep
  sleep(1);
}
