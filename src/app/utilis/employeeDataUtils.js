import { createEmployeeModel } from '@/models/Employee';
import { DEPARTMENTS } from './constants';

/**
 * Get employee name and department by employeeId
 * Searches across all departments
 */
export const getEmployeeNameAndDept = async (employeeId) => {
  try {
    for (const dept of DEPARTMENTS) {
      const EmployeeModel = createEmployeeModel(dept);
      const emp = await EmployeeModel.findOne({ employeeId });
      if (emp) {
        return {
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || employeeId,
          department: dept
        };
      }
    }
  } catch (err) {
    console.error('Error fetching employee data:', err);
  }
  return { name: employeeId, department: 'Unknown' };
};

/**
 * Get employee by ID across all departments
 */
export const getEmployeeById = async (employeeId) => {
  try {
    for (const dept of DEPARTMENTS) {
      const EmployeeModel = createEmployeeModel(dept);
      const emp = await EmployeeModel.findOne({ employeeId });
      if (emp) {
        return emp;
      }
    }
  } catch (err) {
    console.error('Error fetching employee:', err);
  }
  return null;
};

/**
 * Get employees by role across all departments
 */
export const getEmployeesByRole = async (roles) => {
  const employees = [];
  try {
    for (const dept of DEPARTMENTS) {
      const EmployeeModel = createEmployeeModel(dept);
      const emps = await EmployeeModel.find({ role: { $in: roles } });
      employees.push(...emps);
    }
  } catch (err) {
    console.error('Error fetching employees by role:', err);
  }
  return employees;
};

/**
 * Get employees by department and role
 */
export const getEmployeesByDepartmentAndRole = async (department, roles) => {
  try {
    const EmployeeModel = createEmployeeModel(department);
    return await EmployeeModel.find({ role: { $in: roles } });
  } catch (err) {
    console.error('Error fetching employees by department and role:', err);
    return [];
  }
};

/**
 * Get all employees in a department
 */
export const getEmployeesByDepartment = async (department) => {
  try {
    const EmployeeModel = createEmployeeModel(department);
    return await EmployeeModel.find({});
  } catch (err) {
    console.error('Error fetching employees by department:', err);
    return [];
  }
};
