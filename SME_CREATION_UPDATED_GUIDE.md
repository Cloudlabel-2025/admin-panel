# SME Creation & Management - Updated Implementation Guide

## 📋 Overview

The SME (Subject Matter Expert) creation system has been updated to follow the same comprehensive employee creation process as requested. SMEs are now created through the standard employee registration form with all required fields including department classification, while maintaining automatic User account creation for authentication and role-based redirection to the dedicated SME portal.

## 🎯 SME Creation Process

### **Single Method: Standard Employee Creation Form**

**Location**: Admin Panel → Management → Add Employee  
**URL**: `/employees/create-emp`  
**Access**: Super-admin, Admin, Developer roles only

### **Step-by-Step SME Creation Process**

#### **Step 1: Basic Information**
- **Joining Date** ✅ (Required)
- **First Name** ✅ (Required) 
- **Last Name** ✅ (Required)
- **Date of Birth** ✅ (Required)
- **Gender** ✅ (Required)

#### **Step 2: Contact Information**
- **Email** ✅ (Required) - Will be used for SME login
- **Phone** ✅ (Required) - With country code selection

#### **Step 3: Work Information** 
- **Department** ✅ (Required) - Select from:
  - Technical
  - Functional  
  - Production
  - OIC
  - Management
- **Role** ✅ (Required) - Select **"SME (Subject Matter Expert)"**
- **Login Password** ✅ (Required for SME) - Appears automatically when SME role is selected

#### **Step 4: Emergency Contact**
- **Contact Person** ✅ (Required)
- **Contact Number** ✅ (Required)

#### **Step 5: Address & Payroll**
- **Complete Address** ✅ (Required)
- **Base Salary** ✅ (Required)

## 🔧 **Technical Implementation**

### **Automatic User Account Creation**
When an employee is created with role "SME":

