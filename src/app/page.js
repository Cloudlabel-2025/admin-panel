"use client";

import { useState } from "react";

export default function EmployeeForm() {
  const departmentOptions = [
    "Technical",
    "Functional",
    "Production",
    "OIC",
  ];

  const roleOptions = [
    "Super-admin",
    "admin",
    "Team-Manager",
    "Team-Lead",
    "Team-admin",
    "Employee",
    "Intern",
  ];

  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    joiningDate: "",
    department: "",
    role: "",
    emergencyContact: {
      contactPerson: "",
      contactNumber: "",
    },
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate unique fields before submit
  const validateUniqueFields = async () => {
    try {
      // send only the fields needed for validation (keeps payload small)
      const payload = {
        employeeId: formData.employeeId,
        email: formData.email,
        phone: formData.phone,
        emergencyContact: { contactNumber: formData.emergencyContact.contactNumber },
      };

      const response = await fetch("/api/Employee/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Handle old-style API: returns 400 with { error: "Duplicate entry found", duplicate }
      if (!response.ok) {
        if (result && result.error && result.error.toLowerCase().includes("duplicate")) {
          // try to guess which field from the duplicate object if present
          let dupField = "A field";
          if (result.duplicate) {
            const d = result.duplicate;
            if (d.employeeId && d.employeeId === payload.employeeId) dupField = "Employee ID";
            else if (d.email && d.email === payload.email) dupField = "Email";
            else if (d.phone && d.phone === payload.phone) dupField = "Phone";
            else if (d.emergencyContact?.contactNumber && payload.emergencyContact?.contactNumber && d.emergencyContact.contactNumber === payload.emergencyContact.contactNumber)
              dupField = "Emergency Contact Number";
          }
          alert(`❌ Duplicate found: ${dupField} already exists.`);
          return false;
        }

        alert(`❌ ${result.error || "Validation failed"}`);
        return false;
      }

      // Handle new-style API: returns { exists: true, field: "Email" } or { exists:false }
      if (result.exists) {
        const field = result.field || "A field";
        alert(`❌ Duplicate found: ${field} already exists.`);
        return false;
      }

      // If API returns a friendly message
      if (result.message && result.message.toLowerCase().includes("no duplicates")) {
        return true;
      }

      // default success
      return true;
    } catch (err) {
      console.error("Validation error:", err);
      alert("❌ Error validating uniqueness. Please try again.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure required front-end fields present
    if (!formData.employeeId || !formData.email || !formData.phone || !formData.department || !formData.emergencyContact.contactNumber) {
      alert("Please fill Employee ID, Email, Phone, Department and Emergency Contact Number.");
      setLoading(false);
      return;
    }

    const isUnique = await validateUniqueFields();
    if (!isUnique) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/Employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Employee created successfully!");
        setFormData({
          employeeId: "",
          firstName: "",
          lastName: "",
          dob: "",
          gender: "",
          email: "",
          phone: "",
          joiningDate: "",
          department: "",
          role: "",
          emergencyContact: { contactPerson: "", contactNumber: "" },
          address: { street: "", city: "", state: "", zip: "", country: "" },
        });
      } else {
        // backend may return different error keys
        alert(`❌ Error: ${data.error || data.message || "Failed to create employee"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("❌ Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Employee Registration Form</h2>
      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Employee ID */}
        <div className="col-md-6">
          <label className="form-label">Employee ID</label>
          <input
            type="text"
            
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* First Name */}
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Last Name */}
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Date of Birth */}
        <div className="col-md-6">
          <label className="form-label">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Gender */}
        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Choose...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Email */}
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Phone */}
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Department (dropdown) */}
        <div className="col-md-6">
          <label className="form-label">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select Department</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Role (dropdown) */}
        <div className="col-md-6">
          <label className="form-label">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select Role</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Emergency Contact Person */}
        <div className="col-md-6">
          <label className="form-label">Emergency Contact Person</label>
          <input
            type="text"
            name="emergencyContact.contactPerson"
            value={formData.emergencyContact.contactPerson}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Emergency Contact Number */}
        <div className="col-md-6">
          <label className="form-label">Emergency Contact Number</label>
          <input
            type="text"
            name="emergencyContact.contactNumber"
            value={formData.emergencyContact.contactNumber}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>

        {/* Address Fields */}
        <div className="col-md-6">
          <label className="form-label">Street</label>
          <input
            type="text"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">City</label>
          <input
            type="text"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">State</label>
          <input
            type="text"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">ZIP</label>
          <input
            type="text"
            name="address.zip"
            value={formData.address.zip}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-4">
          <label className="form-label">Country</label>
          <input
            type="text"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        {/* Submit Button */}
        <div className="col-12 text-center mt-4">
          <button
            type="submit"
            className="btn btn-primary px-5"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
