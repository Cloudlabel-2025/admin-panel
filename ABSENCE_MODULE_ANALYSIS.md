# Absence Module - Analysis & Enhancement Document

## Current Implementation Analysis

### 1. Current Features
✅ **Working Features:**
- Employee absence request submission
- Multiple leave types (Sick, Casual, Emergency, Personal, Medical, Maternity, Paternity)
- Approval/Rejection workflow
- Date conflict detection
- Notification system for approvers
- Attendance record creation on approval
- Role-based access (Admin, Team-Lead, Team-admin, Employee)

### 2. Current Workflow
```
Employee → Submit Request → Pending Status → Approver Review → Approved/Rejected
                                                    ↓
                                            (If Approved)
                                                    ↓
                                    Create Attendance Records (Status: Leave)
```

### 3. Current Database Schema
```javascript
{
  employeeId: String,
  employeeName: String,
  department: String,
  absenceType: Enum (7 types),
  startDate: Date,
  endDate: Date,
  totalDays: Number (auto-calculated),
  reason: String,
  status: Enum (Pending, Approved, Rejected),
  approvedBy: String,
  approvalDate: Date,
  comments: String,
  isLOP: Boolean (Loss of Pay),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Critical Issues Identified

### 🔴 Issue 1: No Leave Balance Tracking
**Problem:** System doesn't track available leave balance per employee
**Impact:** Employees can request unlimited leaves, no quota management

### 🔴 Issue 2: No Leave Type Quotas
**Problem:** No annual limits for different leave types (e.g., 12 sick leaves/year)
**Impact:** Cannot enforce company leave policies

### 🔴 Issue 3: Weekend/Holiday Handling
**Problem:** Leave days include weekends and holidays in count
**Impact:** Incorrect leave balance deduction

### 🔴 Issue 4: No Carry Forward Logic
**Problem:** Unused leaves don't carry forward to next year
**Impact:** Cannot implement carry-forward policies

### 🔴 Issue 5: No Half-Day Leave Support
**Problem:** Only full-day leaves supported
**Impact:** Inflexible leave management

### 🔴 Issue 6: Missing Document Upload
**Problem:** No medical certificate or proof attachment
**Impact:** Cannot verify sick/medical leaves

### 🔴 Issue 7: No Leave History/Analytics
**Problem:** No reporting on leave patterns, trends, or abuse detection
**Impact:** Poor visibility for management

### 🔴 Issue 8: Weak Attendance Integration
**Problem:** Attendance records created but not synchronized properly
**Impact:** Attendance and absence data can become inconsistent

---

## Attendance-Absence Integration Analysis

### Current Integration Points
1. **On Approval:** Creates attendance records with status "Leave"
2. **On Cancellation:** Deletes attendance records
3. **Data Flow:** Absence → Attendance (one-way)

### Integration Gaps
❌ No validation against existing attendance (login/logout)
❌ No synchronization when attendance is modified
❌ No conflict resolution (e.g., employee logged in but has approved leave)
❌ No retroactive leave application handling
❌ No leave balance update based on attendance

---

## Proposed Enhancements

### Phase 1: Leave Balance Management (High Priority)

#### 1.1 Leave Balance Schema
```javascript
LeaveBalance {
  employeeId: String,
  year: Number,
  leaveType: String,
  allocated: Number,
  used: Number,
  pending: Number,
  available: Number,
  carriedForward: Number,
  lapsed: Number,
  updatedAt: Date
}
```

#### 1.2 Leave Policy Schema
```javascript
LeavePolicy {
  leaveType: String,
  annualQuota: Number,
  maxConsecutiveDays: Number,
  minNoticeDays: Number,
  maxCarryForward: Number,
  requiresDocument: Boolean,
  documentRequiredAfterDays: Number,
  isLOP: Boolean,
  applicableRoles: [String],
  applicableDepartments: [String],
  active: Boolean
}
```

#### 1.3 Implementation
- Auto-initialize leave balance on employee creation
- Deduct from balance on approval
- Restore on rejection/cancellation
- Block requests exceeding available balance
- Annual reset with carry-forward logic

### Phase 2: Enhanced Absence Features (High Priority)

#### 2.1 Half-Day Leave Support
```javascript
Absence {
  ...existing fields,
  isHalfDay: Boolean,
  halfDayPeriod: Enum (Morning, Afternoon),
  actualDays: Number // 0.5 for half-day, 1 for full-day
}
```

#### 2.2 Document Management
```javascript
Absence {
  ...existing fields,
  documents: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  documentVerified: Boolean,
  verifiedBy: String,
  verificationDate: Date
}
```

#### 2.3 Advanced Validations
- Minimum notice period check
- Maximum consecutive days limit
- Document requirement based on days
- Blackout dates (company events, peak periods)
- Team availability check (max X% on leave)

### Phase 3: Attendance-Absence Integration (Critical)

#### 3.1 Bidirectional Sync
```javascript
// When absence approved
1. Check if attendance exists for dates
2. If attendance exists with login/logout:
   - Mark as conflict
   - Require admin resolution
3. Create/Update attendance with Leave status
4. Lock attendance records (prevent modification)

