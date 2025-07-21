# Design Document: Authentication API Fix

## Overview

This design addresses the authentication API issues causing HTTP 405 (Method Not Allowed) errors during login and register operations. The root cause appears to be a mismatch between how the client is making API requests and how the server routes are configured. The application has two different authentication implementations:

1. Standalone API handlers in `/api/login.js` and `/api/register.js`
2. Express routes in `/server/routes/auth.js` mounted at `/api/auth/`

The client is attempting to access `/api/login` and `/api/register` directly, but the server is expecting these requests at `/api/auth/login` and `/api/auth/register` respectively. This design will resolve this discrepancy and ensure consistent authentication routing.

## Architecture

The application follows a client-server architecture:

- **Frontend**: React/TypeScript application making API requests to the backend
- **Backend**: Express.js server with API routes for various features including authentication
- **Database**: MongoDB for storing user data and other application information

The authentication flow involves:
1. Client sends credentials to the server
2. Server validates credentials and generates a JWT token
3. Client stores the token and uses it for subsequent authenticated requests

## Components and Interfaces

### Client-Side Components

1. **Authentication Service**
   - Responsible for making API requests to login and register endpoints
   - Needs to use the correct API endpoint paths

2. **Login/Register Forms**
   - UI components that collect user credentials
   - Submit data to the authentication service

### Server-Side Components

1. **Express Router**
   - Defines routes for authentication endpoints
   - Currently configured at `/api/auth/login` and `/api/auth/register`

2. **API Handlers**
   - Standalone handlers at `/api/login.js` and `/api/register.js`
   - These appear to be Vercel serverless functions that are causing conflicts

3. **Authentication Controller**
   - Handles user registration and login logic
   - Validates credentials and generates JWT tokens

## Solution Options

### Option 1: Update Client to Use Correct Endpoints

Update the client-side authentication service to use the correct endpoints (`/api/auth/login` and `/api/auth/register`) that match the server's route configuration.

### Option 2: Redirect API Requests

Implement redirects or proxy middleware that forwards requests from `/api/login` and `/api/register` to `/api/auth/login` and `/api/auth/register`.

### Option 3: Consolidate Authentication Implementations

Remove the standalone API handlers and ensure all authentication is handled through the Express routes, or vice versa.

### Selected Approach: Option 3

We will consolidate the authentication implementations by removing the standalone API handlers and ensuring all authentication is handled through the Express routes. This approach:

- Eliminates duplication and potential conflicts
- Provides a single source of truth for authentication logic
- Simplifies maintenance and debugging

## Data Models

The existing User model will be used without modifications:

```javascript
// User Model (simplified)
{
  name: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

The authentication API will be standardized to use the following endpoints:

1. **Register**
   - URL: `/api/auth/register`
   - Method: POST
   - Request Body: `{ name, email, password }`
   - Response: `{ token, user: { id, name, email, createdAt } }`

2. **Login**
   - URL: `/api/auth/login`
   - Method: POST
   - Request Body: `{ email, password }`
   - Response: `{ token, user: { id, name, email, createdAt } }`

## Error Handling

Authentication errors will be handled with appropriate HTTP status codes and standardized error responses:

- 400: Bad Request (validation errors, invalid credentials)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 405: Method Not Allowed (incorrect HTTP method)
- 500: Internal Server Error (server-side issues)

Error responses will follow this format:
```json
{
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

## Testing Strategy

1. **Unit Tests**
   - Test authentication controllers in isolation
   - Verify correct handling of valid and invalid credentials

2. **Integration Tests**
   - Test API endpoints with various request scenarios
   - Verify correct status codes and response formats

3. **End-to-End Tests**
   - Test authentication flow from client to server
   - Verify successful login and registration

## Implementation Plan

1. Identify and update client-side authentication service to use correct endpoints
2. Remove standalone API handlers that conflict with Express routes
3. Ensure consistent error handling across authentication endpoints
4. Update documentation to reflect the correct API endpoints
5. Test authentication flow in development and production environments