# Timecard Workflow - Complete Implementation Guide

## 📋 Overview
This document outlines the complete timecard workflow with all business rules and validations.

---

## 🔄 Complete Workflow

### Step 1: Login
**Timing**: Employee logs in at start of day

**Business Rules**:
- ✅ **Before 10:00 AM** → Normal login
- ❌ **After 10:00 AM** → Mark as late login + Notify admins
- 🚫 **Duplicate Prevention** → Only one login per day allowed
- 📝 **Daily Task Integration** → Creates first task entry "Logged in at HH:MM"

**Implementation Status**: ✅ COMPLETE
- Backend validates duplicate login
- Late login detection working
- Notifications sent to Team-admin, Team-Lead, Admin, Super-admin, Developer
- Daily task entry created automatically

**Code Location**:
- Backend: `src/app/api/timecard/route.js` - POST handler
- Frontend: `src/app/timecard-entry/page.js` - handleLogin()

---

### Step 2: Lunch Break (Mandatory 60 minutes)
**Timing**: Employee takes lunch break during work hours

**Business Rules**:
- ⏱️ **Duration**: 60 minutes (company-provided)
- 🆓 **Not counted in work hours** → Deducted from total time
- ⚠️ **If extended beyond 60 mins** → Notify admins
- 🔄 **Optional** → Employee can skip lunch (not recommended)
- 🚫 **Cannot take during break** → Must complete break first
- 🚫 **Cannot take after logout** → Must be during work hours

**Workflow**:
1. Employee clicks "Lunch Out" → Records time
2. Daily task: Updates last task end time to lunch out time
3. Employee clicks "Lunch In" → Records time
4. System calculates duration: `lunchIn - lunchOut`
5. If duration > 60 mins → Notify admins of extension
6. Daily task: Creates new task with lunch in time as start time

**Implementation Status**: ✅ COMPLETE
- Lunch out/in tracking working
- Extension notification working
- Daily task integration working
- Only standard 60 mins deducted from work time

**Code Location**:
- Backend: `src/app/api/timecard/route.js` - PUT handler (lunchOut/lunchIn)
- Frontend: `src/app/timecard-entry/page.js` - handleLunchOut(), handleLunchIn()

---

### Step 3: Break (Max 30 minutes)
**Timing**: Employee takes short break during work hours

**Business Rules**:
- ⏱️ **Duration**: Maximum 30 minutes
- 🔢 **Frequency**: Maximum 1 break per day
- ⚠️ **If extended beyond 30 mins** → Notify admins
- 📝 **Reason required** → Must provide reason before break out
- 🚫 **Cannot take during lunch** → Must complete lunch first
- 🚫 **Cannot take after logout** → Must be during work hours
- ✅ **Counted in work hours** → Only standard 30 mins deducted

**Workflow**:
1. Employee enters break reason (mandatory, max 30 chars, letters only)
2. Employee clicks "Break Out" → Records time
3. Daily task: Updates last task end time to break out time
4. Employee clicks "Break In" → Records time
5. System calculates duration: `breakIn - breakOut`
6. If duration > 30 mins → Notify admins of extension
7. Daily task: Creates new task with break in time as start time

**Implementation Status**: ✅ COMPLETE
- Break out/in tracking working
- Extension notification working
- Daily task integration working
- Reason validation working
- Max 1 break limit enforced

**Code Location**:
- Backend: `src/app/api/timecard/route.js` - PUT handler (breaks)
- Frontend: `src/app/timecard-entry/page.js` - handleBreakOut(), handleBreakIn()

---

### Step 4: Permission
**Timing**: Employee requests permission for personal work

**Business Rules**:
- ⏱️ **Duration Options**: 30 mins, 1h, 1.5h, 2h
- 📅 **Monthly Limit**: Maximum 2 times per month
- ⚠️ **If > 2 hours** → Force Half Day attendance
- 📝 **Reason required** → Must provide detailed reason
- 🔒 **Locked after submission** → Cannot be modified
- ✅ **Can be added before login** → For early permission
- 🚫 **Cannot add tasks during active permission** → Must lock first
- 📊 **Excluded from work time** → Not counted in productivity

**Workflow**:
1. Employee selects duration (30/60/90/120 minutes)
2. Employee enters reason (mandatory)
3. Employee clicks "Add Permission" → Locks permission
4. System checks monthly limit (must be < 2)
5. If limit reached → Show error, block submission
6. If > 120 mins → Notify admins, mark as Half Day
7. Daily task: Creates permission entry when locked
8. Permission time excluded from all calculations

**Implementation Status**: ✅ COMPLETE
- Permission tracking working
- Monthly limit check working (2 times per month)
- Lock mechanism working
- Daily task integration working
- Excess time notification working
- Task addition blocked during active permission

