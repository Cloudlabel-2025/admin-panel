# API Authentication Guide

## Quick Reference for Using Protected APIs

---

## 🔑 Getting Started

### 1. Login and Get Token

```javascript
// Login Request
const response = await fetch("/api/User/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(1{
    email: "admin@gmail.com",
    password: "Admin@2025"
  })
});

const data = await response.json();

// Store tokens
localStorage.setItem("token", data.token);
localStorage.setItem("refreshToken", data.refreshToken);
localStorage.setItem("userRole", data.user.role);
```

### 2. Use Token in API Calls

```javascript
// Get token from storage
const token = localStorage.getItem("token");

// Make authenticated request
const response = await fetch("/api/Employee", {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${token}`
  }
});
```

---

## 📋 API Endpoints Reference

### Employee APIs

#### List All Employees
```javascript
// GET /api/Employee
// Required: Any authenticated user
const token = localStorage.getItem("token");
const response = await fetch("/api/Employee", {
  headers: { "Authorization": `Bearer ${token}` }
});
const employees = await response.json();
```

#### Create Employee
```javascript
// POST /api/Employee
// Required: super-admin, admin, or developer role
const token = localStorage.getItem("token");
const response = await fetch("/api/Employee", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "1234567890",
    department: "Technical",
    role: "Employee",
    joiningDate: "2025-01-01",
    emergencyContact: {
      contactPerson: "Jane Doe",
      contactNumber: "9876543210"
    },
    payroll: {
      salary: "50000",
      currency: "INR"
    }
  })
});
```

#### Get Single Employee
```javascript
// GET /api/Employee/[employeeId]
// Required: Any authenticated user
const employeeId = "CHC0001";
const token = localStorage.getItem("token");
const response = await fetch(`/api/Employee/${employeeId}`, {
  headers: { "Authorization": `Bearer ${token}` }
});
```

#### Update Employee
```javascript
// PATCH /api/Employee/[employeeId]
// Required: super-admin only
const employeeId = "CHC0001";
const token = localStorage.getItem("token");
const response = await fetch(`/api/Employee/${employeeId}`, {
  method: "PATCH",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    role: "Team-Lead",
    department: "Management"
  })
});
```

#### Delete Employee
```javascript
// DELETE /api/Employee/[employeeId]
// Required: super-admin only
const employeeId = "CHC0001";
const token = localStorage.getItem("token");
const response = await fetch(`/api/Employee/${employeeId}`, {
  method: "DELETE",
  headers: { "Authorization": `Bearer ${token}` }
});
```

---

### Timecard APIs

#### Get Timecards
```javascript
// GET /api/timecard?employeeId=CHC0001
// Required: Any authenticated user
const token = localStorage.getItem("token");
const employeeId = localStorage.getItem("employeeId");
const response = await fetch(`/api/timecard?employeeId=${employeeId}`, {
  headers: { "Authorization": `Bearer ${token}` }
});
```

#### Create Timecard Entry
```javascript
// POST /api/timecard
// Required: Any authenticated user
const token = localStorage.getItem("token");
const response = await fetch("/api/timecard", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    employeeId: "CHC0001",
    date: new Date(),
    logIn: "09:00",
    logOut: "18:00",
    lunchOut: "13:00",
    lunchIn: "14:00",
    permission: 0
  })
});
```

#### Update Timecard
```javascript
// PUT /api/timecard
// Required: Any authenticated user
const token = localStorage.getItem("token");
const response = await fetch("/api/timecard", {
  method: "PUT",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    _id: "timecard_id",
    logOut: "18:30"
  })
});
```

---

### Daily Task APIs

#### Get Daily Tasks
```javascript
// GET /api/daily-task?employeeId=CHC0001
// Required: Any authenticated user
const token = localStorage.getItem("token");
const employeeId = localStorage.getItem("employeeId");
const response = await fetch(`/api/daily-task?employeeId=${employeeId}`, {
  headers: { "Authorization": `Bearer ${token}` }
});
```

#### Create/Update Daily Tasks
```javascript
// POST /api/daily-task
// Required: Any authenticated user
const token = localStorage.getItem("token");
const response = await fetch("/api/daily-task", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    employeeId: "CHC0001",
    employeeName: "John Doe",
    designation: "Developer",
    tasks: [
      {
        Serialno: 1,
        details: "Complete API documentation",
        startTime: "09:00",
        endTime: "12:00",
        status: "Completed",
        remarks: "Done",
        link: "",
        feedback: ""
      }
    ]
  })
});
```

---

## 🔒 Error Handling

### Handle Authentication Errors

```javascript
async function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    }
  });
  
  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.clear();
    window.location.href = "/";
    throw new Error("Session expired. Please login again.");
  }
  
  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new Error("You don't have permission to perform this action.");
  }
  
  return response;
}

