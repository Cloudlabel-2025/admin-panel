# Absence Cancellation Feature - Implementation Summary

## ✅ All Requirements Implemented

### 1. Employee Self-Cancellation
**Location:** `src/app/absence/page.js`
- ✅ Employees can cancel their own absence requests
- ✅ Cancel button appears in the Actions column for each leave request
- ✅ Confirmation dialog before cancellation
- ✅ Success/error messages displayed

### 2. Cancellation Allowed for Pending & Approved Status
**Location:** `src/app/api/absence/route.js` (PUT endpoint)
```javascript
if (absence.status !== "Approved" && absence.status !== "Pending") {
  return NextResponse.json({ 
    error: "Only pending or approved leave can be cancelled" 
  }, { status: 400 });
}
```
- ✅ Validates status before allowing cancellation
- ✅ Rejects cancellation for Rejected or already Cancelled leaves

### 3. Status Updated to "Cancelled"
**Location:** `src/models/Absence.js` & API route
- ✅ Model schema includes "Cancelled" in status enum
- ✅ Tracks cancellation metadata:
  - `cancelledBy`: Employee ID who cancelled
  - `cancellationDate`: Timestamp of cancellation
  - `cancellationReason`: Reason for cancellation

### 4. Automatic Attendance Record Update
**Location:** `src/app/api/absence/route.js` (cancel action)
```javascript
// Delete leave attendance records linked to this absence
await Attendance.deleteMany({
  employeeId: absence.employeeId,
  date: { $gte: startDate, $lte: endDate },
  status: "Leave",
  absenceId: _id
});
```
- ✅ Removes all "Leave" attendance records for cancelled dates
- ✅ Uses absenceId link to ensure only related records are deleted

### 5. Attendance Recalculation Based on Login Activity
**Location:** `src/app/api/absence/route.js` (cancel action)
```javascript
// Check if employee has timecard entries for these dates
const timecardEntry = await Timecard.findOne({
  employeeId: absence.employeeId,
  date: currentDate
});

if (timecardEntry && timecardEntry.loginTime) {
  // Employee was present - create/update attendance as Present
  await Attendance.findOneAndUpdate(
    { employeeId: absence.employeeId, date: currentDate },
    {
      status: "Present",
      remarks: "Recalculated after leave cancellation",
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );
}
// If no timecard entry, leave as Absent (no attendance record)
```
- ✅ Checks timecard for each cancelled leave date
- ✅ If employee logged in → marks as "Present"
- ✅ If no login → remains "Absent" (no record created)

### 6. Login Allowed After Cancellation (Including Today)
**Location:** `src/app/services/timecardService.js` (handleLogin function)
```javascript
const approvedLeave = await Absence.findOne({
  employeeId,
  status: "Approved",  // Only blocks for "Approved" status
  startDate: { $lte: checkDate },
  endDate: { $gte: checkDate }
});
```
- ✅ Login blocking only checks for "Approved" status
- ✅ Cancelled leaves (status: "Cancelled") do NOT block login
- ✅ Works for today's date and future dates
- ✅ Employee can immediately login after cancelling today's leave

### 7. Cancelled Records Visible in History
**Location:** `src/app/absence/page.js`
- ✅ All absence records displayed regardless of status
- ✅ "Cancelled" status shown with grey badge
- ✅ Filter dropdown includes "Cancelled" option
- ✅ Records are never deleted, only status updated

## UI Changes

### Employee Absence Page (`src/app/absence/page.js`)
**New Features:**
- Cancel button for Pending/Approved leaves
- Cancelled status badge (grey)
- Filter option for Cancelled leaves
- Confirmation dialog before cancellation
- Success message: "Leave cancelled successfully. Attendance records updated."

**Actions Column:**
```
Pending/Approved → [Cancel] button (yellow)
Rejected/Cancelled → "-" (no action)
```

### Admin Absence Page (`src/app/admin-absence/page.js`)
**Updated Features:**
- Cancelled status badge added
- Filter dropdown includes "Cancelled" option
- Admins can view all cancelled leaves

## Database Schema Updates

### Absence Model (`src/models/Absence.js`)
```javascript
status: { 
  type: String, 
  enum: ["Pending", "Approved", "Rejected", "Cancelled"],
  default: "Pending" 
},
cancelledBy: { type: String, default: "" },
cancellationDate: { type: Date },
cancellationReason: { type: String, default: "" }
```

## API Endpoints

### PUT /api/absence
**Cancel Action:**
```json
{
  "_id": "absence_id",
  "action": "cancel",
  "cancelledBy": "EMP001",
  "cancellationReason": "Cancelled by employee"
}
```

**Response:**
```json
{
  "success": true,
  "absence": {
    "status": "Cancelled",
    "cancellationDate": "2024-01-15T10:30:00.000Z",
    "cancelledBy": "EMP001",
    "cancellationReason": "Cancelled by employee"
  }
}
```

## Workflow Example

### Scenario: Employee cancels approved leave for today

1. **Employee clicks Cancel button** → Confirmation dialog appears
2. **Confirms cancellation** → API call to PUT /api/absence with action="cancel"
3. **Backend processes:**
   - Updates absence status to "Cancelled"
   - Deletes "Leave" attendance records for those dates
   - Checks timecard for login activity
   - If logged in → creates "Present" attendance
   - If not logged in → no attendance record (Absent)
4. **Frontend updates:**
   - Shows success message
   - Refreshes absence list
   - Cancel button disappears (status now "Cancelled")
5. **Employee can now login:**
   - timecardService checks for "Approved" leaves only
   - Cancelled leave doesn't block login
   - Employee can punch in normally

## Testing Checklist

- [x] Employee can cancel Pending leave
- [x] Employee can cancel Approved leave
- [x] Employee cannot cancel Rejected leave
- [x] Employee cannot cancel already Cancelled leave
- [x] Cancelled leave shows in history with "Cancelled" badge
- [x] Attendance records removed after cancellation
- [x] If employee logged in before cancellation, attendance shows "Present"
- [x] If employee didn't login, attendance shows "Absent"
- [x] Employee can login after cancelling today's leave
- [x] Filter works for "Cancelled" status
- [x] Cancellation metadata saved (cancelledBy, date, reason)

## Files Modified

1. `src/models/Absence.js` - Added Cancelled status and cancellation fields
2. `src/app/api/absence/route.js` - Implemented cancel logic with attendance recalculation
3. `src/app/absence/page.js` - Added cancel button and UI updates
4. `src/app/admin-absence/page.js` - Added Cancelled status support
5. `src/app/services/timecardService.js` - Already supports cancelled leaves (no changes needed)

## Notes

- Cancellation is irreversible - once cancelled, leave cannot be reactivated
- Cancelled leaves count towards leave history but not towards leave balance
- Attendance recalculation happens automatically during cancellation
- No manual intervention needed for attendance updates
- Login blocking only applies to "Approved" status, not "Cancelled"
