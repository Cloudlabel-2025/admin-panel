"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function CreateEmployeePage() {
  const router = useRouter();
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
    payroll: {
      salary: "",
      currency: "INR",
    },
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "super-admin") {
      router.push("/");
      return;
    }
  }, [router]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/Employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Employee created successfully! Employee can now signup with their email.");
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
          payroll: {
            salary: "",
            currency: "INR",
          },
        });
      } else {
        alert(`Error: ${data.message || "Failed to create employee"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("❌ Submission failed. Please try again.");
    }
  };

  return (
    <Layout>
      <h2>Employee Registration Form</h2>

      <form className="row g-3" onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="col-md-6">
          <label className="form-label">Joining Date</label>
          <input
            type="date"
            className="form-control"
            name="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input
            type="text"
            className="form-control"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            className="form-control"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Date of Birth</label>
          <input
            type="date"
            className="form-control"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Gender</label>
          <select
            className="form-select"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Contact Info */}
        <div className="col-md-6">
          <label className="form-label">
            Email <span className="text-danger">*</span>
          </label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value.toLowerCase(),
              }))
            }
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">
            Phone <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // allow only digits
              if (value.length <= 10) {
                setFormData((prev) => ({ ...prev, phone: value }));
              }
            }}
            pattern="\d{10}"
            maxLength="10"
            required
            placeholder="Enter 10-digit number"
          />
        </div>


        {/* Role */}
        <div className="col-md-6">
          <label className="form-label">Department</label>
          <select
            className="form-select"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            <option value="Technical">Technical</option>
            <option value="Functional">Functional</option>
            <option value="Production">Production</option>
            <option value="OIC">OIC</option>
            <option value="Management">Management</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="Super-admin">Super-admin</option>
            <option value="admin">Admin</option>

            <option value="Team-Lead">Team-Lead</option>
            <option value="Team-admin">Team-admin</option>
            <option value="Employee">Employee</option>
            <option value="Intern">Intern</option>
          </select>
        </div>

        {/* Emergency Contact */}
        <h5 className="mt-4">Emergency Contact</h5>
        <div className="col-md-6">
          <label className="form-label">Contact Person</label>
          <input
            type="text"
            className="form-control"
            name="emergencyContact.contactPerson"
            value={formData.emergencyContact.contactPerson}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">
            Contact Number <span className="text-danger">*</span>
          </label>
          <input
            type="tel"
            className="form-control"
            name="emergencyContact.contactNumber"
            value={formData.emergencyContact.contactNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10) {
                setFormData((prev) => ({
                  ...prev,
                  emergencyContact: { ...prev.emergencyContact, contactNumber: value },
                }));
              }
            }}
            pattern="\d{10}"
            maxLength="10"
            required
            placeholder="Enter 10-digit number"
          />
        </div>


        {/* Address */}
        <h5 className="mt-4">Address</h5>
        <div className="col-12">
          <label className="form-label">Street</label>
          <input
            type="text"
            className="form-control"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">City</label>
          <input
            type="text"
            className="form-control"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">State</label>
          <input
            type="text"
            className="form-control"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Zip</label>
          <input
            type="text"
            className="form-control"
            name="address.zip"
            value={formData.address.zip}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label">Country</label>
          <input
            type="text"
            className="form-control"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
          />
        </div>

        {/* Payroll Information */}
        <h5 className="mt-4">Payroll Information</h5>
        <div className="col-md-6">
          <label className="form-label">Base Salary <span className="text-danger">*</span></label>
          <input
            type="number"
            className="form-control"
            name="payroll.salary"
            value={formData.payroll.salary}
            onChange={handleChange}
            placeholder="Monthly salary"
            required
            min="1000"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Currency</label>
          <input
            type="text"
            className="form-control"
            name="payroll.currency"
            value={formData.payroll.currency}
            onChange={handleChange}
            readOnly
          />
        </div>


        {/* Submit */}
        <div className="col-12 text-center mt-4">
          <button type="submit" className="btn btn-primary px-5">
            Create Employee
          </button>
        </div>
      </form>
    </Layout>
  );
}