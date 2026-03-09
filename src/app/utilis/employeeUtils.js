import mongoose from "mongoose";
import { createEmployeeModel } from "../models/Employee.js";

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