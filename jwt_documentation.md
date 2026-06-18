# JWT Authentication Workflow

This document explains how JSON Web Tokens (JWT) are used for authentication in the FoodApp application, detailing the flow before and after login, as well as how both the frontend and backend handle and store the token.

## 1. Before Login

- **Frontend**: The user is unauthenticated. The `AuthContext` state has `token` set to `null`, and there is no token in the browser's `localStorage`. Any API requests made via the Axios instance (`api.js`) do not contain an `Authorization` header.
- **Backend**: Public endpoints (like login or register) are accessible without a token. Secure endpoints are protected by `AuthFilter.java`. If a request arrives without an `Authorization: Bearer <token>` header, it is rejected unless it's a whitelisted public route.

## 2. During Login (Authentication)

1. The user submits their credentials via the frontend login form.
2. The frontend sends a `POST` request to the backend's `/auth/login` endpoint.
3. The backend verifies the credentials. If valid, `JwtUtils.java` generates a JWT using `Jwts.builder()`.
   - The token contains claims like the user's `email` as the subject and a custom `token_version`.
   - It is signed using an HMAC SHA256 secret key (`secreteJwtString`).
   - An expiration time is also set (currently 30 days).
4. The backend returns the generated JWT along with user roles back to the frontend in the response payload.

## 3. After Login (Token Storage & Usage)

### Frontend Token Handling
- **Storage**: When the frontend receives the token, `AuthContext.jsx` saves it persistently in the browser using `localStorage.setItem("token", token)` and updates the React state context.
- **Subsequent Requests**: The application uses an Axios request interceptor (`api.js`). For every outgoing API request, it retrieves the token from `localStorage` and automatically attaches it to the HTTP headers:
  ```javascript
  Authorization: Bearer <token>
  ```
- **Error Handling & Expiration**: If the backend returns a `401 Unauthorized` status (meaning the token is expired or invalid), an Axios response interceptor catches it, automatically clears the token from `localStorage`, and redirects the user back to the login page.
- **Logout**: When the user explicitly logs out, the frontend calls `localStorage.removeItem("token")` to clear the session.

### Backend Token Handling
- **Storage**: The backend does **not** store the actual JWT string. Instead, JWT is stateless. However, the backend stores a `tokenVersion` integer in the database for each user.
- **Verification**: On every incoming secured request, `AuthFilter.java` intercepts the request:
  1. It extracts the token from the `Authorization` header.
  2. It uses `JwtUtils` to verify the signature and ensure the token hasn't expired.
  3. **Version Check**: It extracts the `token_version` claim from the JWT and compares it to the `dbVersion` (the token version currently stored in the database for that user).
  4. If the versions match, the user is authenticated and the request proceeds. If they don't match, the token is considered stale (e.g., the user was forced to log out or changed their password), and a `401 Unauthorized` response is returned.
