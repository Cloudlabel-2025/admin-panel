# Timecard → DailyTask Integration Test

## Test Checklist

### 1. Punch In Test
- [ ] Go to timecard-entry page
- [ ] Click "Punch In"
- [ ] Go to daily-task page
- [ ] Verify first task shows "Logged in at HH:MM"
- [ ] Check if task has `isLogout: false` and proper start time

### 2. Lunch Out Test
- [ ] Click "Lunch Out" in timecard
- [ ] Go to daily-task page
- [ ] Verify new task entry shows "Lunch break started at HH:MM"
- [ ] Check if task has `isLunchOut: true`
- [ ] Verify previous task's end time is set to lunch out time

### 3. Lunch In Test
- [ ] Click "Lunch In" in timecard
- [ ] Go to daily-task page
- [ ] Verify lunch task now has end time set
- [ ] Check if task has `isLunchIn: true`
- [ ] Verify new task is created with start time = lunch in time

### 4. Break Out Test
- [ ] Enter break reason
- [ ] Click "Break Out" in timecard
- [ ] Go to daily-task page
- [ ] Verify new task entry shows "Break started at HH:MM"
- [ ] Check if task has `isBreak: true` and `isBreakIn: false`
- [ ] Verify previous task's end time is set

### 5. Break In Test
- [ ] Click "Break In" in timecard
- [ ] Go to daily-task page
- [ ] Verify break task now has end time set
- [ ] Check if task has `isBreakIn: true`
- [ ] Verify new task is created with start time = break in time

### 6. Permission Test
- [ ] Select permission duration (e.g., 60 minutes)
- [ ] Enter permission reason
- [ ] Click "Add Permission"
- [ ] Go to daily-task page
- [ ] Verify new task entry shows "Permission: 60 minutes"
- [ ] Check if task has `isPermission: true`
- [ ] Verify task status is "Completed"

### 7. Punch Out Test
- [ ] Click "Punch Out" in timecard
- [ ] Go to daily-task page
- [ ] Verify new task entry shows "Logged out at HH:MM"
- [ ] Check if task has `isLogout: true`
- [ ] Verify all open tasks have end times set

## How to Debug

### Check Database Directly
```javascript
// In MongoDB shell or Compass
db.dailytasks.find({ employeeId: "YOUR_EMPLOYEE_ID" }).sort({ date: -1 }).limit(1)
```

### Check API Response
```javascript
// In browser console on daily-task page
fetch('/api/daily-task?employeeId=YOUR_EMPLOYEE_ID')
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
```

### Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform timecard action (lunch out, break, etc.)
4. Look for POST request to `/api/daily-task`
5. Check request payload and response

## Expected Data Structure

### Lunch Out Entry
```json
{
  "Serialno": 2,
  "details": "Lunch break",
  "startTime": "13:00",
  "endTime": "",
  "status": "In Progress",
  "isLunchOut": true,
  "detailsLocked": true
}
```

### Break Out Entry
```json
{
  "Serialno": 3,
  "details": "Break started at 15:00",
  "startTime": "15:00",
  "endTime": "",
  "status": "In Progress",
  "isBreak": true,
  "isBreakIn": false,
  "detailsLocked": true
}
```

### Permission Entry
```json
{
  "Serialno": 4,
  "details": "Permission: 1h 0m",
  "startTime": "14:00",
  "endTime": "",
  "status": "Completed",
  "isPermission": true,
  "detailsLocked": true
}
```

## Common Issues

### Issue 1: Entries not showing in daily-task
**Cause:** API call from timecardService might be failing silently
**Fix:** Check browser console for errors, verify API endpoint is correct

### Issue 2: Entries showing but with wrong data
**Cause:** Data transformation issue in dailyTaskUtils
**Fix:** Check the payload being sent to API matches expected format

### Issue 3: Entries not updating (lunch in, break in)
**Cause:** Search logic in daily-task API might not find the correct entry
**Fix:** Verify the search criteria in POST handler for isLunchIn/isBreakIn

### Issue 4: Multiple duplicate entries
**Cause:** API being called multiple times
**Fix:** Add debouncing or check if entry already exists before creating
