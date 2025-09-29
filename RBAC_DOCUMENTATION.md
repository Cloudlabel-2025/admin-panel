# RBAC (Role-Based Access Control) Implementation Documentation

## 🔐 RBAC Architecture Overview

Your project implements a **client-side RBAC system** using localStorage for role persistence and conditional rendering for access control.

## 📋 Role Definitions

### Two Primary Roles:
1. **`super-admin`** - Full system access
2. **`employee`** - Limited employee functions

---

## 🔍 File-by-File RBAC Analysis

### 1. **`src/app/page.js`** - Authentication & Role Assignment

**Purpose**: Entry point for authentication and initial role assignment

**RBAC Implementation**:
```javascript
// Super Admin Check (Hardcoded)
if (email === "admin@gmail.com" && password === "Admin") {
  localStorage.setItem("userRole", "super-admin");
  localStorage.setItem("userEmail", email);
  router.push("/admin-dashboard");  // Admin route
}

// Employee Authentication (Database)
const res = await fetch("/api/User/login", {...});
localStorage.setItem("employeeId", data.user.employeeId);
localStorage.setItem("userRole", "employee");
localStorage.setItem("userEmail", email);
router.push("/timecard-entry");  // Employee route
```

**Key RBAC Features**:
- **Dual Authentication**: Hardcoded super-admin vs database employee
- **Role Storage**: Uses localStorage for role persistence
- **Route Redirection**: Different landing pages based on role
- **Session Data**: Stores role, email, and employeeId

---

### 2. **`src/app/components/Layout.js`** - Core RBAC Controller

**Purpose**: Main RBAC enforcement through UI rendering and navigation control

**RBAC Implementation**:

#### A. **Role Detection & Validation**
```javascript
useEffect(() => {
  const role = localStorage.getItem("userRole");
  const email = localStorage.getItem("userEmail");
  setUserRole(role);
  setUserEmail(email);
}, []);
```

#### B. **Conditional UI Rendering**
```javascript
// Dynamic Panel Title
<h5>{userRole === "super-admin" ? "Admin Panel" : "Employee Panel"}</h5>

// Role-Based Navigation Menu
{userRole === "super-admin" ? (
  // ADMIN MENU
  <>
    <button onClick={() => navigate("/admin-dashboard")}>Dashboard</button>
    <button onClick={() => navigate("/employees/create-emp")}>Add Employee</button>
    <button onClick={() => navigate("/admin/monitor")}>Monitor Employees</button>
  </>
) : (
  // EMPLOYEE MENU
  <>
    <button onClick={() => navigate("/timecard-entry")}>Timecard Entry</button>
    <button onClick={() => navigate("/daily-task")}>Daily Task</button>
  </>
)}
```

#### C. **Session Management**
```javascript
const handleLogout = () => {
  localStorage.clear();  // Clear all session data
  router.push("/");      // Redirect to login
};
```

**Key RBAC Features**:
- **Dynamic Navigation**: Different menus per role
- **Visual Indicators**: Role-specific panel titles
- **Session Control**: Centralized logout functionality
- **Fallback Rendering**: Shows children without layout if no role

---

### 3. **`src/app/admin-dashboard/page.js`** - Route Protection Example

**Purpose**: Demonstrates server-side route protection pattern

**RBAC Implementation**:
```javascript
useEffect(() => {
  const role = localStorage.getItem("userRole");
  if (role !== "super-admin") {
    router.push("/");  // Redirect unauthorized users
    return;
  }
  setUserRole(role);
}, [router]);

// Prevent rendering until role verified
if (userRole !== "super-admin") {
  return <div>Loading...</div>;
}
```

**Key RBAC Features**:
- **Role Validation**: Checks specific role requirement
- **Automatic Redirect**: Sends unauthorized users to login
- **Loading State**: Prevents flash of unauthorized content
- **Double Check**: Both useEffect and render-time validation

---

### 4. **`src/app/timecard-entry/page.js`** - Employee Route Protection

**RBAC Implementation**:
```javascript
useEffect(() => {
  const role = localStorage.getItem("userRole");
  const empId = localStorage.getItem("employeeId");
  if (role !== "employee" || !empId) {
    router.push("/");
    return;
  }
  setEmployeeId(empId);
}, [router]);
```

**Key RBAC Features**:
- **Multi-Factor Validation**: Checks both role AND employeeId
- **Employee-Specific Data**: Uses employeeId for data filtering
- **Strict Access Control**: Requires both authentication tokens

---

### 5. **`src/app/daily-task/page.js`** - Enhanced Employee Protection

