import mongoose from "mongoose";
import { createEmployeeModel } from "../models/Employee.js";

// Get all department collection names
export function getDepartmentCollections() {
  return Object.keys(mongoose.models).filter(name => 
    name.endsWith("_department")
  );
}

// Get all employees from all departments
export async function getAllEmployees() {
  const departmentCollections = getDepartmentCollections();
  let allEmployees = [];
  
  for (const collName of departmentCollections) {
    const Model = mongoose.models[collName];
    const employees = await Model.find();
    allEmployees = allEmployees.concat(employees);
  }
  
  return allEmployees;
}

// Find employee across all departments
export async function findEmployeeById(employeeId) {
  const departmentCollections = getDepartmentCollections();
  
  for (const collName of departmentCollections) {
    const Model = mongoose.models[collName];
    const employee = await Model.findOne({ employeeId });
    if (employee) {
      return {
        employee,
        department: collName.replace("_department", "")
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