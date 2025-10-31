import mongoose from "mongoose";

// Auto-generate employeeId
async function generateEmployeeId() {
  const allCollections = Object.keys(mongoose.connection.collections);
  let maxId = 0;

  for (const name of allCollections) {
    if (name.endsWith("_department")) {
      const collection = mongoose.connection.collections[name];
      const doc = await collection.find().sort({ employeeId: -1 }).limit(1).toArray();
      if (doc.length > 0) {
        const num = parseInt(doc[0].employeeId.replace("CHC", ""));
        if (num > maxId) maxId = num;
      }
    }
  }
  const nextId = maxId + 1;
  return "CHC" + nextId.toString().padStart(4, "0");
}

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Transwomen", "Transmen", "Non-Binary", "Prefer Not to Say", "Other"] },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    joiningDate: { type: Date, default: Date.now },
    department: { type: String },
    role: { type: String },
    emergencyContact: {
      contactPerson: { type: String },
      contactNumber: { type: String },
    },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
      country: { type: String, enum: ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "China", "Singapore", "UAE"] },
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
      currency: { type: String, enum: ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "JPY"], default: "INR" },
    },
  },
  { timestamps: true }
);

EmployeeSchema.pre("save", async function (next) {
  if (!this.employeeId) {
    this.employeeId = await generateEmployeeId();
  }
  next();
});

// Dynamic model creation based on department
export function createEmployeeModel(department) {
  const collectionName = `${department.toLowerCase()}_department`;
  
  // Delete existing model to ensure schema updates are applied
  if (mongoose.models[collectionName]) {
    delete mongoose.models[collectionName];
  }
  
  // Create new model for the department
  return mongoose.model(collectionName, EmployeeSchema, collectionName);
}

export { EmployeeSchema };
