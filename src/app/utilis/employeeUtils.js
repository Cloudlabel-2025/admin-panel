import mongoose from "mongoose";
import { createEmployeeModel } from "../../models/Employee";

// Get all department collection names from the database
export async function getDepartmentCollections() {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections
    .map(c => c.name)
    .filter(name => name.endsWith("_department"));
}

// Get all employees from all departments
export async function getAllEmployees() {
  const departmentCollections = await getDepartmentCollections();
  let allEmployees = [];

  for (const collName of departmentCollections) {
    const departmentName = collName.replace("_department", "");
    const Model = createEmployeeModel(departmentName);
    const employees = await Model.find();
    allEmployees = allEmployees.concat(employees);
  }

  return allEmployees;
}

// Find employee across all departments
export async function findEmployeeById(employeeId) {
  const departmentCollections = await getDepartmentCollections();

  for (const collName of departmentCollections) {
    const departmentName = collName.replace("_department", "");
    const Model = createEmployeeModel(departmentName);
    const employee = await Model.findOne({ employeeId });
    if (employee) {
      return {
        employee,
        department: departmentName
      };
    }
  }
  return null;
}

// Create employee in specific department
export async function createEmployeeInDepartment(department, employeeData) {
  const DepartmentModel = createEmployeeModel(department);
  return await DepartmentModel.create(employeeData);
}

// Get employees by department
export async function getEmployeesByDepartment(department) {
  const DepartmentModel = createEmployeeModel(department);
  return await DepartmentModel.find();
}

/**
 * Centalized logic to calculate attendance status
 * @param {number} totalWorkMinutes - actual minutes worked
 * @param {number} permissionMinutes - minutes of permission taken
 * @param {boolean} hasLogout - whether the user has logged out
 * @param {string|Date} date - the date of the record (for In Office vs Logout Missing check)
 * @returns {string} Status ("Present", "Half Day", "Absent", "Logout Missing", "In Office")
 */
export function calculateAttendanceStatus(totalWorkMinutes, permissionMinutes, hasLogout = true, date = null) {
  if (!hasLogout) {
    if (!date) return "In Office";
    
    const recordDate = new Date(date);
    recordDate.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return recordDate >= today ? "In Office" : "Logout Missing";
  }

  // Standard work day is 8 hours (480 mins)
  // Effective minutes = Work minutes + up to 2 hours (120 mins) of allowed permission
  const effectiveMinutes = (totalWorkMinutes || 0) + Math.min(permissionMinutes || 0, 120);

  if (effectiveMinutes >= 480) return "Present";
  if (effectiveMinutes >= 240) return "Half Day";
  return "Absent";
}

/**
 * Calculates start and end dates for a monthly cycle 
 * @param {number} year 
 * @param {number} month (1-12)
 * @param {number} startDay (e.g., 26)
 * @returns { { startDate: Date, endDate: Date } }
 */
export function getDateRangeForMonth(year, month, startDay) {
  let startDate, endDate;

  if (startDay === 1) {
    startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  } else {
    // e.g., if startDay is 26, and month is 3 (March), then:
    // startDate = Feb 26
    // endDate = March 25
    startDate = new Date(Date.UTC(year, month - 2, startDay, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month - 1, startDay - 1, 23, 59, 59, 999));
  }

  return { startDate, endDate };
}