**Code Location**:
- Backend: `src/app/api/timecard/route.js` - POST/PUT handler (permissionMinutes)
- Frontend: `src/app/timecard-entry/page.js` - handlePermissionUpdate()

---

### Step 5: Logout
**Timing**: Employee logs out at end of day

**Business Rules**:
- 🕐 **Manual Logout**: Anytime during work hours
- 🤖 **Auto Logout**: 8:30 PM (20:30) if logged in before 10:00 AM
- ✅ **Validates lunch completion** → Logs if incomplete
- ✅ **Validates break completion** → Logs if incomplete
- 📊 **Calculates work hours** → Total time - lunch - breaks - permission
- 🎯 **Determines attendance status**:
  - < 4 hours → Leave
  - 4-8 hours → Half Day
  - ≥ 8 hours → Present
  - Permission > 2h → Half Day (override)
- 📝 **Daily task integration** → Completes all tasks, adds logout entry

**Attendance Calculation**:
```javascript
totalTime = logOut - logIn
lunchTime = lunchIn - lunchOut (only standard 60 mins deducted)
breakTime = breakIn - breakOut (only standard 30 mins deducted)
permissionTime = permissionMinutes (ALL excluded)

workTime = totalTime - min(lunchTime, 60) - min(breakTime, 30)
// Note: Permission time NOT deducted from workTime

if (workTime < 4h) → Leave
else if (workTime < 8h) → Half Day
else if (permissionTime > 120) → Half Day (override)
else → Present
```

**Workflow**:
1. Employee clicks "Logout" OR auto-logout at 8:30 PM
2. System checks lunch status → Log if incomplete
3. System checks break status → Log if incomplete
4. System calculates work time
5. System determines attendance status
6. Daily task: Sets end time for all incomplete tasks
7. Daily task: Adds logout entry
8. Daily task: Marks all tasks as saved
9. Attendance: Creates attendance record

**Implementation Status**: ✅ COMPLETE
- Manual logout working
- Auto logout at 8:30 PM working
- Lunch/break validation working
- Work time calculation working
- Attendance status calculation working
- Daily task completion working
- Attendance record creation working

**Code Location**:
- Backend: `src/app/api/timecard/route.js` - PUT handler (logOut)
- Frontend: `src/app/timecard-entry/page.js` - handleLogOut(), checkAutoLogout()

---

## 📊 Work Time Calculation Details

### Formula:
```
Total Time = Logout - Login
Lunch Deduction = min(Lunch Duration, 60 mins)
Break Deduction = min(Break Duration, 30 mins)
Permission Deduction = 0 (excluded completely)

Work Time = Total Time - Lunch Deduction - Break Deduction

Unaccounted Time = Work Time - Task Time - Gaps + Excess Lunch + Excess Break + Excess Permission
```

### Example 1: Normal Day
```
Login: 09:30
Logout: 18:30
Lunch: 13:00 - 14:00 (60 mins)
Break: 16:00 - 16:30 (30 mins)
Permission: 0 mins

Total Time = 9 hours
Work Time = 9h - 1h - 0.5h = 7.5 hours
Status = Half Day (< 8 hours)
```

### Example 2: Full Day with Permission
```
Login: 09:30
Logout: 19:00
Lunch: 13:00 - 14:00 (60 mins)
Break: 16:00 - 16:30 (30 mins)
Permission: 60 mins

Total Time = 9.5 hours
Work Time = 9.5h - 1h - 0.5h = 8 hours
Permission = 1h (excluded from work time)
Status = Present (8 hours work time)
```

### Example 3: Excess Permission
```
Login: 09:30
Logout: 19:00
Lunch: 13:00 - 14:00 (60 mins)
Break: None
Permission: 150 mins (2.5 hours)

Total Time = 9.5 hours
Work Time = 9.5h - 1h = 8.5 hours
Permission = 2.5h (> 2h limit)
Status = Half Day (forced due to excess permission)
```

### Example 4: Extended Lunch & Break
```
Login: 09:30
Logout: 19:00
Lunch: 13:00 - 14:30 (90 mins)
Break: 16:00 - 17:00 (60 mins)
Permission: 0 mins

Total Time = 9.5 hours
Lunch Deduction = 60 mins (standard)
Break Deduction = 30 mins (standard)
Work Time = 9.5h - 1h - 0.5h = 8 hours

Excess Lunch = 30 mins (goes to unaccounted time)
Excess Break = 30 mins (goes to unaccounted time)
Unaccounted Time = 60 mins

Status = Present (8 hours work time)
Admins notified of extensions
```

---

## 🔔 Notification Rules

