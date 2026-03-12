import Attendance from '@/models/Attendance';
import { getEmployeeNameAndDept } from '@/app/utilis/employeeDataUtils';

/**
 * Create or update attendance record on login
 */
export const createAttendanceOnLogin = async (employeeId, date, loginTime, isLateLogin, lateByMinutes) => {
  try {
    const { name: employeeName, department: employeeDepartment } = await getEmployeeNameAndDept(employeeId);
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });

    if (!existing) {
      await Attendance.findOneAndUpdate(
        { employeeId, date: attendanceDate },
        {
          employeeId,
          employeeName,
          department: employeeDepartment,
          date: attendanceDate,
          status: 'In Office',
          loginTime,
          logoutTime: '',
          totalHours: 0,
          permissionHours: 0,
          overtimeHours: 0,
          isLateLogin: isLateLogin || false,
          lateByMinutes: lateByMinutes || 0,
          remarks: '',
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log('Attendance created for', employeeId, 'Name:', employeeName, 'Dept:', employeeDepartment);
    } else {
      // Update existing attendance with proper name/department if missing
      if (!existing.employeeName || existing.employeeName === existing.employeeId || existing.department === 'Unknown') {
        existing.employeeName = employeeName;
        existing.department = employeeDepartment;
        await existing.save();
      }
      console.log('Attendance already exists for', employeeId);
    }

    return { success: true };
  } catch (err) {
    console.error('Attendance creation error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Update attendance record on logout
 */
export const updateAttendanceOnLogout = async (timecard, logoutTime, attendanceStatus, manualLogoutReason, autoLogoutReason) => {
  try {
    const { name: employeeName, department: employeeDepartment } = await getEmployeeNameAndDept(timecard.employeeId);
    const attendanceDate = new Date(timecard.date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    const totalHours = timecard.workMinutes ? timecard.workMinutes / 60 : 0;
    const permissionHours = (timecard.permissionMinutes || 0) / 60;

    await Attendance.findOneAndUpdate(
      {
        employeeId: timecard.employeeId,
        date: attendanceDate
      },
      {
        employeeId: timecard.employeeId,
        employeeName,
        department: employeeDepartment,
        date: attendanceDate,
        status: attendanceStatus,
        loginTime: timecard.logIn,
        logoutTime,
        totalHours,
        permissionHours,
        overtimeHours: Math.max(0, totalHours - 8),
        isLateLogin: timecard.lateLogin || false,
        lateByMinutes: timecard.lateLoginMinutes || 0,
        remarks: manualLogoutReason || autoLogoutReason || '',
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('✅ Attendance updated successfully for', timecard.employeeId);
    return { success: true };
  } catch (err) {
    console.error('❌ Failed to update attendance on logout:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Get attendance record
 */
export const getAttendanceRecord = async (employeeId, date) => {
  try {
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    return await Attendance.findOne({
      employeeId,
      date: attendanceDate
    });
  } catch (err) {
    console.error('Error fetching attendance record:', err);
    return null;
  }
};
