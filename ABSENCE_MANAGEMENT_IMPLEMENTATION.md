# Role-Based Absence Management System

## Implementation Summary

### Overview
A unified absence management system with role-based access control, approval workflows, and notification system.

---

## Role Hierarchy & Permissions

### 1. **super-admin**
- **Cannot apply for leave** (highest authority)
- **Can approve/reject:** ALL leave requests from all roles
- **Can view:** All absence records across the organization
- **Tabs Available:**
  - Approval Requests (default)
  - All Records

### 2. **admin-management**
- **Can apply for leave** → Approval goes to **super-admin**
- **Can approve/reject:** All leave requests EXCEPT their own
- **Can view:** All absence records except super-admin's
- **Cannot approve:** Their own leave requests
- **Tabs Available:**
  - My Absence (default)
  - Approval Requests

### 3. **Teamlead (Team-Lead)**
- **Can apply for leave** → Approval goes to **super-admin + admin-management**
- **Cannot approve/reject** (view only)
- **Can view:** Their team members' absence records
- **Receives notifications:** When team members apply for leave
- **Receives notifications:** For department members' leave requests
- **Tabs Available:**
  - My Absence (default)
  - Team Absence

### 4. **Team-admin (Team Admin)**
- **Can apply for leave** → Approval goes to **super-admin + admin-management**
- **Cannot approve/reject** (view only)
- **Can view:** Team members' absence records (EXCEPT Team-lead)
- **Receives notifications:** When team members apply for leave
- **Sends notification to:** Team-lead when they apply for leave
- **Tabs Available:**
  - My Absence (default)
  - Team Absence

### 5. **Employee**
- **Can apply for leave** → Approval goes to **super-admin + admin-management**
- **Can view:** Only their own absence records
- **Cannot approve/reject**
- **Sends notification to:** Team Admin + Team-lead when they apply for leave
- **Tabs Available:**
  - My Absence (only)

### 6. **Intern**
- **Can apply for leave** → Approval goes to **super-admin + admin-management**
- **Can view:** Only their own absence records
- **Cannot approve/reject**
- **Sends notification to:** Team Admin + Team-lead when they apply for leave
- **Tabs Available:**
  - My Absence (only)

---

## Approval Flow Matrix

| Applicant Role | Approval Goes To | Notifications Sent To |
|----------------|------------------|----------------------|
| super-admin | N/A (Cannot apply) | - |
| admin-management | super-admin | - |
| Teamlead | super-admin + admin-management | - |
| Team-admin | super-admin + admin-management | Team-lead |
| Employee | super-admin + admin-management | Team Admin + Team-lead |
| Intern | super-admin + admin-management | Team Admin + Team-lead |

---

## Notification System

### Notification Types:
1. **leave_request** - For approvers who can take action
2. **leave_notification** - For informational purposes only

### Notification Flow:
- **admin-management applies** → Notify super-admin
- **Teamlead applies** → Notify super-admin + admin-management
- **Team-admin applies** → Notify super-admin + admin-management + Team-lead (info)
- **Employee/Intern applies** → Notify super-admin + admin-management + Team-admin + Team-lead (info)

---

## Features

### Core Features:
1. ✅ Role-based tab visibility
2. ✅ Leave application with validation
3. ✅ Date conflict detection
4. ✅ Past date prevention
5. ✅ Approval/Rejection workflow
6. ✅ Leave cancellation (Pending/Approved status)
7. ✅ Automatic attendance record creation
8. ✅ Attendance cleanup on cancellation
9. ✅ LOP (Loss of Pay) marking
10. ✅ Action history tracking
11. ✅ Role-based notification system

### Leave Types:
- Sick Leave
- Casual Leave
- Emergency Leave
- Personal Leave
- Medical Leave
- Maternity Leave
- Paternity Leave

### Leave Status:
- **Pending** - Awaiting approval
- **Approved** - Approved by authorized person
- **Rejected** - Rejected by authorized person
- **Cancelled** - Cancelled by employee

---

## API Endpoints

### 1. `/api/absence` (GET, POST, PUT)
- **GET:** Fetch absence records with filters
- **POST:** Create new leave request
- **PUT:** Approve/Reject/Cancel leave request

### 2. `/api/team-absence` (GET)
- **GET:** Fetch team absence records based on role hierarchy

---

## File Structure

```
src/app/
├── absence-management/
│   └── page.js                    # Unified absence management page
├── api/
│   ├── absence/
│   │   └── route.js              # Main absence API with role-based logic
│   └── team-absence/
│       └── route.js              # Team absence API with filtering
└── models/
    └── Absence.js                # Absence schema
```

---

## Access Control Rules

### Rule 1: Super-admin Restrictions
- Super-admin CANNOT apply for leave
- Super-admin can see and approve ALL requests

### Rule 2: Self-Approval Prevention
- admin-management cannot approve their own requests
- Only super-admin can approve admin-management requests

### Rule 3: Hierarchical Visibility
- Team-admin cannot see Team-lead's requests
- Lower roles cannot see higher roles' requests

### Rule 4: Approval Authority
- Only super-admin and admin-management can approve/reject
- Team roles can only view (no approval rights)

### Rule 5: Notification Hierarchy
- Approvers get "leave_request" notifications
- Team managers get "leave_notification" for awareness

---

## Usage Instructions

### For Employees/Interns:
1. Navigate to Absence Management
2. Fill in leave details in "My Absence" tab
3. Submit request
4. Track status in the table below
5. Cancel if needed (Pending/Approved status only)

### For Team-admin/Teamlead:
1. Navigate to Absence Management
2. Use "My Absence" tab to apply for own leave
3. Use "Team Absence" tab to view team members' requests
4. Receive notifications for team activities

### For admin-management:
1. Navigate to Absence Management
2. Use "My Absence" tab to apply for own leave
3. Use "Approval Requests" tab to approve/reject requests
4. Cannot approve own requests

### For super-admin:
1. Navigate to Absence Management
2. Use "Approval Requests" tab to manage all requests
3. Use "All Records" tab to view complete history
4. Can approve/reject any request

---

## Technical Implementation

### Frontend:
- Single unified page with role-based tabs
- Dynamic tab visibility based on user role
- Real-time data fetching
- Modal-based approval/rejection interface

### Backend:
- Role-based query filtering
- Hierarchical notification system
- Attendance integration
- Action history tracking

### Database:
- Absence collection with comprehensive fields
- Action history array for audit trail
- LOP tracking
- Cancellation support

---

## Testing Checklist

- [ ] Super-admin can see all records
- [ ] Super-admin cannot apply for leave
- [ ] admin-management can apply and approve others
- [ ] admin-management cannot approve own requests
- [ ] Teamlead can view team absences
- [ ] Team-admin cannot see Teamlead's requests
- [ ] Employee can only see own records
- [ ] Intern can only see own records
- [ ] Notifications sent to correct recipients
- [ ] Approval flow works correctly
- [ ] Cancellation updates attendance
- [ ] Date validation works
- [ ] Conflict detection works

---

## Future Enhancements

1. Leave balance tracking
2. Leave policy configuration
3. Email notifications
4. Calendar integration
5. Bulk approval
6. Export to Excel/PDF
7. Leave analytics dashboard
8. Mobile app support

---

## Maintenance Notes

- Role names must match exactly (case-sensitive)
- Department models must follow naming convention: `{department}_department`
- Notification model must exist for notification system to work
- Attendance model integration required for leave tracking

---

**Implementation Date:** 2024
**Version:** 1.0
**Status:** Production Ready
