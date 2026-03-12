# Absence Records Module - Complete Documentation

## Overview
The Absence Records module provides comprehensive tracking and reporting of all employee leave/absence requests with advanced filtering, statistics, and Excel export capabilities.

## Features Implemented

### 1. ✅ Cancellation Notifications to Admin
**Location:** `src/app/api/absence/route.js` (PUT endpoint - cancel action)

When an employee cancels their leave:
- Notifications sent to all admins, super-admins, team-leads, and team-admins
- Notification type: "leave_cancelled"
- Message includes: Employee name, leave dates
- Stored in Notification model for tracking

**Code:**
```javascript
const notifications = [];
for (const modelName of allDepartmentModels) {
  const Model = mongoose.models[modelName];
  const adminUsers = await Model.find({
    role: { $in: ["admin", "super-admin", "Team-Lead", "Team-admin"] }
  });
  
  for (const user of adminUsers) {
    notifications.push({
      recipientId: user.employeeId,
      recipientEmail: user.email,
      type: "leave_cancelled",
      title: "Leave Cancelled",
      message: `${employeeName} has cancelled their leave from ${startDate} to ${endDate}`,
      relatedId: absenceId,
      status: "unread"
    });
  }
}
```

### 2. ✅ Absence Records Page
**Location:** `src/app/absence-records/page.js`

**Features:**
- Displays all employee absence details in a comprehensive table
- Real-time statistics dashboard showing:
  - Total Leaves
  - Total Days
  - Pending count
  - Approved count
  - Rejected count
  - Cancelled count
- Responsive design with Bootstrap styling
- Loading states and error handling

**Access:** Available to all users (employees see their own, admins see all)

### 3. ✅ Month-Based Filtering
**Implementation:**
- Month picker input (YYYY-MM format)
- Filters absences that overlap with selected month
- Default: Current month
- Logic handles absences spanning multiple months

**Code:**
```javascript
if (filters.month) {
  const [year, month] = filters.month.split("-");
  filtered = filtered.filter(absence => {
    const startDate = new Date(absence.startDate);
    const endDate = new Date(absence.endDate);
    const filterStart = new Date(year, month - 1, 1);
    const filterEnd = new Date(year, month, 0);
    
    // Check if absence overlaps with selected month
    return (startDate <= filterEnd && endDate >= filterStart);
  });
}
```

### 4. ✅ Advanced Filters

**Employee Number Filter:**
- Dropdown with all employees
- Shows: First Name, Last Name, Employee ID
- When selected, shows employee-specific leave summary

**Department Filter:**
- Dropdown with all unique departments
- Dynamically populated from employee data
- Filters absences by department

**Status Filter:**
- Options: All Status, Pending, Approved, Rejected, Cancelled
- Filters records by current status

**Filter Actions:**
- "Apply" button - Applies all selected filters
- "Clear" button - Resets all filters to default

### 5. ✅ Excel Report Download
**Format:** CSV (Excel-compatible)
**Filename:** `absence_records_YYYY-MM.csv`

**Columns Included:**
1. Employee ID
2. Employee Name
3. Department
4. Leave Type
5. Start Date
6. End Date
7. Total Days
8. Reason
9. Status
10. Applied On
11. Approved By
12. Approval Date
13. Cancelled By
14. Cancellation Date

**Features:**
- Handles special characters and commas in data
- Proper CSV escaping
- Downloads only filtered data
- Disabled when no records available

**Code:**
```javascript
const downloadExcel = () => {
  const excelData = absences.map(absence => ({
    "Employee ID": absence.employeeId,
    "Employee Name": absence.employeeName,
    // ... other fields
  }));

  const headers = Object.keys(excelData[0] || {});
  const csvContent = [
    headers.join(","),
    ...excelData.map(row => 
      headers.map(header => {
        const value = row[header] || "";
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  // ... download logic
};
```

### 6. ✅ Action History Tracking
**Location:** `src/models/Absence.js` & API routes

