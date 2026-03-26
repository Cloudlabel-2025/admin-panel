# Admin Panel & SME Portal — Catalog

## Tech Stack
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (access token + refresh token)
- **UI:** Bootstrap 5 + Bootstrap Icons
- **Reports:** xlsx (Excel export), jsPDF

---

## Roles
| Role | Access |
|---|---|
| super-admin / admin / developer | Full admin panel |
| Team-Lead / Team-admin | Monitor view |
| Employee | Timecard, tasks, payroll, profile |
| SME | SME Portal only |

---

## Admin Panel

### Dashboard
- `/admin-dashboard` — Stats overview, active employees, quick links

### Employee Management
- `/employees/employees-list` — All employees list
- `/employees/create-emp` — Create new employee
- `/employees/[id]` — Employee detail & edit
- `/terminated-employees` — Terminated employees list

### Attendance & Time
- `/attendance` — Attendance records
- `/employee-attendance` — Per-employee attendance
- `/timecard-entry` — Daily timecard entry
- `/employee-calendar` — Employee calendar view
- `/calendar` — Company calendar

### Tasks & Performance
- `/admin-task` — Admin task management
- `/daily-task` — Daily task list
- `/employee-daily-tasks` — Per-employee daily tasks
- `/performance` — Performance reviews list
- `/performance/create` — Create performance review
- `/performance/[id]/edit` — Edit performance review

### Absence Management
- `/absence` — My absence requests
- `/absence-management` — Admin absence management
- `/absence-records` — All absence records
- `/admin-absence` — Admin absence overview
- `/team-absence` — Team absence view

### Payroll
- `/my-payroll` — Employee payroll view
- `/accounting/payroll` — Admin payroll management

### Projects & Skills
- `/project` — Projects list
- `/my-projects` — My assigned projects
- `/skills` — Skills catalog
- `/skills/create` — Add skill
- `/my-skills` — My skills profile

### Inventory
- `/inventory` — Inventory list
- `/inventory/create` — Add inventory item
- `/inventory/[id]/edit` — Edit item

### Documents
- `/documents` — Employee documents

### Notifications
- `/notifications` — Notification center

### Profile & Settings
- `/profile` — My profile
- `/account-settings` — Account settings
- `/settings` — System settings
- `/debug` — Debug tools

---

## Accounting Module

### Accounts
- `/accounts` — Chart of accounts
- `/accounts/create` — New account
- `/accounts/transfer` — Fund transfer
- `/fund-transfer` — Fund transfer page

### Transactions
- `/transactions` — All transactions
- `/transactions/create` — New transaction
- `/accounting/transactions` — Accounting transactions

### Assets
- `/accounting/assets` — Asset register
- `/accounting/assets/create` — Add asset

### Budgeting
- `/budgeting` — Budget list
- `/budgeting/create` — Create budget
- `/accounting/budgeting` — Accounting budgets

### Cash Management
- `/cash/credits` — Cash credits
- `/cash/debits` — Cash debits
- `/accounting/cash` — Cash overview
- `/accounting/petty-cash` — Petty cash

### Purchasing
- `/purchasing/vendors` — Vendors list
- `/purchasing/vendors/create` — Add vendor
- `/purchasing/purchase-orders` — Purchase orders
- `/purchasing/purchase-orders/create` — New PO
- `/purchasing/purchase-invoices` — Purchase invoices
- `/purchasing/purchase-invoices/create` — New PI

### Sales
- `/sales/customers` — Customers list
- `/sales/customers/create` — Add customer
- `/sales/orders` — Sales orders
- `/sales/orders/create` — New order
- `/sales/invoices` — Sales invoices
- `/sales/invoices/create` — New invoice
- `/sales/quotations` — Quotations
- `/sales/quotations/create` — New quotation

### Invoices
- `/invoices` — All invoices
- `/invoices/clients` — Client invoices
- `/invoices/company` — Company invoices

---

## Admin — SME Section

- `/admin/sme-monitoring` — Monitor all SME sessions, tasks, analytics + Excel report generator
- `/admin/sme-users` — Manage SME user accounts (create, activate)
- `/admin/monitor` — Team-Lead monitor view

