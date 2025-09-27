# Admin Panel - Employee Management System

## Project Overview

A comprehensive employee management system built with Next.js 15, featuring role-based access control, timecard management, daily task tracking, and employee administration capabilities.

## 🏗️ Architecture

- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Custom authentication with bcrypt
- **Styling**: Bootstrap 5 + Custom CSS
- **Build Tool**: Turbopack (Next.js)

## 📁 File Structure

```
admin-panel/
├── .next/                          # Next.js build output (auto-generated)
├── public/                         # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                        # App Router directory
│   │   ├── admin/                  # Admin-specific routes
│   │   │   └── monitor/
│   │   │       └── page.js         # Employee monitoring page
│   │   ├── admin-dashboard/
│   │   │   └── page.js             # Super admin dashboard
│   │   ├── api/                    # API routes
│   │   │   ├── daily-task/
│   │   │   │   └── route.js        # Daily task CRUD operations
│   │   │   ├── Employee/
│   │   │   │   ├── [employeeId]/
│   │   │   │   │   └── route.js    # Individual employee operations
│   │   │   │   ├── department/
│   │   │   │   │   └── [department]/
│   │   │   │   │       └── route.js # Department-wise employee queries
│   │   │   │   ├── search/
│   │   │   │   │   └── route.js    # Employee search functionality
│   │   │   │   ├── validate/
│   │   │   │   │   └── route.js    # Employee validation
│   │   │   │   └── route.js        # Main employee CRUD
│   │   │   ├── timecard/
│   │   │   │   └── route.js        # Timecard management
│   │   │   └── User/
│   │   │       ├── change-password/
│   │   │       │   └── route.js    # Password change functionality
│   │   │       ├── get-user/
│   │   │       │   └── route.js    # User profile retrieval
│   │   │       ├── login/
│   │   │       │   └── route.js    # User authentication
│   │   │       ├── signup/
│   │   │       │   └── route.js    # User registration
│   │   │       ├── validate/
│   │   │       │   └── route.js    # User validation
│   │   │       └── route.js        # Main user operations
│   │   ├── components/
│   │   │   └── Layout.js           # Shared layout component
│   │   ├── create-password/        # Password creation flow
│   │   ├── daily-task/
│   │   │   └── page.js             # Daily task management page
│   │   ├── debug/
│   │   │   └── page.js             # Debug/testing page
│   │   ├── employees/
│   │   │   └── create-emp/
│   │   │       └── page.js         # Employee creation form
│   │   ├── login/                  # Login page directory
│   │   ├── profile/
│   │   │   └── page.js             # User profile page
│   │   ├── signup/                 # Signup page directory
│   │   ├── style/
│   │   │   └── BootstrapClient.js  # Bootstrap client-side initialization
│   │   ├── timecard-entry/
│   │   │   └── page.js             # Timecard entry interface
│   │   ├── utilis/
│   │   │   ├── connectMongoose.js  # MongoDB connection utility
│   │   │   └── employeeUtils.js    # Employee-related utilities
│   │   ├── favicon.ico             # Site favicon
│   │   ├── globals.css             # Global styles
│   │   ├── layout.js               # Root layout component
│   │   └── page.js                 # Home/login page
│   └── models/                     # MongoDB schemas
│       ├── Dailytask.js            # Daily task schema
│       ├── Employee.js             # Employee schema with department collections
│       ├── Timecard.js             # Timecard schema with auto-calculations
│       └── User.js                 # User authentication schema
├── .gitignore                      # Git ignore rules
├── eslint.config.mjs               # ESLint configuration
├── jsconfig.json                   # JavaScript configuration
├── next.config.mjs                 # Next.js configuration
├── package-lock.json               # Dependency lock file
├── package.json                    # Project dependencies and scripts
├── postcss.config.mjs              # PostCSS configuration
└── README.md                       # Basic project information
```

## 🚀 Key Features

### 1. **Role-Based Access Control**
- **Super Admin**: Full system access, employee management, monitoring
- **Employee**: Timecard entry, daily task management, profile access

### 2. **Employee Management**
- Dynamic department-based collections
- Auto-generated employee IDs (CHC0001, CHC0002, etc.)
- Comprehensive employee profiles with:
  - Personal information
  - Emergency contacts
  - Address details
  - Skills and certifications
  - Project assignments
  - Payroll information
  - Document management

### 3. **Timecard System**
- Automatic time calculations
- Lunch break tracking
- Permission/leave management
- Real-time hour computation

