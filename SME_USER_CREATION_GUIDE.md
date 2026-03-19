# SME User Creation and Management Guide

## 📋 Overview

This guide explains where and how to create SME (Subject Matter Expert) users in your admin panel system. SME users have access to a dedicated work tracking portal with session management, task tracking, and time monitoring capabilities.

## 🎯 Where to Add SME Users

### Method 1: Dedicated SME User Management (Recommended)

**Location**: Admin Panel → Management → SME Users
**URL**: `/admin/sme-users`
**Access**: Available to Super-admin, Admin, Developer, Team-Lead, Team-admin roles

**Features**:
- ✅ Quick SME user creation with auto-generated employee IDs
- ✅ User status management (activate/deactivate)
- ✅ Real-time statistics and monitoring
- ✅ Direct integration with SME monitoring dashboard
- ✅ Bulk user management capabilities

**How to Access**:
1. Login as an admin user
2. Navigate to the sidebar → Management section
3. Click on "SME Users"
4. Click "Add SME User" button
5. Fill in the required information:
   - Employee ID (auto-generated if left empty)
   - Full Name (required)
   - Email (required)
   - Password (minimum 6 characters)
   - Confirm Password

### Method 2: Standard Employee Creation Form

**Location**: Admin Panel → Management → Add Employee
**URL**: `/employees/create-emp`
**Access**: Available to Super-admin, Admin, Developer roles

**How to Create SME via Employee Form**:
1. Navigate to "Add Employee"
2. Fill out the multi-step form
3. In Step 3 (Work Information):
   - Select any department except "Management"
   - Choose "SME (Subject Matter Expert)" from the Role dropdown
4. Complete the remaining steps and submit

## 🔧 Technical Implementation Details

### Database Structure

SME users are stored in the `User` collection with the following structure:
```javascript
{
  employeeId: "SME123456", // Auto-generated or custom
  name: "John Doe",
  email: "john.doe@company.com",
  password: "hashedPassword",
  role: "SME",
  isTerminated: false,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Create SME User
```
POST /api/User
Headers: Authorization: Bearer <token>
Body: {
  employeeId: "SME123456", // Optional
  name: "John Doe",
  email: "john.doe@company.com", 
  password: "password123",
  role: "SME"
}
```

#### Get SME Users
```
GET /api/User?role=SME
Headers: Authorization: Bearer <token>
```

#### Update User Status
```
PUT /api/User/[id]
Headers: Authorization: Bearer <token>
Body: {
  isTerminated: true/false
}
```

### Authentication & Authorization

- **Required Roles**: Super-admin, Admin, Developer, Team-Lead, Team-admin
- **JWT Token**: Required for all API operations
- **Role Validation**: Enforced on both frontend and backend

## 🚀 SME User Workflow

### 1. User Creation
- Admin creates SME user via either method above
- System generates unique employee ID if not provided
- User credentials are stored securely

### 2. SME Login Process
- SME user logs in with email/password
- System detects role="SME" and redirects to `/sme` portal
- SME gains access to dedicated work tracking interface

### 3. SME Portal Features
- **Session Management**: Start/end work sessions
- **Break Tracking**: Manage breaks and lunch periods
- **Task Management**: Create and track daily tasks
- **Time Analytics**: View work time statistics
- **Session History**: Access past session data

### 4. Admin Monitoring
- Admins can monitor all SME activities via `/admin/sme-monitoring`
- Real-time session tracking and analytics
- Individual SME performance metrics
- Task completion monitoring

## 📊 SME Management Dashboard

### Quick Stats Available:
- Total SME Users
- Active Users
- Inactive Users  
- New Users This Week

### User Management Actions:
- **Activate/Deactivate**: Toggle user access
- **View Details**: Direct link to SME monitoring
- **User Statistics**: Individual performance metrics

## 🔐 Security Features

### Access Control
- Role-based access to SME creation
- JWT token validation on all endpoints
- User isolation in SME portal
- Secure session management

### Data Protection
- Password encryption (in production)
- User-specific data filtering
- Audit trail for user actions
- GDPR compliance considerations

## 📱 Mobile Compatibility

The SME user management interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🛠️ Troubleshooting

### Common Issues:

**1. "User already exists" error**
- Check if email or employee ID is already in use
- Verify user hasn't been created in employee system

**2. SME user can't access portal**
- Verify role is set to "SME" exactly
- Check if user account is active (isTerminated: false)
- Ensure user is logging in with correct credentials

**3. Admin can't create SME users**
- Verify admin has required role permissions
- Check JWT token validity
- Ensure API endpoints are accessible

### Debug Steps:
1. Check browser console for errors
2. Verify network requests in developer tools
3. Confirm database connection
4. Validate JWT token expiration

## 📈 Best Practices

### SME User Creation:
1. **Use descriptive names**: Include full name for easy identification
2. **Consistent email format**: Follow company email conventions
3. **Strong passwords**: Enforce minimum security requirements
4. **Unique employee IDs**: Use auto-generation to avoid conflicts

### User Management:
1. **Regular monitoring**: Check SME activity via monitoring dashboard
2. **Deactivate unused accounts**: Maintain security by disabling inactive users
3. **Bulk operations**: Use SME Users page for efficient management
4. **Documentation**: Keep records of SME user purposes and assignments

## 🔄 Integration Points

### Existing Systems:
- **Authentication**: Integrates with existing JWT system
- **User Model**: Extends current User schema
- **Role System**: Works with existing role-based access
- **Navigation**: Seamlessly integrated into admin panel

### Future Enhancements:
- **Bulk import**: CSV import for multiple SME users
- **Advanced permissions**: Granular SME access control
- **Integration APIs**: External system connectivity
- **Automated reporting**: Scheduled SME activity reports

## 📞 Support

For technical support or questions about SME user management:
1. Check this documentation first
2. Review the troubleshooting section
3. Examine browser console for errors
4. Contact system administrator with specific error messages

---

## 🎉 Quick Start Checklist

To create your first SME user:

- [ ] Login as admin user
- [ ] Navigate to Admin Panel → Management → SME Users
- [ ] Click "Add SME User"
- [ ] Fill required fields (Name, Email, Password)
- [ ] Click "Create SME User"
- [ ] Verify user appears in the list
- [ ] Test SME login at main login page
- [ ] Confirm SME portal access works
- [ ] Check admin monitoring dashboard

**Congratulations!** Your SME work tracking system is now ready for use.