### Admin SME API
| Endpoint | Description |
|---|---|
| `GET /api/admin/sme?type=smes` | All SME users with stats |
| `GET /api/admin/sme?type=sessions` | Sessions with filters |
| `GET /api/admin/sme?type=tasks` | Tasks with filters |
| `GET /api/admin/sme?type=analytics` | Dashboard analytics |
| `GET /api/admin/sme?type=report&startDate=&endDate=&employeeId=` | Excel report data |

---

## RBAC Control
- `/rbac-control` — Role & permission management

---

## SME Portal

Separate portal for Subject Matter Experts. Accessible only with `role: "SME"`.

### Pages
| Route | Description |
|---|---|
| `/sme` | Dashboard — start/end session, break, lunch controls + live timer |
| `/sme/sessions` | Session history with date filter |
| `/sme/tasks` | Task management — add, start, complete tasks |
| `/sme/report` | Daily report — date picker, session timing, task table, Excel download |

### Bottom Strip (all pages)
- Always-visible session status bar at the bottom
- Shows: session status dot, login time, task count, completed count
- "Tasks" button expands task list upward (scrollable, max 190px)
- "Dashboard" button quick-links to `/sme`
- Only renders when a session is active

### Session Lifecycle
```
Start Session → Add Tasks → (Break / Lunch / Resume) → End Session
```
- Cannot end session without adding at least one task
- Stuck sessions from previous days can always be ended
- Deleting tasks does not block logout (tasksAdded counter tracks history)

### SME API
| Endpoint | Description |
|---|---|
| `GET /api/sme/session?type=active` | Get current active session |
| `GET /api/sme/session?type=history` | Session history |
| `GET /api/sme/session?type=report&startDate=&endDate=` | Report data for Excel |
| `POST /api/sme/session` | Actions: start, break, lunch, resume, end |
| `GET /api/sme/tasks` | Get tasks (filtered by employeeId, sessionId, date) |
| `POST /api/sme/tasks` | Create new task |
| `PUT /api/sme/tasks/[id]` | Update task status |
| `DELETE /api/sme/tasks/[id]` | Delete task |

### SME Report (Excel — 3 sheets)
| Sheet | Contents |
|---|---|
| Day Summary | Employee, date, sessions count, first login, last logout, net hours, task stats |
| Login-Logout History | Every session entry with login, logout, break, lunch, net working, totals row |
| Task Details | All tasks with title, description, status, start/end time, time spent |

---

## Data Models

### User
```
employeeId, name, email, password, role, status (active/pending), isTerminated
```

### SMESession
```
employeeId, loginTime, logoutTime, totalDuration, totalBreakTime, totalLunchTime,
netWorkingTime, status (active/break/lunch/completed), breaks[], tasks[], tasksAdded, date
```

### SMETask
```
employeeId, sessionId, title, description, priority, status (pending/in-progress/completed),
timeSpent, startTime, endTime, date
```

---

## Auth Flow
```
POST /api/User/login
  → returns accessToken + refreshToken
  → role determines redirect:
      SME          → /sme
      super-admin  → /admin-dashboard
      admin        → /admin-dashboard
      Team-Lead    → /admin/monitor
      Employee     → /timecard-entry

POST /api/User/refresh   → refresh access token
POST /api/User/signup    → SME account activation / new employee signup
POST /api/User/forgot-password → send OTP
POST /api/User/reset-password  → reset with OTP
```

---

## Utilities
| File | Purpose |
|---|---|
| `apiFetch.js` | Auto token refresh on 401, redirect to login on expiry |
| `authMiddleware.js` | JWT generation (access + refresh tokens) |
| `connectMongoose.js` | MongoDB connection singleton |
| `jwt.js` | Token sign/verify helpers |
| `smeReport.js` | Excel report generator (shared utility) |
| `notificationUtils.js` | Push notification helpers |
| `timeUtils.js` | Time formatting helpers |
| `settingsUtils.js` | System settings helpers |
