# Quick Start Guide - Secured Admin Panel

## 🚀 Get Started in 5 Minutes

---

## 1. Environment Setup

Your `.env` file is already configured with:
```env
SUPER_ADMIN_EMAIL=admin@gmail.com
SUPER_ADMIN_PASSWORD=Admin@2025
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production_2025
```

✅ **No changes needed for development!**

---

## 2. Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 3. Login as Super-Admin

**Credentials**:
- Email: `admin@gmail.com`
- Password: `Admin@2025`

After login, you'll be redirected to the admin dashboard.

---

## 4. Create Your First Employee

1. Navigate to "Add Employee" from the sidebar
2. Fill in the 5-step form:
   - Step 1: Basic Information
   - Step 2: Contact Information
   - Step 3: Work Information
   - Step 4: Emergency Contact
   - Step 5: Address & Payroll
3. Click "Create Employee"

The system will:
- Auto-generate employee ID (CHC0001, CHC0002, etc.)
- Create department-specific collection
- Generate JWT tokens for the employee

---

## 5. Test API Authentication

### Get All Employees
```javascript
const token = localStorage.getItem("token");
const response = await fetch("/api/Employee", {
  headers: { "Authorization": `Bearer ${token}` }
});
const employees = await response.json();
console.log(employees);
```

### Create Timecard Entry
```javascript
const token = localStorage.getItem("token");
const response = await fetch("/api/timecard", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    employeeId: "CHC0001",
    logIn: "09:00",
    logOut: "18:00"
  })
});
```

---

## 🔐 Security Features Active

✅ JWT authentication on all API routes  
✅ Role-based access control  
✅ Token expiry (15 minutes)  
✅ Refresh tokens (7 days)  
✅ Environment-based credentials  

---

## 📚 Documentation

- **SECURITY_FIXES_APPLIED.md** - Complete security details
- **API_AUTHENTICATION_GUIDE.md** - API usage examples
- **FIXES_SUMMARY.md** - What was fixed
- **PROJECT_DOCUMENTATION.md** - Full project docs

---

## 🎯 Common Tasks

### Check Your Token
```javascript
console.log(localStorage.getItem("token"));
```

### Check Your Role
```javascript
console.log(localStorage.getItem("userRole"));
```

### Logout
```javascript
localStorage.clear();
window.location.href = "/";
```

---

## ⚠️ Troubleshooting

### "Access token required" error
- You're not logged in
- Token expired (15 min)
- Solution: Login again

### "Insufficient permissions" error
- Your role doesn't have access
- Solution: Login with admin account

### API returns 500 error
- Check MongoDB connection
- Check console for errors
- Verify .env file exists

---

## 🎉 You're All Set!

Your admin panel is now secured with:
- JWT authentication
- Role-based access control
- Environment-based configuration

Start building! 🚀