// When attendance marked
1. Check if approved leave exists
2. If leave exists:
   - Show warning
   - Allow override with reason
   - Update leave status to "Attendance Marked"
```

#### 3.2 Conflict Resolution
```javascript
AttendanceLeaveConflict {
  employeeId: String,
  date: Date,
  attendanceId: ObjectId,
  absenceId: ObjectId,
  conflictType: Enum (LoginDuringLeave, LeaveAfterAttendance),
  status: Enum (Pending, Resolved),
  resolution: String,
  resolvedBy: String,
  resolvedAt: Date
}
```

#### 3.3 Retroactive Leave Application
- Allow leave application for past dates (with approval)
- Update existing attendance records
- Recalculate work hours and status
- Maintain audit trail

### Phase 4: Analytics & Reporting (Medium Priority)

#### 4.1 Leave Analytics Dashboard
- Leave utilization by employee/department
- Leave trends (monthly, quarterly, yearly)
- Most common leave types
- Average leave duration
- Leave abuse detection (patterns)
- Team availability calendar

#### 4.2 Reports
- Monthly leave summary
- Leave balance report
- Pending approvals report
- Leave forecast (upcoming leaves)
- Compliance report (policy violations)

### Phase 5: Advanced Features (Low Priority)

#### 5.1 Leave Encashment
- Track encashable leaves
- Calculate encashment amount
- Generate encashment requests

#### 5.2 Compensatory Off (Comp-Off)
- Track overtime/weekend work
- Convert to comp-off credits
- Apply comp-off as leave

#### 5.3 Leave Calendar
- Visual calendar showing team leaves
- Drag-drop leave planning
- Team availability view

---

## Database Schema Changes

### New Collections Required

#### 1. LeaveBalance
```javascript
{
  employeeId: String (indexed),
  year: Number (indexed),
  balances: [{
    leaveType: String,
    allocated: Number,
    used: Number,
    pending: Number,
    available: Number,
    carriedForward: Number,
    lapsed: Number
  }],
  lastUpdated: Date
}
```

#### 2. LeavePolicy
```javascript
{
  policyId: String,
  leaveType: String,
  annualQuota: Number,
  maxConsecutiveDays: Number,
  minNoticeDays: Number,
  maxCarryForward: Number,
  carryForwardExpiryMonths: Number,
  requiresDocument: Boolean,
  documentRequiredAfterDays: Number,
  isLOP: Boolean,
  canApplyRetroactive: Boolean,
  retroactiveDaysLimit: Number,
  applicableRoles: [String],
  applicableDepartments: [String],
  blackoutDates: [Date],
  active: Boolean,
  effectiveFrom: Date,
  effectiveTo: Date
}
```

#### 3. LeaveTransaction
```javascript
{
  employeeId: String,
  absenceId: ObjectId,
  leaveType: String,
  transactionType: Enum (Debit, Credit, Adjustment),
  days: Number,
  balanceBefore: Number,
  balanceAfter: Number,
  reason: String,
  performedBy: String,
  performedAt: Date
}
```

#### 4. AttendanceLeaveConflict
```javascript
{
  employeeId: String,
  date: Date,
  attendanceId: ObjectId,
  absenceId: ObjectId,
  conflictType: String,
  conflictDetails: String,
  status: Enum (Pending, Resolved, Ignored),
  resolution: String,
  resolvedBy: String,
  resolvedAt: Date,
  createdAt: Date
}
```

### Modified Collections

#### Absence (Enhanced)
```javascript
{
  ...existing fields,
  isHalfDay: Boolean,
  halfDayPeriod: Enum (Morning, Afternoon),
  actualDays: Number,
  workingDays: Number, // Excluding weekends/holidays
  documents: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  documentVerified: Boolean,
  verifiedBy: String,
  verificationDate: Date,
  isRetroactive: Boolean,
  appliedOn: Date,
  leaveBalanceSnapshot: {
    before: Number,
    after: Number
  },
  cancellationReason: String,
  cancelledBy: String,
  cancelledAt: Date
}
```

#### Attendance (Enhanced)
```javascript
{
  ...existing fields,
  isLeave: Boolean,
  leaveId: ObjectId,
  isLocked: Boolean, // Locked when leave approved
  lockedBy: String,
  lockedAt: Date
}
```

---

## API Endpoints Required

### Leave Balance APIs
```
GET    /api/leave-balance?employeeId=X&year=Y
POST   /api/leave-balance/initialize
PUT    /api/leave-balance/adjust
GET    /api/leave-balance/summary?department=X
```

### Leave Policy APIs
```
GET    /api/leave-policy
POST   /api/leave-policy
PUT    /api/leave-policy/:id
DELETE /api/leave-policy/:id
GET    /api/leave-policy/applicable?employeeId=X
```

### Enhanced Absence APIs
```
POST   /api/absence/validate (check balance, conflicts)
POST   /api/absence/upload-document
GET    /api/absence/conflicts
PUT    /api/absence/resolve-conflict
GET    /api/absence/analytics
GET    /api/absence/calendar?department=X&month=Y
```

### Integration APIs
```
POST   /api/attendance-absence/sync
GET    /api/attendance-absence/conflicts
PUT    /api/attendance-absence/resolve
POST   /api/attendance-absence/retroactive-leave
```

---

## Implementation Priority

### Sprint 1 (Week 1-2): Foundation
- [ ] Create LeaveBalance schema and model
- [ ] Create LeavePolicy schema and model
- [ ] Implement leave balance initialization
- [ ] Add balance check on absence request
- [ ] Update absence approval to deduct balance

### Sprint 2 (Week 3-4): Enhanced Features
- [ ] Add half-day leave support
- [ ] Implement document upload
- [ ] Add weekend/holiday exclusion logic
- [ ] Implement policy validations (notice period, max days)
- [ ] Add leave balance APIs

### Sprint 3 (Week 5-6): Integration
- [ ] Create AttendanceLeaveConflict schema
- [ ] Implement conflict detection
- [ ] Add bidirectional sync
- [ ] Implement retroactive leave application
- [ ] Add conflict resolution workflow

### Sprint 4 (Week 7-8): Analytics & Polish
- [ ] Build leave analytics dashboard
- [ ] Add reporting APIs
- [ ] Implement leave calendar
- [ ] Add pagination to absence records
- [ ] Performance optimization

---

## Business Rules to Implement

### Leave Balance Rules
1. Annual allocation on Jan 1st or joining date
2. Carry forward max 5 days (configurable)
3. Carried leaves expire after 3 months
4. Negative balance not allowed (except LOP)
5. Pending requests block balance

### Approval Rules
1. Team-Lead approves up to 3 days
2. Admin approves 4-7 days
3. Super-admin approves 7+ days
4. Medical leave >3 days requires certificate
5. Emergency leave can be retroactive (max 2 days)

### Attendance Integration Rules
1. Approved leave locks attendance
2. Login during leave creates conflict
3. Retroactive leave requires attendance unlock
4. Half-day leave allows 4 hours work
5. Leave cancellation restores attendance

---

## Testing Checklist

### Unit Tests
- [ ] Leave balance calculation
- [ ] Working days calculation (exclude weekends/holidays)
- [ ] Policy validation logic
- [ ] Conflict detection logic
- [ ] Balance deduction/restoration

### Integration Tests
- [ ] Absence approval → Attendance creation
- [ ] Absence cancellation → Attendance deletion
- [ ] Retroactive leave → Attendance update
- [ ] Conflict resolution → Data sync

### E2E Tests
- [ ] Employee submits leave → Approval → Balance deduction
- [ ] Employee applies retroactive leave → Conflict resolution
- [ ] Admin adjusts balance → Reflects in reports
- [ ] Leave with document → Verification workflow

---

## Migration Plan

### Step 1: Data Migration
```javascript
// Initialize leave balances for all employees
for each employee:
  - Get joining date
  - Calculate pro-rata allocation
  - Get approved absences (current year)
  - Calculate used leaves
  - Create LeaveBalance record
