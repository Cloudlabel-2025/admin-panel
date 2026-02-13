# Complete Solution Document - Admin Panel System

## Executive Summary
This is a comprehensive Employee Management System built with Next.js 14, MongoDB, and Bootstrap. The system manages employee lifecycle, attendance tracking, task management, payroll processing, and performance evaluation with role-based access control.

---

## 1. System Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, Bootstrap 5
- **Backend**: Next.js API Routes (Serverless)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **Mobile**: Capacitor (Android support)

### Project Structure
```
admin-panel/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes (backend)
│   │   ├── components/        # Reusable components
│   │   ├── utilis/           # Utility functions
│   │   └── [modules]/        # Feature modules
│   └── models/               # MongoDB schemas
├── public/                   # Static assets
└── android/                  # Mobile app build
```

---

## 2. Core Modules

### 2.1 Authentication & Authorization
**Files**: `src/app/api/auth/`, `src/models/User.js`, `src/app/utilis/authMiddleware.js`

**Features**:
- JWT-based authentication with token expiry
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token refresh mechanism
- Session management

**Roles Hierarchy**:
1. **Super Admin** - Full system access
2. **Admin** - Department-wide access
3. **Team Lead** - Team management
4. **Team Admin** - Team operations
5. **Employee/Intern** - Self-service access

**Implementation**:
```javascript
// Token stored in localStorage
localStorage.setItem('token', jwtToken);
localStorage.setItem('userRole', role);
localStorage.setItem('employeeId', id);

// Middleware protection
export const requireAuth = (handler) => async (req) => {
  const token = req.headers.get('authorization');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Verify JWT and proceed
};
```

---

### 2.2 Employee Management
**Files**: `src/models/Employee.js`, `src/app/api/Employee/`

**Features**:
- Multi-department employee records (Technical, Functional, Production, OIC, Management)
- Employee CRUD operations
- Department-wise segregation
- Employee profile management
- Skill tracking
- Document management

**Schema Structure**:
```javascript
{
  employeeId: String (unique),
  firstName, lastName: String,
  email: String (unique),
  department: String,
  designation: String,
  role: String (RBAC role),
  joiningDate: Date,
  payroll: { salary, bankDetails },
  skills: [{ skillId, proficiency }],
  status: 'Active' | 'Terminated'
}
```

**Department Models**: Each department has separate collection (`Technical_department`, `Functional_department`, etc.)

---

### 2.3 Timecard & Attendance System
**Files**: `src/models/Timecard.js`, `src/models/Attendance.js`, `src/app/api/timecard/`, `src/app/api/attendance/`

**Features**:
- **Login/Logout Tracking**: Automatic time capture
- **Lunch Break Management**: Lunch out/in with duration tracking
- **Break Management**: Up to 1 break (30 min standard)
- **Permission System**: 
  - Max 2 permissions per month
  - Minimum 30 minutes per permission
  - Max 2 hours without penalty
  - Excess time affects attendance status
- **Late Login Detection**: Automatic notification to admins
- **Auto-logout**: System logout at midnight if not logged out
- **Attendance Status Calculation**:
  - Present: ≥8 hours effective work
  - Half Day: 4-8 hours effective work
  - Leave: <4 hours work

**Timecard Schema**:
```javascript
{
  employeeId: String,
  date: Date,
  logIn, logOut: String (HH:mm),
  lunchOut, lunchIn: String,
  breaks: [{ breakOut, breakIn, reason }],
  permissionMinutes: Number,
  permissionReason: String,
  permissionLocked: Boolean,
  permissionCount: Number,
  lateLogin: Boolean,
  lateLoginMinutes: Number,
  attendanceStatus: 'Present' | 'Half Day' | 'Leave',
  workMinutes: Number,
  totalHours: String
}
```

**Business Rules**:
1. Required login time: 10:00 AM (configurable)
2. Standard lunch: 60 minutes
3. Standard break: 30 minutes
4. Required work hours: 8 hours
5. Grace time: 60 minutes
6. Permission limit: 2 hours (excess affects status)
7. Monthly permission limit: 2 times

**Notifications**:
- Late login alerts to Team Lead, Admin, Super Admin
- Break/Lunch extension alerts
- Permission excess alerts

---

### 2.4 Daily Task Management
**Files**: `src/models/Dailytask.js`, `src/app/api/daily-task/`, `src/app/daily-task/page.js`

**Features**:
- Task tracking with start/end times
- Status management (In Progress, Completed, Pending, On Hold, Blocked)
- Automatic time synchronization with timecard events
- Task cannot be added during active permission
- Previous task auto-completes when new task starts
- System-controlled start/end times (no manual editing)

**Task Schema**:
```javascript
{
  employeeId: String,
  employeeName: String,
  date: Date,
  tasks: [{
    Serialno: Number,
    details: String,
    startTime, endTime: String,
    status: String,
    remarks: String,
    link: String,
    feedback: String,
    isSaved: Boolean,
    isLogout: Boolean,
    isLunchOut: Boolean,
    isPermission: Boolean
  }]
}
```