**Schema Addition:**
```javascript
actionHistory: [{
  action: { type: String, enum: ["Applied", "Approved", "Rejected", "Cancelled"] },
  actionBy: { type: String },
  actionDate: { type: Date, default: Date.now },
  remarks: { type: String, default: "" }
}]
```

**Tracked Actions:**
1. **Applied** - When employee submits leave request
   - actionBy: Employee ID
   - remarks: "Leave application submitted"

2. **Approved** - When admin approves leave
   - actionBy: Admin/Approver ID
   - remarks: Admin comments or "Leave approved"

3. **Rejected** - When admin rejects leave
   - actionBy: Admin/Rejector ID
   - remarks: Admin comments or "Leave rejected"

4. **Cancelled** - When employee/admin cancels leave
   - actionBy: Canceller ID
   - remarks: Cancellation reason

**Visibility:**
- All actions stored in database
- Visible in absence records table
- Shows latest action details (Action By, Action Date)

### 7. ✅ Employee Leave Summary
**Location:** Absence Records page (bottom section)

**Displayed when employee filter is selected:**
- Total Approved Leave Days (in selected month)
- Total Leave Requests (in selected month)
- Pending Requests (awaiting approval)

**Visual Design:**
- Three card layout
- Color-coded (success, primary, warning)
- Large numbers for quick visibility

## Database Schema Updates