```

### Step 2: Policy Setup
```javascript
// Create default leave policies
Sick Leave: 12 days/year, max 5 consecutive, no notice
Casual Leave: 12 days/year, max 3 consecutive, 1 day notice
Emergency Leave: 5 days/year, retroactive allowed
Medical Leave: 10 days/year, certificate required >3 days
```

### Step 3: Attendance Sync
```javascript
// Link existing absences to attendance
for each approved absence:
  - Find attendance records for date range
  - Link absenceId to attendance
  - Mark attendance as locked
```

---

## Estimated Effort

| Phase | Tasks | Effort (Days) |
|-------|-------|---------------|
| Phase 1: Leave Balance | Schema, APIs, Balance logic | 10 days |
| Phase 2: Enhanced Features | Half-day, Documents, Validations | 8 days |
| Phase 3: Integration | Conflict detection, Sync, Retroactive | 12 days |
| Phase 4: Analytics | Dashboard, Reports, Calendar | 8 days |
| Testing & Bug Fixes | Unit, Integration, E2E tests | 6 days |
| Documentation | API docs, User guide | 2 days |
| **Total** | | **46 days (~9 weeks)** |

---

## Success Metrics

1. **Leave Balance Accuracy**: 100% accurate balance tracking
2. **Conflict Resolution**: <1% unresolved conflicts
3. **Approval Time**: <24 hours average approval time
4. **User Satisfaction**: >90% positive feedback
5. **System Performance**: <2s API response time
6. **Data Consistency**: 100% attendance-absence sync

---

## Conclusion

The current absence module has basic functionality but lacks critical features for enterprise-grade leave management. The proposed enhancements will:

1. ✅ Enable proper leave balance tracking and quota management
2. ✅ Ensure attendance-absence data consistency
3. ✅ Provide flexibility with half-day leaves and retroactive applications
4. ✅ Improve compliance with document verification
5. ✅ Enhance visibility with analytics and reporting
6. ✅ Reduce conflicts with intelligent validation

**Recommendation:** Implement in 4 sprints over 9 weeks, prioritizing leave balance management and attendance integration first.
