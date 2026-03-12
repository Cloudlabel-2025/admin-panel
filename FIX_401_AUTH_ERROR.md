# 401 Authentication Error - FIXED

## Problem
```
GET /api/timecard?employeeId=CHC0019 401 Unauthorized
GET /api/daily-task?employeeId=CHC0019 401 Unauthorized
```

The daily-task page was making API calls **without the Authorization header**, causing all requests to fail with 401 errors.

## Root Cause
Missing `Authorization: Bearer <token>` header in fetch calls:
- `fetchData()` - timecard and daily-task GET requests
- `updateTask()` - daily-task POST request  
- `saveTasks()` - daily-task POST request
- `generateMonthlyReport()` - daily-task GET request
- Employee fetch in `useEffect()`

## Solution Applied
Added `Authorization` header to all fetch calls:

```javascript
const token = localStorage.getItem('token');
fetch('/api/timecard?employeeId=...', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Files Modified
- `src/app/daily-task/page.js` - Added auth headers to 5 fetch calls

## Test After Fix
1. Refresh the daily-task page
2. Check browser console - should see **200 OK** instead of 401
3. Timecard data should load (punch in/out, lunch, breaks)
4. Daily tasks should load properly
5. System entries (lunch, break, permission) should be visible

## Expected Output
```
GET /api/timecard?employeeId=CHC0019 200 OK
GET /api/daily-task?employeeId=CHC0019 200 OK
GET /api/Employee/CHC0019 200 OK
```

## Verify Integration Working
After this fix, you should see:
- ✅ Timecard data displayed in header (punch in/out, lunch times)
- ✅ All daily tasks loaded including system entries
- ✅ Lunch entries with `isLunchOut`/`isLunchIn` flags
- ✅ Break entries with `isBreak` flags
- ✅ Permission entries with `isPermission` flag
- ✅ No more 401 errors in console

The timecard → dailytask integration was already working correctly. The only issue was the missing authentication headers preventing data from being fetched.
