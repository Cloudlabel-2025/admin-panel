// Time-related constants
export const TIME_CONSTANTS = {
  MAX_BREAKS: 1,
  BREAK_DURATION: 30, // minutes
  LUNCH_DURATION: 60, // minutes
  REQUIRED_WORK_HOURS: 8,
  MANDATORY_TIME: (8 * 60) + 30, // 8.5 hours in minutes
  GRACE_TIME: 60, // minutes
  PERMISSION_LIMIT: 2 * 60, // 2 hours in minutes
  MAX_PERMISSIONS_PER_MONTH: 2,
  DEFAULT_REQUIRED_LOGIN_TIME: '10:00'
};

// Department constants
export const DEPARTMENTS = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];

// API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://admin-panel-umber-zeta.vercel.app',
  TIMEOUT: 5000
};

// Notification types
export const NOTIFICATION_TYPES = {
  LATE_LOGIN: 'Late Login Alert',
  EXTENSION: 'Extension Alert',
  WARNING: 'warning'
};

// Attendance status
export const ATTENDANCE_STATUS = {
  PRESENT: 'Present',
  HALF_DAY: 'Half Day',
  ABSENT: 'Absent',
  IN_OFFICE: 'In Office'
};

// User roles hierarchy (from lowest to highest privilege)
export const USER_ROLES = {
  INTERN: 'intern',
  EMPLOYEE: 'employee',
  TEAM_ADMIN: 'team-admin',
  TEAM_LEAD: 'team-lead',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super-admin'
};

// Role-based notification recipients mapping
export const ROLE_NOTIFICATION_MAP = {
  [USER_ROLES.INTERN]: ['Team-admin', 'Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'],
  [USER_ROLES.EMPLOYEE]: ['Team-admin', 'Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'],
  [USER_ROLES.TEAM_ADMIN]: ['Team-Lead', 'Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'],
  [USER_ROLES.TEAM_LEAD]: ['Admin', 'admin', 'Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer'],
  [USER_ROLES.ADMIN]: ['Super-admin', 'super-admin', 'SUPER_ADMIN', 'Developer', 'developer']
};

// Super admin ID
export const SUPER_ADMIN_ID = 'ADMIN001';
