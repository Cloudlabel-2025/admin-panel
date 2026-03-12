import { ROLE_NOTIFICATION_MAP, SUPER_ADMIN_ID, NOTIFICATION_TYPES, API_CONFIG } from './constants';
import { getEmployeesByRole } from './employeeDataUtils';

/**
 * Get recipient roles based on user role
 */
export const getRecipientRoles = (userRole) => {
  const roleLower = userRole?.toLowerCase();
  return ROLE_NOTIFICATION_MAP[roleLower] || [];
};

/**
 * Build notification object
 */
export const buildNotification = (employeeId, title, message, type = 'warning') => {
  return {
    employeeId,
    title,
    message,
    type,
    isRead: false
  };
};

/**
 * Get all notification recipients for a user role
 * Always includes super admin, then adds role-based recipients
 */
export const getNotificationRecipients = async (userRole) => {
  const notifiedIds = new Set();
  const notifications = [];

  // Always notify super admin
  notifications.push(SUPER_ADMIN_ID);
  notifiedIds.add(SUPER_ADMIN_ID);

  // Get role-based recipients
  const recipientRoles = getRecipientRoles(userRole);
  if (recipientRoles.length > 0) {
    const recipients = await getEmployeesByRole(recipientRoles);
    recipients.forEach(recipient => {
      if (!notifiedIds.has(recipient.employeeId)) {
        notifications.push(recipient.employeeId);
        notifiedIds.add(recipient.employeeId);
      }
    });
  }

  return notifications;
};

/**
 * Send notifications via API
 */
export const sendNotifications = async (notifications) => {
  if (!notifications || notifications.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications }),
      timeout: API_CONFIG.TIMEOUT
    });

    if (!response.ok) {
      console.error('Notification API error:', response.status);
      return { success: false, error: `API returned ${response.status}` };
    }

    const result = await response.json();
    return { success: true, count: notifications.length, result };
  } catch (err) {
    console.error('Failed to send notifications:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Create and send late login notifications
 */
export const createLateLoginNotifications = (employeeName, employeeId, loginTime, requiredTime) => {
  const message = `${employeeName} (${employeeId}) logged in late at ${loginTime}. Required: ${requiredTime}`;
  return {
    title: NOTIFICATION_TYPES.LATE_LOGIN,
    message,
    type: NOTIFICATION_TYPES.WARNING
  };
};

/**
 * Create and send extension notifications
 */
export const createExtensionNotifications = (employeeName, employeeId, type, extensionMinutes) => {
  const message = `${employeeName} (${employeeId}) extended ${type.toLowerCase()} by ${extensionMinutes} minutes`;
  return {
    title: `${type} Extension Alert`,
    message,
    type: NOTIFICATION_TYPES.WARNING
  };
};