**RBAC Implementation**:
```javascript
useEffect(() => {
  const userRole = localStorage.getItem("userRole");
  const employeeId = localStorage.getItem("employeeId");
  
  if (!userRole || userRole !== "employee" || !employeeId) {
    router.push("/");
    return;
  }

  // Additional validation: Fetch employee data
  fetch(`/api/Employee/${employeeId}`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      setUser({
        employeeId: data.employeeId,
        name: `${data.firstName} ${data.lastName}`,
        designation: data.role || "Employee"
      });
    })
    .catch((err) => {
      console.error("Failed to fetch employee data:", err);
      router.push("/");  // Redirect if employee not found
    });
}, [router]);
```

**Key RBAC Features**:
- **Enhanced Validation**: Verifies employee exists in database
- **Data Integrity**: Ensures employeeId is valid
- **Error Handling**: Redirects on validation failure
- **User Context**: Loads employee-specific data

---

## 🎯 RBAC Permission Matrix

| Feature | Super Admin | Employee | Guest |
|---------|-------------|----------|-------|
| Login Page | ✅ | ✅ | ✅ |
| Admin Dashboard | ✅ | ❌ | ❌ |
| Add Employee | ✅ | ❌ | ❌ |
| Monitor Employees | ✅ | ❌ | ❌ |
| Timecard Entry | ❌ | ✅ | ❌ |
| Daily Task | ❌ | ✅ | ❌ |
| Profile | ✅ | ✅ | ❌ |
| Logout | ✅ | ✅ | ❌ |

---

## 🔒 Security Implementation Details

### **Authentication Flow**:
1. **Login** → Validate credentials
2. **Role Assignment** → Set localStorage tokens
3. **Route Access** → Check role on each page
4. **UI Rendering** → Show role-appropriate interface
5. **Logout** → Clear all session data

### **Protection Mechanisms**:
- **Client-Side Guards**: useEffect role checks
- **Conditional Rendering**: Role-based UI components
- **Route Redirection**: Automatic unauthorized user handling
- **Session Persistence**: localStorage for role storage
- **Data Filtering**: Employee-specific data access

### **Security Considerations**:
- **Client-Side Only**: No server-side JWT validation
- **localStorage Dependency**: Vulnerable to XSS attacks
- **Hardcoded Admin**: Super admin credentials in code
- **No Token Expiry**: Sessions persist indefinitely
- **No API Protection**: APIs don't validate roles

---

## 🚨 Current Limitations

1. **Client-Side Security**: Easily bypassed by modifying localStorage
2. **No API Guards**: Backend APIs don't validate user roles
3. **Hardcoded Credentials**: Super admin login is static
4. **No Session Expiry**: Tokens never expire
5. **XSS Vulnerability**: localStorage can be accessed by malicious scripts

---

## 💡 Recommended Improvements

1. **JWT Tokens**: Implement server-side token validation
2. **API Middleware**: Add role checks to all API routes
3. **Session Expiry**: Implement token refresh mechanism
4. **Environment Variables**: Move admin credentials to env files
5. **HTTPS Only**: Secure cookie storage instead of localStorage

---

## 🔧 RBAC Implementation Pattern

### **Standard Route Protection Template**:
```javascript
useEffect(() => {
  const role = localStorage.getItem("userRole");
  const requiredRole = "super-admin"; // or "employee"
  
  if (role !== requiredRole) {
    router.push("/");
    return;
  }
  setUserRole(role);
}, [router]);

if (userRole !== requiredRole) {
  return <div>Loading...</div>;
}
```

### **Enhanced Employee Validation**:
```javascript
useEffect(() => {
  const role = localStorage.getItem("userRole");
  const employeeId = localStorage.getItem("employeeId");
  
  if (role !== "employee" || !employeeId) {
    router.push("/");
    return;
  }
  
  // Verify employee exists in database
  validateEmployee(employeeId);
}, [router]);
```

---

## 📊 RBAC Files Summary

| File | RBAC Function | Implementation |
|------|---------------|----------------|
| `page.js` | Authentication & Role Assignment | Dual login paths, localStorage setup |
| `Layout.js` | UI Access Control | Conditional navigation, role-based rendering |
| `admin-dashboard/page.js` | Super Admin Protection | Role validation, redirect on failure |
| `timecard-entry/page.js` | Employee Protection | Role + employeeId validation |
| `daily-task/page.js` | Enhanced Employee Protection | Database validation, error handling |

---

**Project**: Cloudheard Consultancy Admin Panel  
**RBAC Type**: Client-Side Role-Based Access Control  
**Security Level**: Basic (Development)  
**Recommended**: Upgrade to JWT + Server-Side validation for production