// Usage
try {
  const response = await authenticatedFetch("/api/Employee");
  const data = await response.json();
} catch (error) {
  console.error(error.message);
}
```

---

## 🔄 Token Refresh (Future Implementation)

```javascript
// When access token expires, use refresh token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  
  const response = await fetch("/api/User/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  localStorage.setItem("token", data.token);
  return data.token;
}
```

---

## 🎯 Role-Based UI Rendering

```javascript
// Check user role before showing UI elements
const userRole = localStorage.getItem("userRole");

// Show admin-only features
if (["super-admin", "admin", "developer"].includes(userRole)) {
  // Show create employee button
  <button onClick={createEmployee}>Add Employee</button>
}

// Show employee features
if (userRole === "Employee") {
  // Show timecard entry
  <button onClick={logTimecard}>Log Time</button>
}
```

---

## 📱 Complete Example: Create Employee Form

```javascript
"use client";
import { useState } from "react";

export default function CreateEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/Employee", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          phone: "1234567890",
          department: "Technical",
          role: "Employee",
          joiningDate: "2025-01-01",
          emergencyContact: {
            contactPerson: "Jane Doe",
            contactNumber: "9876543210"
          },
          payroll: {
            salary: "50000",
            currency: "INR"
          }
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create employee");
      }
      
      const data = await response.json();
      alert("Employee created successfully!");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Employee"}
      </button>
    </form>
  );
}
```

---

## 🛡️ Security Best Practices

### 1. Always Check Token Before API Calls
```javascript
const token = localStorage.getItem("token");
if (!token) {
  router.push("/");
  return;
}
```

### 2. Handle Token Expiry Gracefully
```javascript
if (response.status === 401) {
  localStorage.clear();
  router.push("/");
}
```

### 3. Validate User Role on Frontend
```javascript
const userRole = localStorage.getItem("userRole");
if (!["super-admin", "admin"].includes(userRole)) {
  router.push("/");
  return;
}
```

### 4. Clear Tokens on Logout
```javascript
const handleLogout = () => {
  localStorage.clear();
  router.push("/");
};
```

---

## 📊 Response Formats

### Success Response
```json
{
  "message": "Employee created successfully",
  "employee": {
    "employeeId": "CHC0001",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Access token required"
}

// 403 Forbidden
{
  "error": "Insufficient permissions"
}

// 400 Bad Request
{
  "error": "Please fill all required fields"
}

// 500 Server Error
{
  "error": "Internal server error"
}
```

---

## 🔍 Debugging Tips

### Check Token in Console
```javascript
console.log("Token:", localStorage.getItem("token"));
console.log("Role:", localStorage.getItem("userRole"));
```

### Decode JWT Token (for debugging)
```javascript
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

const token = localStorage.getItem("token");
console.log("Token payload:", parseJwt(token));
```

### Test API in Browser Console
```javascript
// Quick test
fetch("/api/Employee", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("token")}`
  }
}).then(r => r.json()).then(console.log);
```

---

**Last Updated**: 2025
**Version**: 1.0