1. **Employee Record**: Created in department-specific collection
2. **User Account**: Automatically created in User collection with:
   - Employee ID (auto-generated: CHC####)
   - Full Name (First + Last)
   - Email (for login)
   - Hashed Password (provided in form)
   - Role: "SME"

### **Authentication Flow**
1. **SME Login**: Uses email + password at main login page
2. **Role Detection**: System detects role="SME" 
3. **Auto Redirect**: Automatically redirects to `/sme` portal
4. **Portal Access**: SME gains access to dedicated work tracking interface

### **Database Structure**

#### Employee Record (Department Collection)
```javascript
{
  employeeId: "CHC0001",
  firstName: "John",
  lastName: "Doe", 
  email: "john.doe@company.com",
  department: "Technical",
  role: "SME",
  // ... all other employee fields
}
```

#### User Record (User Collection)
```javascript
{
  employeeId: "CHC0001",
  name: "John Doe",
  email: "john.doe@company.com", 
  password: "hashedPassword",
  role: "SME",
  isTerminated: false
}
```

## 🚀 **SME Portal Features**

Once logged in, SMEs have access to:

### **Session Management**
- Start/End work sessions manually
- Break and lunch time tracking
- Real-time session timer
- Session status indicators

### **Task Management** 
- Create daily tasks during active sessions
- Task priority management (Low/Medium/High)
- Task status tracking (Pending/In-Progress/Completed)
- Time tracking per task

### **Analytics & History**
- Session history with detailed breakdowns
- Time analytics and productivity metrics
- Task completion statistics
- Personal performance insights

## 🔐 **Security & Access Control**

### **Role-Based Access**
- **SME Creation**: Only Super-admin, Admin, Developer can create SMEs
- **SME Portal**: Only users with role="SME" can access
- **Data Isolation**: SMEs can only see their own data
- **Session Security**: JWT-based authentication with automatic token refresh

### **Business Rules Enforcement**
- **Single Active Session**: Only one active session per SME
- **Mandatory Tasks**: At least one task required before session end
- **Department Classification**: SMEs must be assigned to a specific department
- **Password Security**: Minimum 6 characters required

## 📊 **Admin Monitoring**

Administrators can monitor SME activities through:

**Location**: Admin Panel → Management → SME Monitoring  
**URL**: `/admin/sme-monitoring`

### **Monitoring Features**
- **Overview Dashboard**: System-wide SME statistics
- **Individual SME Tracking**: Detailed performance metrics
- **Session Monitoring**: Real-time and historical session data
- **Task Oversight**: Task completion and priority analysis
- **Analytics**: Comprehensive reporting and filtering

## 🔄 **Complete Workflow Example**

### **Admin Creates SME**
1. Navigate to **Add Employee**
2. Fill **Step 1**: Basic info (John Doe, DOB, etc.)
3. Fill **Step 2**: Contact (john.doe@company.com, phone)
4. Fill **Step 3**: Work info (Department: Technical, Role: SME, Password: secure123)
5. Fill **Step 4**: Emergency contact
6. Fill **Step 5**: Address & salary
7. **Submit** → System creates both Employee and User records

### **SME Login & Usage**
1. SME visits main login page
2. Enters: **Email**: john.doe@company.com, **Password**: secure123
3. System detects role="SME" → **Auto-redirects to `/sme`**
4. SME accesses dedicated portal with session/task management

### **Admin Monitoring**
1. Admin visits **SME Monitoring** dashboard
2. Views John Doe's activity, sessions, and tasks
3. Monitors productivity and performance metrics

## ✅ **Key Benefits**

### **Consistency**
- **Same Process**: SME creation follows identical employee creation flow
- **Standard Fields**: All employee information captured (department, address, payroll, etc.)
- **Unified System**: Single employee management interface

### **Security**
- **Role-Based Access**: Proper authentication and authorization
- **Data Isolation**: Complete separation between SME and admin interfaces  
- **Audit Trail**: Full tracking of SME activities

### **User Experience**
- **Seamless Login**: Same authentication system for all users
- **Auto-Redirect**: Automatic portal routing based on role
- **Dedicated Interface**: SME-specific portal isolated from admin panel

## 🛠️ **API Endpoints**

### **Employee Creation** (Creates both Employee + User for SMEs)
```
POST /api/Employee
Headers: Authorization: Bearer <token>
Body: {
  firstName: "John",
  lastName: "Doe", 
  email: "john.doe@company.com",
  department: "Technical",
  role: "SME",
  password: "secure123", // Required for SME
  // ... all other employee fields
}
```

### **SME Login** (Standard login endpoint)
```
POST /api/User/login  
Body: {
  email: "john.doe@company.com",
  password: "secure123"
}
Response: {
  token: "jwt_token",
  user: { role: "SME", ... }
}
// Auto-redirects to /sme portal
```

### **SME Monitoring** (Admin oversight)
```
GET /api/admin/sme?type=analytics
GET /api/admin/sme?type=smes
GET /api/admin/sme?type=sessions&employeeId=CHC0001
GET /api/admin/sme?type=tasks&employeeId=CHC0001
```

## 📋 **Validation Rules**

### **SME-Specific Validations**
- **Password Required**: When role="SME" is selected
- **Password Length**: Minimum 6 characters
- **Department Mandatory**: Must select a department for domain classification
- **Email Unique**: No duplicate emails across all employees
- **Phone Unique**: No duplicate phone numbers

### **Standard Employee Validations**
- All standard employee form validations apply
- Address, emergency contact, payroll information required
- Age restrictions, date validations, etc.

## 🎉 **Success Indicators**

### **SME Creation Success**
- ✅ Employee record created in department collection
- ✅ User account created with SME role
- ✅ Success message shows SME login information
- ✅ Admin receives confirmation of SME portal access

### **SME Login Success**  
- ✅ SME can login with email/password
- ✅ Automatic redirection to `/sme` portal
- ✅ Access to session and task management
- ✅ Real-time work tracking capabilities

### **Admin Monitoring Success**
- ✅ SME appears in monitoring dashboard
- ✅ Session and task data visible to admins
- ✅ Analytics and reporting functional
- ✅ Complete oversight capabilities

## 🔧 **Troubleshooting**

### **Common Issues**

**1. SME Creation Fails**
- Verify all required fields are filled
- Check password is provided when SME role selected
- Ensure email is unique across system

**2. SME Cannot Login**
- Verify email and password are correct
- Check User record was created (role="SME")
- Ensure account is not terminated

**3. SME Portal Not Accessible**
- Confirm role is exactly "SME" in database
- Check JWT token is valid
- Verify redirect logic in login page

**4. Admin Cannot Monitor SME**
- Ensure admin has proper role permissions
- Check SME data exists in database
- Verify API endpoints are accessible

## 📞 **Support & Maintenance**

### **Regular Tasks**
- Monitor SME account creation success rates
- Review SME portal usage and performance
- Update password policies as needed
- Maintain department classifications

### **System Health Checks**
- Verify User account creation for new SMEs
- Test login and redirect functionality
- Monitor session and task data integrity
- Check admin monitoring dashboard accuracy

---

## 🎯 **Quick Reference**

**Create SME**: Admin Panel → Add Employee → Select SME Role → Provide Password  
**SME Login**: Main Login → Email/Password → Auto-redirect to /sme  
**Monitor SME**: Admin Panel → SME Monitoring → View All SME Activities  

**The system now provides a complete, integrated SME management solution that maintains consistency with employee creation while providing specialized work tracking capabilities and comprehensive administrative oversight.**