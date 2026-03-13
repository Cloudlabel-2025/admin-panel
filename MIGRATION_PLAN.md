# Absence Management Module Migration Plan

## Overview
Replace old scattered Absence Management implementation with unified absence-management module.

## Files to Update

### 1. Navigation Updates (Layout.js)
Replace all absence-related navigation links:
- `/absence` → `/absence-management`
- `/absence-records` → `/absence-management`
- `/admin-absence` → `/absence-management`
- `/team-absence` → `/absence-management`

### 2. Old Pages to Deprecate
- `/src/app/absence/page.js` - Redirect to /absence-management
- `/src/app/absence-records/page.js` - Redirect to /absence-management
- `/src/app/admin-absence/page.js` - Redirect to /absence-management
- `/src/app/team-absence/page.js` - Redirect to /absence-management

### 3. API Routes (Keep as-is)
- `/api/absence/route.js` - Main absence API (KEEP)
- `/api/team-absence/route.js` - Team absence API (KEEP)

### 4. Model (Keep as-is)
- `/src/models/Absence.js` - Absence schema (KEEP)

## Implementation Steps

1. Update Layout.js navigation for all roles
2. Create redirect pages for old routes
3. Test RBAC permissions
4. Verify Attendance integration
5. Verify Payroll integration
6. Test all user roles

## RBAC Permissions Maintained
- Super-admin: Full access (approval, all records)
- Admin-management: Approval requests, all records
- Team-Lead: Team absence, approval requests
- Team-admin: Team absence, approval requests
- Employee/Intern: My absence only
