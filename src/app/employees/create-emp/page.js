"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
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
  const [dateError, setDateError] = useState("");
  const [dobError, setDobError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [validated, setValidated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [highlightErrors, setHighlightErrors] = useState(false);
  const [countryCode, setCountryCode] = useState("IN");
  const [emergencyCountryCode, setEmergencyCountryCode] = useState("IN");
  const [emergencyPhoneError, setEmergencyPhoneError] = useState("");
  const [age, setAge] = useState("");

  const countryOptions = [
    { code: "US", dial: "+1", name: "US/CA", regex: /^[0-9]{10}$/, format: "10 digits", pattern: "[0-9]{10}" },
    { code: "GB", dial: "+44", name: "UK", regex: /^[0-9]{10,11}$/, format: "10-11 digits", pattern: "[0-9]{10,11}" },
    { code: "AU", dial: "+61", name: "AU", regex: /^[0-9]{9}$/, format: "9 digits", pattern: "[0-9]{9}" },
    { code: "JP", dial: "+81", name: "JP", regex: /^[0-9]{10}$/, format: "10 digits", pattern: "[0-9]{10}" },
    { code: "CN", dial: "+86", name: "CN", regex: /^[0-9]{11}$/, format: "11 digits", pattern: "[0-9]{11}" },
    { code: "IN", dial: "+91", name: "IN", regex: /^[0-9]{10}$/, format: "10 digits", pattern: "[0-9]{10}" },
    { code: "AE", dial: "+971", name: "AE", regex: /^[0-9]{9}$/, format: "9 digits", pattern: "[0-9]{9}" }
  ];

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
    setValidated(true);

    // Validate required fields
    if (!formData.firstName || !formData.email || !formData.phone || !formData.joiningDate || !formData.department || !formData.role || !formData.emergencyContact.contactNumber || !formData.payroll.salary) {
      setError("Please fill all required fields marked with *");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (dateError) {
      setError("Please fix the joining date error");
      setTimeout(() => setError(""), 3000);
      return;
    }

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
        setCurrentStep(1);
        setValidated(false);
        setHighlightErrors(false);
        setCountryCode("IN");
        setEmergencyCountryCode("IN");
        setDateError("");
        setDobError("");
        setEmailError("");
        setPhoneError("");
        setEmergencyPhoneError("");
        setAge("");
      } else {
        const errorMsg = data.message || data.error || "Failed to create employee";
        setError(errorMsg);
        setTimeout(() => setError(""), 5000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      const errorMsg = error.message || "Network error. Please check your connection and try again.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
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
              <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }} />
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }} />
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

      {/* Progress Steps */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className={`flex-fill text-center ${currentStep >= 1 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>1</div>
              <div className="small">Basic Info</div>
            </div>
            <div className="flex-fill" style={{ height: '2px', backgroundColor: currentStep >= 2 ? '#0d6efd' : '#dee2e6' }}></div>
            <div className={`flex-fill text-center ${currentStep >= 2 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>2</div>
              <div className="small">Contact</div>
            </div>
            <div className="flex-fill" style={{ height: '2px', backgroundColor: currentStep >= 3 ? '#0d6efd' : '#dee2e6' }}></div>
            <div className={`flex-fill text-center ${currentStep >= 3 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>3</div>
              <div className="small">Work Info</div>
            </div>
            <div className="flex-fill" style={{ height: '2px', backgroundColor: currentStep >= 4 ? '#0d6efd' : '#dee2e6' }}></div>
            <div className={`flex-fill text-center ${currentStep >= 4 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currentStep >= 4 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>4</div>
              <div className="small">Emergency</div>
            </div>
            <div className="flex-fill" style={{ height: '2px', backgroundColor: currentStep >= 5 ? '#0d6efd' : '#dee2e6' }}></div>
            <div className={`flex-fill text-center ${currentStep >= 5 ? 'text-primary fw-bold' : 'text-muted'}`}>
              <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${currentStep >= 5 ? 'bg-primary text-white' : 'bg-light'}`} style={{ width: '40px', height: '40px' }}>5</div>
              <div className="small">Address & Payroll</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-4">
          <form className={`row g-3 ${validated ? 'was-validated' : ''}`} onSubmit={handleSubmit} noValidate suppressHydrationWarning>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                <div className="col-12">
                  <h5 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-person-circle me-2"></i>
                    Basic Information
                  </h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Joining Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className={`form-control ${dateError || (highlightErrors && !formData.joiningDate) ? 'is-invalid' : ''}`}
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={(e) => {
                      handleChange(e);

                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        const minDate = new Date('2022-03-21');
                        const maxDate = new Date();
                        maxDate.setMonth(maxDate.getMonth() + 6);

                        if (selectedDate < minDate || selectedDate > maxDate) {
                          setDateError('Date must be between March 21, 2022 and 6 months from today');
                        } else {
                          setDateError('');
                        }
                      } else {
                        setDateError('');
                      }
                    }}
                    min="2022-03-21"
                    max={(() => {
                      const today = new Date();
                      today.setMonth(today.getMonth() + 6);
                      return today.toISOString().split('T')[0];
                    })()}
                    required
                  />
                  {dateError && <div className="invalid-feedback">{dateError}</div>}

                </div>

                <div className="col-md-6">
                  <label className="form-label">First Name<span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${highlightErrors && !formData.firstName ? 'is-invalid' : ''}`}
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                      if (value.length <= 20) {
                        setFormData((prev) => ({ ...prev, firstName: value }));
                      }
                    }}
                    pattern="[a-zA-Z\s.]+"
                    maxLength="20"
                    required
                  />

                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${highlightErrors && !formData.lastName ? 'is-invalid' : ''}`}
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                      if (value.length <= 20) {
                        setFormData((prev) => ({ ...prev, lastName: value }));
                      }
                    }}
                    pattern="[a-zA-Z\s.]+"
                    maxLength="20"
                    required
                  />

                </div>

                <div className="col-md-6">
                  <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className={`form-control ${dobError || (highlightErrors && !formData.dob) ? 'is-invalid' : ''}`}
                    name="dob"
                    value={formData.dob}
                    onChange={(e) => {
                      handleChange(e);

                      if (e.target.value) {
                        const birthDate = new Date(e.target.value);
                        const minDate = new Date('1965-01-01');
                        const today = new Date();
                        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();

                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                          calculatedAge--;
                        }

                        setAge(calculatedAge);

                        if (birthDate < minDate) {
                          setDobError('Date of birth must be from 1965 onwards');
                        } else if (calculatedAge < 18) {
                          setDobError('Employee must be at least 18 years old');
                        } else {
                          setDobError('');
                        }
                      } else {
                        setAge('');
                        setDobError('');
                      }
                    }}
                    min="1965-01-01"
                    max={(() => {
                      const today = new Date();
                      today.setFullYear(today.getFullYear() - 18);
                      return today.toISOString().split('T')[0];
                    })()}
                    required
                  />
                  {dobError && <div className="invalid-feedback">{dobError}</div>}
                  {age && !dobError && <div className="text-muted small mt-1">Age: {age} years</div>}

                </div>
                <div className="col-md-6">
                  <label className="form-label">Gender <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${highlightErrors && !formData.gender ? 'is-invalid' : ''}`}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transwomen">Transwomen</option>
                    <option value="Transmen">Transmen</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer Not to Say">Prefer Not to Say</option>
                  </select>

                </div>
              </>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <>
                <div className="col-12">
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
                    className={`form-control ${emailError || (highlightErrors && (!formData.email || !formData.email.includes('@'))) ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 50) {
                        setFormData((prev) => ({
                          ...prev,
                          email: value,
                        }));

                        if (value) {
                          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          if (!emailRegex.test(value)) {
                            setEmailError('Please enter a valid email address');
                          } else {
                            setEmailError('');
                          }
                        } else {
                          setEmailError('');
                        }
                      }
                    }}
                    maxLength="50"
                    required
                  />
                  {emailError && <div className="invalid-feedback">{emailError}</div>}

                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setFormData((prev) => ({ ...prev, phone: "" }));
                        setPhoneError('');
                      }}
                      style={{ maxWidth: '120px' }}
                    >
                      {countryOptions.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.dial} ({country.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className={`form-control ${phoneError || (highlightErrors && !formData.phone) ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const country = countryOptions.find(c => c.code === countryCode);

                        setFormData((prev) => ({ ...prev, phone: value }));

                        if (value.length > 0) {
                          if (!country.regex.test(value)) {
                            setPhoneError(`Please enter a valid phone number for ${country.name} (${country.format})`);
                          } else {
                            setPhoneError('');
                          }
                        } else {
                          setPhoneError('');
                        }
                      }}
                      pattern={countryOptions.find(c => c.code === countryCode).pattern}
                      required
                      placeholder={`Enter ${countryOptions.find(c => c.code === countryCode).format}`}
                    />
                    {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Work Information */}
            {currentStep === 3 && (
              <>
                <div className="col-12">
                  <h5 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-briefcase-fill me-2"></i>
                    Work Information
                  </h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Department <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${highlightErrors && !formData.department ? 'is-invalid' : ''}`}
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
                {formData.department && (
                  <div className="col-md-6">
                    <label className="form-label">Role <span className="text-danger">*</span></label>
                    <select
                      className={`form-select ${highlightErrors && !formData.role ? 'is-invalid' : ''}`}
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Role</option>
                      {formData.department === "Management" ? (
                        <option value="admin">Admin</option>
                      ) : (
                        <>
                          {(userRole === "developer" || userRole === "admin") && (
                            <option value="Super-admin">Super-admin</option>
                          )}
                          <option value="Team-Lead">Team-Lead</option>
                          <option value="Team-admin">Team-admin</option>
                          <option value="Employee">Employee</option>
                          <option value="Intern">Intern</option>
                        </>
                      )}
                    </select>

                  </div>
                )}
              </>
            )}

            {/* Step 4: Emergency Contact */}
            {currentStep === 4 && (
              <>
                <div className="col-12">
                  <h5 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-person-exclamation me-2"></i>
                    Emergency Contact
                  </h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Contact Person <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${highlightErrors && !formData.emergencyContact.contactPerson ? 'is-invalid' : ''}`}
                    name="emergencyContact.contactPerson"
                    value={formData.emergencyContact.contactPerson}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                      if (value.length <= 30) {
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, contactPerson: value }
                        }));
                      }
                    }}
                    pattern="[a-zA-Z\s.]+"
                    maxLength="30"
                    required
                  />

                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Contact Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={emergencyCountryCode}
                      onChange={(e) => {
                        setEmergencyCountryCode(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, contactNumber: "" }
                        }));
                        setEmergencyPhoneError('');
                      }}
                      style={{ maxWidth: '120px' }}
                    >
                      {countryOptions.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.dial} ({country.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className={`form-control ${emergencyPhoneError || (highlightErrors && !formData.emergencyContact.contactNumber) ? 'is-invalid' : ''}`}
                      name="emergencyContact.contactNumber"
                      value={formData.emergencyContact.contactNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        const country = countryOptions.find(c => c.code === emergencyCountryCode);

                        setFormData((prev) => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, contactNumber: value }
                        }));

                        if (value.length > 0) {
                          if (!country.regex.test(value)) {
                            setEmergencyPhoneError(`Please enter a valid phone number for ${country.name} (${country.format})`);
                          } else {
                            setEmergencyPhoneError('');
                          }
                        } else {
                          setEmergencyPhoneError('');
                        }
                      }}
                      pattern={countryOptions.find(c => c.code === emergencyCountryCode).pattern}
                      required
                      placeholder={`Enter ${countryOptions.find(c => c.code === emergencyCountryCode).format}`}
                    />
                    {emergencyPhoneError && <div className="invalid-feedback">{emergencyPhoneError}</div>}
                  </div>

                </div>
              </>
            )}

            {/* Step 5: Address & Payroll */}
            {currentStep === 5 && (
              <>
                <div className="col-12">
                  <h5 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-geo-alt-fill me-2"></i>
                    Address Information
                  </h5>
                </div>
                <div className="col-12">
                  <label className="form-label">Street <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.street"
                    value={formData.address.street}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        handleChange(e);
                      }
                    }}
                    maxLength="100"
                    required
                  />

                </div>
                <div className="col-md-4">
                  <label className="form-label">City <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.city"
                    value={formData.address.city}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      if (value.length <= 30) {
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, city: value }
                        }));
                      }
                    }}
                    pattern="[a-zA-Z\s]+"
                    maxLength="30"
                    required
                  />

                </div>
                <div className="col-md-4">
                  <label className="form-label">State <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.state"
                    value={formData.address.state}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      if (value.length <= 30) {
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, state: value }
                        }));
                      }
                    }}
                    pattern="[a-zA-Z\s]+"
                    maxLength="30"
                    required
                  />

                </div>
                <div className="col-md-2">
                  <label className="form-label">Zip <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.zip"
                    value={formData.address.zip}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length <= 6) {
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, zip: value }
                        }));
                      }
                    }}
                    pattern="[0-9]{6}"
                    maxLength="6"
                    required
                    placeholder="6 digits"
                  />

                </div>
                <div className="col-md-2">
                  <label className="form-label">Country <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="address.country"
                    value={formData.address.country}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      if (value.length <= 30) {
                        setFormData((prev) => ({
                          ...prev,
                          address: { ...prev.address, country: value }
                        }));
                      }
                    }}
                    pattern="[a-zA-Z\s]+"
                    maxLength="30"
                    required
                  />

                </div>

                {/* Payroll Information Section */}
                <div className="col-12 mt-4">
                  <h5 className="text-secondary border-bottom pb-2 mb-3">
                    <i className="bi bi-currency-rupee me-2"></i>
                    Payroll Information
                  </h5>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Base Salary <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={formData.payroll.currency}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          payroll: { ...prev.payroll, currency: e.target.value }
                        }));
                      }}
                      style={{ maxWidth: '100px' }}
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                      <option value="JPY">JPY</option>
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      name="payroll.salary"
                      value={formData.payroll.salary}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        if (value.length <= 7) {
                          setFormData((prev) => ({
                            ...prev,
                            payroll: { ...prev.payroll, salary: value }
                          }));
                        }
                      }}
                      pattern="[0-9]{1,7}"
                      maxLength="7"
                      placeholder="Monthly salary"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="col-12 d-flex justify-content-between mt-5">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Previous
                </button>
              )}
              {currentStep < 5 ? (
                <button
                  type="button"
                  className="btn btn-primary px-4 ms-auto"
                  onClick={async () => {
                    // Validate current step before moving to next
                    let hasError = false;
                    if (currentStep === 1) {
                      if (!formData.joiningDate || !formData.firstName || !formData.lastName || !formData.dob || !formData.gender || dateError || dobError) {
                        hasError = true;
                      }
                    } else if (currentStep === 2) {
                      const country = countryOptions.find(c => c.code === countryCode);
                      const phoneValid = formData.phone && country.regex.test(formData.phone);
                      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      const emailValid = formData.email && emailRegex.test(formData.email);
                      if (!emailValid || !phoneValid || phoneError || emailError) {
                        hasError = true;
                      }

                      if (!hasError) {
                        // Check if email or phone already exists across all departments
                        try {
                          const token = localStorage.getItem("token");
                          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];

                          for (const dept of departments) {
                            const response = await fetch(`/api/Employee/department/${dept}`, {
                              headers: { "Authorization": `Bearer ${token}` }
                            });
                            const data = await response.json();

                            if (Array.isArray(data) && data.length > 0) {
                              const emailExists = data.some(emp => emp.email === formData.email);
                              const phoneInContactInfo = data.some(emp => emp.phone === formData.phone);
                              const phoneInEmergencyContact = data.some(emp => emp.emergencyContact?.contactNumber === formData.phone);

                              if (emailExists) {
                                setEmailError('This email is already registered. Please use a different email.');
                                setHighlightErrors(true);
                                hasError = true;
                              }
                              if (phoneInContactInfo || phoneInEmergencyContact) {
                                setPhoneError('This phone number is already registered. Please use a different number.');
                                setHighlightErrors(true);
                                hasError = true;
                              }

                              if (hasError) break;
                            }
                          }
                        } catch (err) {
                          console.error('Validation error:', err);
                        }
                      }
                    } else if (currentStep === 3) {
                      if (!formData.department || !formData.role) {
                        hasError = true;
                      }
                    } else if (currentStep === 4) {
                      const country = countryOptions.find(c => c.code === emergencyCountryCode);
                      const emergencyPhoneValid = formData.emergencyContact.contactNumber && country.regex.test(formData.emergencyContact.contactNumber);
                      if (!formData.emergencyContact.contactPerson || !emergencyPhoneValid || emergencyPhoneError) {
                        hasError = true;
                      }

                      if (!hasError) {
                        // Check if emergency contact number is same as contact phone
                        if (formData.emergencyContact.contactNumber === formData.phone) {
                          setEmergencyPhoneError('Emergency contact number cannot be the same as contact phone number.');
                          setHighlightErrors(true);
                          hasError = true;
                        }
                      }

                      if (!hasError) {
                        // Check if emergency contact number already exists across all departments
                        try {
                          const token = localStorage.getItem("token");
                          const departments = ['Technical', 'Functional', 'Production', 'OIC', 'Management'];

                          for (const dept of departments) {
                            const response = await fetch(`/api/Employee/department/${dept}`, {
                              headers: { "Authorization": `Bearer ${token}` }
                            });
                            const data = await response.json();

                            if (Array.isArray(data) && data.length > 0) {
                              const phoneInContactInfo = data.some(emp => emp.phone === formData.emergencyContact.contactNumber);
                              const phoneInEmergencyContact = data.some(emp => emp.emergencyContact?.contactNumber === formData.emergencyContact.contactNumber);

                              if (phoneInContactInfo || phoneInEmergencyContact) {
                                setEmergencyPhoneError('This phone number is already registered. Please use a different number.');
                                setHighlightErrors(true);
                                hasError = true;
                                break;
                              }
                            }
                          }
                        } catch (err) {
                          console.error('Validation error:', err);
                        }
                      }
                    }

                    if (hasError) {
                      setHighlightErrors(true);
                      setError('Please correct the errors before proceeding');
                      setTimeout(() => setError(''), 3000);
                      return;
                    }

                    setHighlightErrors(false);
                    setCurrentStep(currentStep + 1);
                  }}
                >
                  Next
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success px-5 ms-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Create Employee
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
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
        .form-control.is-valid, .form-select.is-valid {
          border-color: #ced4da !important;
          background-image: none !important;
          padding-right: 0.75rem !important;
        }
        .was-validated .form-control:valid, .was-validated .form-select:valid {
          border-color: #ced4da !important;
          background-image: none !important;
          padding-right: 0.75rem !important;
        }
        .form-control.is-invalid, .form-select.is-invalid {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right calc(0.375em + 0.1875rem) center;
          background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
          border-color: #dc3545;
          padding-right: calc(1.5em + 0.75rem);
        }
      `}</style>
    </Layout>
  );
}