**Task Flow**:
1. Login → First task created automatically
2. Add Task → Previous task ends, new task starts
3. Lunch Out → Last task ends
4. Lunch In → New task starts
5. Break Out → Last task ends
6. Break In → New task starts
7. Permission → No tasks can be added during active permission
8. Logout → All tasks marked as saved

**Productivity Metrics**:
- Total task time
- Effective work time (excluding permission)
- Unaccounted time
- Task completion rate

---

### 2.5 Absence Management
**Files**: `src/models/Absence.js`, `src/app/api/absence/`

**Features**:
- Leave request submission
- Multi-level approval workflow
- Leave type categorization
- Date conflict detection
- LOP (Loss of Pay) marking
- Notification system for approvers

**Leave Types**:
- Sick Leave
- Casual Leave
- Emergency Leave
- Personal Leave
- Medical Leave
- Maternity Leave
- Paternity Leave

**Absence Schema**:
```javascript
{
  employeeId: String,
  employeeName: String,
  department: String,
  absenceType: String (enum),
  startDate, endDate: Date,
  totalDays: Number (auto-calculated),
  reason: String,
  status: 'Pending' | 'Approved' | 'Rejected',
  approvedBy: String,
  approvalDate: Date,
  isLOP: Boolean
}
```

**Workflow**:
1. Employee submits leave request
2. System checks for date conflicts
3. Notifications sent to Team Lead, Team Admin, Admin, Super Admin
4. Approver reviews and approves/rejects
5. Employee receives notification
6. Approved leaves affect attendance and payroll

---

### 2.6 Payroll System
**Files**: `src/models/Payroll.js`, `src/app/api/payroll/`

**Features**:
- Monthly payroll generation
- Salary structure breakdown
- Attendance-based calculations
- Deduction management
- Salary hike tracking
- Payslip generation

**Salary Components**:
**Earnings**:
- Basic Salary (50% of gross)
- HRA (20%)
- DA (15%)
- Conveyance (10%)
- Medical (5%)
- Bonus
- Incentive
- Overtime Pay (1.5x hourly rate)

**Deductions**:
- PF (12% of basic)
- ESI (0.75% if salary ≤ ₹21,000)
- Professional Tax
- Income Tax
- LOP Deduction (based on absent days)
- Loan Deduction
- Advance Deduction

**Payroll Schema**:
```javascript
{
  employeeId: String,
  payPeriod: String (YYYY-MM),
  grossSalary: Number,
  basicSalary, hra, da, conveyance, medical: Number,
  bonus, incentive, overtimePay: Number,
  workingDays, presentDays, absentDays, halfDays: Number,
  overtimeHours: Number,
  pf, esi, professionalTax, incomeTax: Number,
  lopDeduction, loanDeduction, otherDeductions: Number,
  totalEarnings, totalDeductions, netPay: Number,
  status: 'Draft' | 'Approved' | 'Paid',
  approvedBy, createdBy: String
}
```

**Calculation Logic**:
```javascript
// LOP Calculation
lopDays = workingDays - presentDays - (halfDays * 0.5)
lopDeduction = (grossSalary / workingDays) * lopDays

// Overtime Pay
overtimePay = overtimeHours * (grossSalary / (workingDays * 8)) * 1.5

// Net Pay
netPay = totalEarnings - totalDeductions
```

**Salary Hike Management**:
- Track salary changes over time
- Effective date-based application
- Historical salary records
- Automatic payroll adjustment

---

### 2.7 Performance Management
**Files**: `src/models/Performance.js`, `src/app/api/performance/`

**Features**:
- Performance review creation
- Multi-criteria evaluation
- Rating system
- Feedback management
- Performance history tracking

---

### 2.8 Project & Task Management
**Files**: `src/models/Project.js`, `src/models/Task.js`

**Features**:
- Project creation and tracking
- Task assignment
- Progress monitoring
- Deadline management
- Team collaboration

---

### 2.9 Notification System
**Files**: `src/models/Notification.js`, `src/app/api/notifications/`

**Features**:
- Real-time notifications
- Role-based notification routing
- Notification types:
  - Late login alerts
  - Leave requests
  - Break/lunch extensions
  - Permission alerts
  - Payroll notifications
  - Task assignments
- Read/unread status
- Notification history

**Notification Schema**:
```javascript
{
  employeeId: String,
  type: String,
  title: String,
  message: String,
  relatedId: String,
  isRead: Boolean,
  createdAt: Date
}
```

---

## 3. Key Business Logic

### 3.1 Attendance Calculation
```javascript
effectiveWorkTime = totalTime - lunchTime - breakTime - permissionTime
if (effectiveWorkTime >= 8 hours) → Present
else if (effectiveWorkTime >= 4 hours) → Half Day
else → Leave
```