### Absence Model
```javascript
{
  employeeId: String,
  employeeName: String,
  department: String,
  absenceType: String (enum),
  startDate: Date,
  endDate: Date,
  totalDays: Number,
  reason: String,
  status: String (enum: Pending, Approved, Rejected, Cancelled),
  
  // Approval tracking
  approvedBy: String,
  approvalDate: Date,
  
  // Rejection tracking
  rejectedBy: String,
  rejectionDate: Date,
  
  // Cancellation tracking
  cancelledBy: String,
  cancellationDate: Date,
  cancellationReason: String,
  
  // Action history
  actionHistory: [{
    action: String,
    actionBy: String,
    actionDate: Date,
    remarks: String
  }],
  
  comments: String,
  isLOP: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET /api/absence
**Query Parameters:**
- `employeeId` - Filter by employee
- `status` - Filter by status
- `month` - (handled client-side)
- `department` - (handled client-side)

**Response:**
```json
[
  {
    "_id": "...",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "department": "IT",
    "absenceType": "Sick Leave",
    "startDate": "2024-01-15",
    "endDate": "2024-01-17",
    "totalDays": 3,
    "reason": "Medical appointment",
    "status": "Approved",
    "approvedBy": "ADMIN001",
    "approvalDate": "2024-01-14",
    "actionHistory": [
      {
        "action": "Applied",
        "actionBy": "EMP001",
        "actionDate": "2024-01-13",
        "remarks": "Leave application submitted"
      },
      {
        "action": "Approved",
        "actionBy": "ADMIN001",
        "actionDate": "2024-01-14",
        "remarks": "Approved for medical reasons"
      }
    ]
  }
]
```

### POST /api/absence
**Action:** Create new absence request
**Tracking:** Adds "Applied" to actionHistory

### PUT /api/absence
**Actions:** approve, reject, cancel
**Tracking:** Adds corresponding action to actionHistory

## UI Components

### Statistics Dashboard
- 6 cards showing key metrics
- Color-coded borders
- Real-time updates based on filters

### Filters Section
- Month picker
- Employee dropdown
- Department dropdown
- Status dropdown
- Apply/Clear buttons

### Records Table
- 12 columns with comprehensive data
- Sortable headers
- Status badges (color-coded)
- Responsive design
- Empty state message

### Employee Summary (Conditional)
- Shows only when employee filter is active
- 3 metric cards
- Focused on selected employee

### Download Button
- Top-right corner
- Success color (green)
- Disabled when no data
- Icon + text label

## User Roles & Permissions

### Employees
- View their own absence records
- See their leave summary
- Download their own reports
- Cannot see other employees' data

### Admins/Super-Admins/Team-Leads
- View all absence records
- Filter by any employee/department
- Download comprehensive reports
- See all action history
- Receive cancellation notifications

## Workflow Examples

### Example 1: Employee Checks Their Leave History
1. Navigate to Absence Records page
2. System auto-filters to their employeeId
3. Select month (e.g., January 2024)
4. View all their leaves for that month
5. See summary: Total days taken, pending requests
6. Download personal report

### Example 2: Admin Reviews Department Leaves
1. Navigate to Absence Records page
2. Select department (e.g., "IT")
3. Select month (e.g., December 2023)
4. View all IT department leaves
5. See statistics: 15 total leaves, 45 days
6. Download department report for payroll

### Example 3: HR Checks Specific Employee
1. Navigate to Absence Records page
2. Select employee from dropdown
3. Select month or view all
4. See employee's leave summary
5. Check action history for each leave
6. Download employee-specific report

## Technical Implementation

### State Management
```javascript
const [absences, setAbsences] = useState([]);
const [filters, setFilters] = useState({
  month: new Date().toISOString().slice(0, 7),
  employeeId: "",
  department: "",
  status: ""
});
const [stats, setStats] = useState({
  totalLeaves: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
  cancelled: 0,
  totalDays: 0
});
```

### Data Flow
1. Component mounts → Fetch employees & absences
2. User changes filter → Update state
3. User clicks Apply → Fetch filtered data
4. Calculate statistics → Update stats state
5. Render table with filtered data
6. User clicks Download → Generate CSV

### Performance Optimizations
- Client-side filtering for month/department (reduces API calls)
- Server-side filtering for employee/status (reduces data transfer)
- Lazy loading with loading states
- Debounced filter applications

## Files Modified/Created

### New Files
1. `src/app/absence-records/page.js` - Main records page

### Modified Files
1. `src/models/Absence.js` - Added actionHistory field
2. `src/app/api/absence/route.js` - Added action tracking & notifications
3. `src/app/absence/page.js` - Fixed syntax errors

## Testing Checklist

- [x] Absence records page loads successfully
- [x] Month filter works correctly
- [x] Employee filter works correctly
- [x] Department filter works correctly
- [x] Status filter works correctly
- [x] Statistics calculate correctly
- [x] Excel download works
- [x] Downloaded file opens in Excel
- [x] Action history tracked for all actions
- [x] Cancellation notifications sent to admins
- [x] Employee summary shows correct data
- [x] Empty state displays when no records
- [x] Loading states work properly
- [x] Responsive design on mobile

## Future Enhancements

1. **Advanced Analytics**
   - Leave trends over time
   - Department-wise comparison charts
   - Employee leave balance tracking

2. **Bulk Operations**
   - Approve multiple leaves at once
   - Bulk export for multiple months

3. **Calendar View**
   - Visual calendar showing all leaves
   - Color-coded by status/type

4. **Email Reports**
   - Scheduled monthly reports
   - Auto-send to managers

5. **Leave Balance Integration**
   - Track remaining leave days
   - Warn when balance is low
   - Carry-forward rules

## Support & Maintenance

### Common Issues

**Issue:** Excel file not downloading
**Solution:** Check browser popup blocker settings

**Issue:** Filters not applying
**Solution:** Click "Apply" button after selecting filters

**Issue:** No data showing
**Solution:** Check if filters are too restrictive, try "Clear" button

### Logs & Debugging
- Check browser console for errors
- API errors logged in server console
- Action history provides audit trail

## Conclusion

The Absence Records module provides a complete solution for tracking, managing, and reporting employee absences with:
- ✅ Real-time notifications
- ✅ Comprehensive filtering
- ✅ Excel export capability
- ✅ Complete action history
- ✅ User-friendly interface
- ✅ Role-based access control

All requirements have been successfully implemented and tested.
