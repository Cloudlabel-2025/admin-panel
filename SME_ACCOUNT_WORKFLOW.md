# SME Account Creation & Activation Workflow

## Overview
The SME (Subject Matter Expert) account creation process has been updated to follow a two-step workflow for enhanced security and user control.

## Workflow Steps

### Step 1: Admin Creates SME Employee Record
**Who:** Admin/Super-admin  
**Where:** Employee Creation Form (`/employees/create-emp`)

**Process:**
1. Admin fills out the standard employee creation form
2. Selects "SME (Subject Matter Expert)" as the role
3. **No password field is shown** - password is excluded from creation
4. Upon submission:
   - Employee record is created in the department collection
   - User record is created with `status: "pending"` and **no password**
   - SME account is in "pending" state

**Fields Required:**
- First Name, Last Name
- Email (will be used for account activation)
- Employee ID (auto-generated)
- Joining Date
- Department
- Role: SME
- All other standard employee fields

### Step 2: SME User Activates Account
**Who:** SME User  
**Where:** Signup Page (same as regular employee signup)

**Process:**
1. SME receives notification (email/verbal) that their account has been created
2. SME goes to the signup page
3. Enters their **registered email** (the one used during employee creation)
4. Creates and confirms their password
5. System validates:
   - Email exists in User collection
   - User has role "SME"
   - Account status is "pending"
   - No existing password
6. Upon successful validation:
   - Password is hashed and stored
   - Account status changes from "pending" to "active"
   - SME can now login and access the SME portal

## Technical Implementation

### Database Changes
```javascript
// User Model Updates
{
  password: { type: String }, // No longer required
  status: { type: String, enum: ["active", "pending"], default: "active" }
}
```

### API Changes

#### Employee Creation API (`/api/Employee`)
- For SME role: Creates User record with `status: "pending"`, no password
- Returns success message indicating pending status

#### Signup API (`/api/User/signup`)
- Checks for existing User with pending SME status
- Allows password setup for pending SME accounts
- Activates account upon successful password creation

#### Login API (`/api/User/login`)
- Blocks login attempts for accounts with `status: "pending"`
- Provides clear error message directing to signup process

## User Experience

### Admin Experience
1. Creates SME employee through standard form
2. No password field visible for SME role
3. Receives confirmation that SME account created in pending status
4. Can inform SME user to complete account activation

### SME User Experience
1. Receives notification about account creation
2. Goes to signup page (not login page)
3. Uses registered email to set password
4. Receives confirmation of account activation
5. Can now login normally and access SME portal at `/sme`

## Security Benefits
1. **Admin cannot set passwords** - eliminates password sharing
2. **User controls their password** - only they know it
3. **Two-step verification** - ensures email ownership
4. **Clear account states** - pending vs active status
5. **Audit trail** - clear record of when account was activated

## Error Handling

### Common Scenarios
- **SME tries to login before activation:** Clear message to complete signup
- **SME tries to signup with wrong email:** Email not found error
- **SME tries to signup twice:** Account already activated error
- **Admin creates duplicate SME:** Email already exists error

## Migration Notes
- Existing SME accounts remain unaffected
- New SME accounts follow the pending → active workflow
- No changes needed for other user roles
- Backward compatible with existing authentication system

## Monitoring
Admins can monitor SME account status through:
- SME Monitoring dashboard shows account status
- User management interfaces display pending/active states
- Clear indicators for accounts awaiting activation