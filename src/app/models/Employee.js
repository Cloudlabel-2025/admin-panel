import mongoose from "mongoose";

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },

    joiningDate: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ["Super-admin", "admin", "Team-admin", "Employee", "Intern"],
    },

    emergencyContact: {
      contactPerson: { type: String },
      contactNumber: { type: String },
    },

    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String },
    },

    documents: [
      {
        docType: { type: String },
        docNumber: { type: String },
        issueDate: { type: Date },
        expiryDate: { type: Date },
        fileUrl: { type: String },
      },
    ],

    skills: [
      {
        name: { type: String },
        level: { type: String },
        yearsOfExperience: { type: String },
        certifications: { type: String },
      },
    ],

    projects: [
      {
        projectId: { type: String },
        projectName: { type: String },
        roleInProject: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
        status: { type: String },
        technologies: { type: String },
      },
    ],

    payroll: {
      salary: { type: String },
      bonus: { type: String },
      deductions: { type: String },
      currency: { type: String },
    },
  },
  { timestamps: true } 
);

export default mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);