### 4. **Daily Task Management**
- Task creation and tracking
- Status management (Completed, Pending, In Progress)
- Time tracking per task
- Feedback and remarks system

## 🔧 Technical Implementation

### Database Schema Design

#### Employee Model (Dynamic Collections)
```javascript
// Creates department-specific collections: {department}_department
- employeeId: Auto-generated (CHC0001, CHC0002...)
- Personal Info: firstName, lastName, dob, gender, email, phone
- Professional: department, role, joiningDate
- Contact: emergencyContact, address
- Career: skills, projects, documents
- Payroll: salary, bonus, deductions
```

#### Timecard Model
```javascript
- employeeId: Reference to employee
- date: System date
- logIn/logOut: Auto-filled timestamps
- lunchOut/lunchIn: Break tracking
- permission: Manual entry for leaves
- totalHours: Auto-calculated working hours
```

#### Daily Task Model
```javascript
- employeeId: Reference to employee
- tasks: Array of task objects
  - Serialno, details, startTime, endTime
  - status, remarks, link, feedback
  - isSaved, isNew flags
```

### API Architecture

#### Employee APIs
- `POST /api/Employee` - Create employee
- `GET /api/Employee/[employeeId]` - Get employee details
- `GET /api/Employee/department/[department]` - Department-wise listing
- `GET /api/Employee/search` - Search employees

#### User Authentication APIs
- `POST /api/User/login` - User authentication
- `POST /api/User/signup` - User registration
- `POST /api/User/change-password` - Password update

#### Timecard APIs
- `POST /api/timecard` - Create/update timecard entries

#### Daily Task APIs
- `POST /api/daily-task` - Manage daily tasks

### Security Features

1. **Password Encryption**: bcrypt hashing
2. **Role Validation**: Client and server-side role checks
3. **Data Validation**: Mongoose schema validation
4. **Duplicate Prevention**: Cross-department uniqueness checks

## 🎯 User Workflows

### Super Admin Workflow
1. Login with admin credentials (admin@gmail.com / Admin)
2. Access admin dashboard
3. Create/manage employees across departments
4. Monitor employee activities
5. View system-wide reports

### Employee Workflow
1. Register/Login with employee credentials
2. Access employee dashboard
3. Log timecard entries (login/logout/lunch/permissions)
4. Manage daily tasks
5. Update profile information

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd admin-panel

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```javascript
// MongoDB connection in src/app/utilis/connectMongoose.js
const MONGODB_URI = "mongodb+srv://cloudlabel_db_user:cloudlabel%402025@admin-panel.ziw1mkn.mongodb.net/admin-panel"
```

### Build Commands
```bash
npm run dev      # Development with Turbopack
npm run build    # Production build with Turbopack
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📊 Database Collections

### Dynamic Collections Structure
```
admin-panel (Database)
├── users                    # User authentication
├── timecards               # Employee timecards
├── dailytasks              # Daily task entries
├── {department}_department # Dynamic employee collections
│   ├── it_department
│   ├── hr_department
│   ├── finance_department
│   └── ... (as needed)
```

## 🔐 Authentication Flow

1. **Login Process**:
   - Check for super admin credentials
   - Validate against User collection
   - Set localStorage with role and employee ID
   - Redirect based on role

2. **Route Protection**:
   - Client-side role validation
   - Conditional rendering based on user role
   - Automatic redirects for unauthorized access

## 📈 Scalability Features

1. **Department-Based Collections**: Automatic scaling for different departments
2. **Dynamic Model Creation**: Runtime model generation for new departments
3. **Modular API Structure**: Organized API endpoints for maintainability
4. **Component Reusability**: Shared Layout and utility components

## 🚦 Current Status

- ✅ User authentication system
- ✅ Employee management with department collections
- ✅ Timecard entry and calculation system
- ✅ Daily task management
- ✅ Role-based access control
- ✅ Responsive Bootstrap UI

## 🔄 Future Enhancements

1. **Reporting System**: Advanced analytics and reports
2. **File Upload**: Document management for employees
3. **Notifications**: Real-time alerts and notifications
4. **API Security**: JWT tokens and enhanced security
5. **Mobile App**: React Native companion app
6. **Export Features**: Excel/PDF export capabilities

## 🤝 Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Update documentation for new features
5. Test thoroughly before deployment

---

**Project**: Cloudheard Consultancy Admin Panel  
**Version**: 0.1.0  
**Framework**: Next.js 15  
**Database**: MongoDB Atlas  
**Last Updated**: 2025