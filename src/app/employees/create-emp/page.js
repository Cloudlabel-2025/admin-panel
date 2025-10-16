"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function CreateEmployeePage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
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
    setUserRole(role);
    if (role !== "super-admin" && role !== "Super-admin" && role !== "admin" && role !== "developer") {
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
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/Employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
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
        setError(data.message || "Failed to create employee");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setError("Submission failed. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {showSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">
          <i className="bi bi-person-plus-fill me-2"></i>
          Employee Registration
        </h2>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <form className="row g-3" onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <div className="col-12">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-person-circle me-2"></i>
            Basic Information
          </h5>
        </div>
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

        {/* Contact Information Section */}
        <div className="col-12 mt-4">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-telephone-fill me-2"></i>
            Contact Information
          </h5>
        </div>
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


        {/* Work Information Section */}
        <div className="col-12 mt-4">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-briefcase-fill me-2"></i>
            Work Information
          </h5>
        </div>
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
            {(userRole === "developer" || userRole === "admin") && (
              <option value="Super-admin">Super-admin</option>
            )}
            <option value="admin">Admin</option>
            <option value="Team-Lead">Team-Lead</option>
            <option value="Team-admin">Team-admin</option>
            <option value="Employee">Employee</option>
            <option value="Intern">Intern</option>
          </select>
        </div>

        {/* Emergency Contact Section */}
        <div className="col-12 mt-4">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-person-exclamation me-2"></i>
            Emergency Contact
          </h5>
        </div>
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


        {/* Address Section */}
        <div className="col-12 mt-4">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-geo-alt-fill me-2"></i>
            Address Information
          </h5>
        </div>
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

        {/* Payroll Information Section */}
        <div className="col-12 mt-4">
          <h5 className="text-secondary border-bottom pb-2 mb-3">
            <i className="bi bi-currency-dollar me-2"></i>
            Payroll Information
          </h5>
        </div>
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


        {/* Submit Button */}
        <div className="col-12 text-center mt-5">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg px-5" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating Employee...
              </>
            ) : (
              <>
                <i className="bi bi-person-plus-fill me-2"></i>
                Create Employee
              </>
            )}
          </button>
        </div>
          </form>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes drawCircle {
          from { stroke-dasharray: 0 63; }
          to { stroke-dasharray: 63 63; }
        }
        @keyframes drawCheck {
          from { stroke-dasharray: 0 20; }
          to { stroke-dasharray: 20 20; }
        }
      `}</style>
    </Layout>
  );
}