### 3.2 Permission Rules
- Max 2 permissions per calendar month
- Minimum 30 minutes per permission
- First 2 hours: No penalty
- Excess time: Added to unaccounted time
- Permission time excluded from productivity metrics
- Cannot add tasks during active permission

### 3.3 Daily Task Time Management
- Start/end times are system-controlled
- Previous task ends when next event starts
- No duplicate start times allowed
- Automatic time calculation based on timecard events
- Permission entry added to task list when locked

### 3.4 Late Login Detection
```javascript
if (loginTime > requiredLoginTime) {
  lateLogin = true
  lateLoginMinutes = loginTime - requiredLoginTime
  // Notify Team Lead, Admin, Super Admin
}
```

### 3.5 Payroll Generation
1. Fetch employee salary (considering hikes)
2. Get attendance data for pay period
3. Calculate earnings (basic + allowances + overtime)
4. Calculate deductions (PF + ESI + LOP + loans)
5. Compute net pay
6. Generate payslip
7. Notify employee

---

## 4. API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

### Employee
- `GET /api/Employee?employeeId={id}` - Get employee
- `GET /api/Employee/search?department={dept}` - Search employees
- `POST /api/Employee` - Create employee
- `PUT /api/Employee` - Update employee
- `DELETE /api/Employee/{id}` - Delete employee

### Timecard
- `GET /api/timecard?employeeId={id}` - Get timecard
- `POST /api/timecard` - Create timecard (login)
- `PUT /api/timecard` - Update timecard (logout, lunch, break, permission)

### Daily Task
- `GET /api/daily-task?employeeId={id}&date={date}` - Get tasks
- `POST /api/daily-task` - Create/update tasks
- `PUT /api/daily-task` - Update task actions

### Attendance
- `GET /api/attendance?employeeId={id}` - Get attendance
- `POST /api/attendance` - Generate attendance from timecard

### Absence
- `GET /api/absence?employeeId={id}` - Get leave requests
- `POST /api/absence` - Submit leave request
- `PUT /api/absence` - Approve/reject leave

### Payroll
- `GET /api/payroll?employeeId={id}&payPeriod={period}` - Get payroll
- `POST /api/payroll` - Generate payroll
- `PUT /api/payroll` - Update payroll or process salary hike

### Notifications
- `GET /api/notifications?employeeId={id}` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications` - Mark as read

---

## 5. Security Features

### Authentication
- JWT tokens with expiry
- Secure password hashing (bcrypt)
- Token refresh mechanism
- Session timeout

### Authorization
- Role-based access control (RBAC)
- API route protection with middleware
- Department-level data isolation
- Action-level permissions

### Data Protection
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection
- CSRF protection

---

## 6. Mobile Application

### Technology
- Capacitor for Android build
- Responsive web design
- Mobile-optimized UI components

### Features
- All web features available on mobile
- Native Android app
- Offline capability (limited)
- Push notifications (planned)

---

## 7. Configuration

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/admin-panel
JWT_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
REQUIRED_LOGIN_TIME=10:00
```

### System Settings
Stored in MongoDB `Settings` collection:
- Required login time
- Break duration
- Lunch duration
- Permission limits
- Working hours

---

## 8. Database Schema Summary

### Collections
1. **Users** - Authentication data
2. **{Department}_department** - Employee records per department
3. **Timecards** - Daily time tracking
4. **Attendance** - Processed attendance records
5. **Dailytasks** - Task management
6. **Absences** - Leave requests
7. **Payrolls** - Salary records
8. **Performances** - Performance reviews
9. **Projects** - Project data
10. **Tasks** - Project tasks
11. **Notifications** - System notifications
12. **Settings** - System configuration
13. **SalaryHikes** - Salary change history

---

## 9. Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Android Build
```bash
npx cap sync android
npx cap open android
# Build APK in Android Studio
```

---

## 10. Future Enhancements

### Planned Features
1. **Advanced Analytics**
   - Productivity dashboards
   - Attendance trends
   - Performance analytics

2. **Integration**
   - Email notifications
   - SMS alerts
   - Calendar sync
   - Biometric attendance

3. **Automation**
   - Auto-payroll generation
   - Leave balance tracking
   - Performance review reminders

4. **Mobile**
   - iOS app
   - Push notifications
   - Offline mode

5. **Reporting**
   - Custom report builder
   - Export to Excel/PDF
   - Scheduled reports

---

## 11. Known Limitations

1. **Timecard**: Single login per day (no multiple shifts)
2. **Permission**: Monthly limit reset on calendar month
3. **Breaks**: Limited to 1 break per day
4. **Payroll**: Manual generation required
5. **Mobile**: Limited offline functionality

---

## 12. Support & Maintenance

### Regular Tasks
- Database backup (daily)
- Log monitoring
- Performance optimization
- Security updates
- Bug fixes

### Monitoring
- API response times
- Database performance
- Error logs
- User activity

---

## Conclusion

This system provides comprehensive employee management with strong focus on attendance tracking, task management, and payroll processing. The modular architecture allows easy extension and customization based on organizational needs.
