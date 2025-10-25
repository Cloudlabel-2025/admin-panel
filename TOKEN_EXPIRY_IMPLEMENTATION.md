# Token Expiry Implementation Summary

## Overview
Implemented a secure token-based authentication system with automatic refresh on user activity and session expiry after inactivity.

## Configuration (.env)
```
JWT_EXPIRES_IN=1h          # Access token expires in 1 hour
JWT_REFRESH_EXPIRES_IN=15h # Refresh token expires in 15 hours
```

## Key Components

### 1. Token Generation (Login API)
**File**: `src/app/api/User/login/route.js`
- Generates both access token (1h) and refresh token (15h) on login
- Stores tokens in localStorage on client side

### 2. Token Refresh API
**File**: `src/app/api/auth/refresh/route.js`
- Endpoint: `POST /api/auth/refresh`
- Validates refresh token and issues new access token
- Returns 401 if refresh token is invalid/expired

### 3. Token Manager (Client-Side)
**File**: `src/app/utilis/tokenManager.js`
- **Auto-refresh**: Refreshes token 5 minutes before expiry
- **Activity tracking**: Monitors user activity (mouse, keyboard, scroll, touch, click)
- **Debouncing**: Prevents excessive refresh calls (1 second debounce)
- **Expiry handling**: Redirects to login page when tokens expire

### 4. Layout Integration
**File**: `src/app/components/Layout.js`
- Initializes token refresh on component mount
- Validates token existence before rendering
- Redirects to login if no valid token found

## How It Works

### Normal Flow (With Activity)
1. User logs in → receives access token (1h) + refresh token (15h)
2. Token manager sets up auto-refresh timer (55 minutes)
3. User performs actions → activity detected → timer resets
4. Before token expires → automatically refreshes → new 1h token
5. Process repeats as long as user is active

### Inactivity Flow
1. User stops interacting with the system
2. No activity detected for 1 hour
3. Access token expires
4. Next API call fails with 401
5. Token manager attempts refresh
6. If refresh token valid → new access token issued
7. If refresh token expired (>15h) → redirect to login

### Complete Expiry
1. User inactive for 15+ hours
2. Both access and refresh tokens expire
3. Automatic redirect to login page
4. User must re-authenticate

## Security Features
- **Short-lived access tokens**: 1 hour expiry reduces risk window
- **Longer refresh tokens**: 15 hours allows reasonable session duration
- **Activity-based refresh**: Tokens only refresh when user is active
- **Automatic cleanup**: Expired sessions clear localStorage and redirect
- **No manual intervention**: System handles everything automatically

## User Experience
- ✅ Seamless experience during active use
- ✅ No interruptions while working
- ✅ Automatic logout after prolonged inactivity
- ✅ Clear session boundaries (15 hours max)
- ✅ Secure by default

## Testing Scenarios

### Test 1: Active User
- Login → Work continuously for 2+ hours
- Expected: No interruptions, tokens auto-refresh

### Test 2: Inactive User (< 15h)
- Login → Leave idle for 2 hours → Return
- Expected: Redirect to login (access token expired, refresh token still valid but not auto-refreshed)

### Test 3: Long Inactivity (> 15h)
- Login → Leave idle overnight
- Expected: Redirect to login (both tokens expired)

### Test 4: Activity Detection
- Login → Perform actions (click, type, scroll)
- Expected: Token refresh timer resets with each activity

## Files Modified/Created
1. `.env` - Updated token expiry times
2. `src/app/api/auth/refresh/route.js` - New refresh endpoint
3. `src/app/utilis/tokenManager.js` - New token management utility
4. `src/app/components/Layout.js` - Integrated token manager
5. `src/app/page.js` - Already stores refresh token (no changes needed)

## Notes
- Token refresh happens 5 minutes before expiry to prevent edge cases
- Activity events are debounced to prevent performance issues
- All tokens stored in localStorage (consider httpOnly cookies for production)
- Refresh token is single-use in this implementation