### Late Login Notification
**Triggered**: When login time > 10:00 AM
**Recipients**: Team-admin, Team-Lead, Admin, Super-admin, Developer (based on role hierarchy)
**Message**: "{Name} ({ID}) logged in late at {time}. Required: 10:00"

### Lunch Extension Notification
**Triggered**: When lunch duration > 60 minutes
**Recipients**: Team-admin, Team-Lead, Admin, Super-admin, Developer (based on role hierarchy)
**Message**: "{Name} ({ID}) extended lunch by {X} minutes"

### Break Extension Notification
**Triggered**: When break duration > 30 minutes
**Recipients**: Team-admin, Team-Lead, Admin, Super-admin, Developer (based on role hierarchy)
**Message**: "{Name} ({ID}) extended break by {X} minutes"

### Permission Excess Notification
**Triggered**: When permission > 120 minutes
**Recipients**: Team-admin, Team-Lead, Admin, Super-admin, Developer (based on role hierarchy)
**Message**: "{Name} ({ID}) extended permission by {X} minutes"

---

## 🚫 Validation Rules

### Login Validations:
- ✅ Only one login per day
- ✅ Cannot login after logout
- ✅ Must provide employee ID

### Lunch Validations:
- ✅ Cannot take lunch during break
- ✅ Cannot take lunch after logout
- ✅ Cannot take lunch out if already out
- ✅ Cannot take lunch in if not out

### Break Validations:
- ✅ Maximum 1 break per day
- ✅ Reason required (max 30 chars, letters only)
- ✅ Cannot take break during lunch
- ✅ Cannot take break after logout
- ✅ Cannot take break out if already out
- ✅ Cannot take break in if not out

### Permission Validations:
- ✅ Minimum 30 minutes
- ✅ Maximum 120 minutes per day
- ✅ Maximum 2 times per month
- ✅ Reason required
- ✅ Cannot modify after locked
- ✅ Cannot add tasks during active permission

### Logout Validations:
- ✅ Cannot logout before login
- ✅ Cannot logout twice
- ✅ Must complete ongoing break/lunch

---

## 📝 Daily Task Integration

### Login → Daily Task
- Creates first task: "Logged in at HH:MM"
- Status: "In Progress"
- Start time: Login time

### Lunch Out → Daily Task
- Updates last task end time to lunch out time
- Creates lunch task: "Lunch break started at HH:MM"
- Status: "In Progress"

### Lunch In → Daily Task
- Updates lunch task end time to lunch in time
- Creates new task with lunch in time as start time
- Status: "In Progress"

### Break Out → Daily Task
- Updates last task end time to break out time

### Break In → Daily Task
- Creates new task with break in time as start time
- Status: "In Progress"

### Permission Locked → Daily Task
- Creates permission task: "Permission: Xh Ym"
- Status: "Completed"
- Marked as saved

### Logout → Daily Task
- Updates last task end time to logout time
- Creates logout task: "Logged out at HH:MM"
- Status: "Completed"
- Marks all tasks as saved

---

## ✅ Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Login (Normal) | ✅ Complete | Working |
| Login (Late Detection) | ✅ Complete | Notifies admins |
| Duplicate Login Prevention | ✅ Complete | Backend + Frontend |
| Lunch Out/In | ✅ Complete | Working |
| Lunch Extension Notification | ✅ Complete | Working |
| Break Out/In | ✅ Complete | Max 1 break |
| Break Extension Notification | ✅ Complete | Working |
| Permission (Before Login) | ✅ Complete | Working |
| Permission (After Login) | ✅ Complete | Working |
| Permission Monthly Limit | ✅ Complete | 2 times/month |
| Permission Lock | ✅ Complete | Cannot modify |
| Manual Logout | ✅ Complete | Working |
| Auto Logout (8:30 PM) | ✅ Complete | Working |
| Work Time Calculation | ✅ Complete | Accurate |
| Attendance Status | ✅ Complete | Present/Half/Leave |
| Daily Task Integration | ✅ Complete | All events tracked |
| Attendance Record | ✅ Complete | Auto-created |
| No Duplicates | ✅ Complete | Fixed |

---

## 🎯 Summary

**All 5 steps are fully implemented and working:**

1. ✅ **Login** - Normal/Late detection, notifications, duplicate prevention
2. ✅ **Lunch** - Optional, 60 mins, extension notifications, not counted in work
3. ✅ **Break** - Optional, max 30 mins, max 1 per day, extension notifications
4. ✅ **Permission** - Max 2h/day, max 2 times/month, force half day if exceeded
5. ✅ **Logout** - Manual/Auto, validates lunch/break, calculates work hours

**Key Features:**
- ✅ No duplicate data
- ✅ Accurate time calculations
- ✅ Proper notifications
- ✅ Daily task integration
- ✅ Attendance record creation
- ✅ All validations working

**System is production-ready!** 🚀
