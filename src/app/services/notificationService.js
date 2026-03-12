import { getRecipientRoles, buildNotification, sendNotifications, createLateLoginNotifications, createExtensionNotifications } from '@/app/utilis/notificationUtils';
import { getEmployeesByRole } from '@/app/utilis/employeeDataUtils';
import { SUPER_ADMIN_ID } from '@/app/utilis/constants';

/**
 * Send late login notification
 */
export const notifyLateLogin = async (employeeId, employeeName, loginTime, requiredTime, userRole) => {
  try {
    console.log('Sending late login notification for', employeeId, 'at', loginTime);

    const recipientRoles = getRecipientRoles(userRole);
    const notificationData = createLateLoginNotifications(employeeName, employeeId, loginTime, requiredTime);
    
    const notifications = [];
    const notifiedIds = new Set();

    // Always notify super admin
    notifications.push(buildNotification(SUPER_ADMIN_ID, notificationData.title, notificationData.message, notificationData.type));
    notifiedIds.add(SUPER_ADMIN_ID);

    // Add role-based recipients
    if (recipientRoles.length > 0) {
      const recipients = await getEmployeesByRole(recipientRoles);
      recipients.forEach(recipient => {
        if (!notifiedIds.has(recipient.employeeId)) {
          notifications.push(buildNotification(recipient.employeeId, notificationData.title, notificationData.message, notificationData.type));
          notifiedIds.add(recipient.employeeId);
        }
      });
    }

    console.log('Late login notifications to send:', notifications.length);
    console.log('Recipients:', [...notifiedIds]);

    return await sendNotifications(notifications);
  } catch (err) {
    console.error('Late login notification failed:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send extension notification (break/lunch/permission)
 */
export const notifyExtension = async (employeeId, employeeName, type, extensionMinutes, userRole) => {
  try {
    console.log(`Sending ${type} extension notification for`, employeeId, `- ${extensionMinutes} minutes`);

    const recipientRoles = getRecipientRoles(userRole);
    const notificationData = createExtensionNotifications(employeeName, employeeId, type, extensionMinutes);
    
    const notifications = [];
    const notifiedIds = new Set();

    // Always notify super admin
    notifications.push(buildNotification(SUPER_ADMIN_ID, notificationData.title, notificationData.message, notificationData.type));
    notifiedIds.add(SUPER_ADMIN_ID);

    // Add role-based recipients
    if (recipientRoles.length > 0) {
      const recipients = await getEmployeesByRole(recipientRoles);
      recipients.forEach(recipient => {
        if (!notifiedIds.has(recipient.employeeId)) {
          notifications.push(buildNotification(recipient.employeeId, notificationData.title, notificationData.message, notificationData.type));
          notifiedIds.add(recipient.employeeId);
        }
      });
    }

    console.log(`${type} extension notifications to send:`, notifications.length);

    return await sendNotifications(notifications);
  } catch (err) {
    console.error(`${type} extension notification failed:`, err);
    return { success: false, error: err.message };
  }
};
