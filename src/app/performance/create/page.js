"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import SuccessMessage from "@/app/components/SuccessMessage";

export default function CreatePerformance() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    reviewPeriod: "",
    reviewer: "",
    goals: [""],
    achievements: [""],
    ratings: {
      communication: 1,
      teamwork: 1,
      problemsolving: 1,
      leadership: 1,
    },
    overall: 1,
    comments: "",
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    const userDepartment = localStorage.getItem("userDepartment");
    
    // Set reviewer as current user
    if (userRole === "super-admin") {
      setForm(prev => ({ ...prev, reviewer: "Super Admin" }));
    } else {
      // Get current user's name for reviewer field
      const employeeId = localStorage.getItem("employeeId");
      if (employeeId) {
        fetch(`/api/Employee/${employeeId}`)
          .then(res => res.json())
          .then(data => {
            const reviewerName = data.name || `${data.firstName} ${data.lastName}` || data.firstName || userEmail;
            setForm(prev => ({ ...prev, reviewer: reviewerName }));
          })
          .catch(() => {
            setForm(prev => ({ ...prev, reviewer: userEmail }));
          });
      }
    }

    // Fetch employees from Employee API
    fetch("/api/Employee")
      .then((res) => res.json())
      .then((data) => {
        let filteredEmployees = Array.isArray(data) ? data : [];
        
        // Filter employees based on role hierarchy
        if (userRole === "Team-Lead") {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.role === "Employee" || emp.role === "Intern"
          );
        } else if (userRole === "Team-admin") {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.role === "Employee" || emp.role === "Intern" || emp.role === "Team-Lead"
          );
        } else if (userRole === "Admin") {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.role !== "super-admin" && emp.role !== "Admin"
          );
        }
        // Super-admin can review everyone
        
        setEmployees(filteredEmployees);
      })
      .catch(console.error);
  }, []);

  // Auto-calculate overall score based on ratings
  useEffect(() => {
    const { communication, teamwork, problemsolving, leadership } = form.ratings;
    const average = (communication + teamwork + problemsolving + leadership) / 4;
    const roundedAverage = Math.round(average * 10) / 10; // Round to 1 decimal place
    setForm(prev => ({ ...prev, overall: roundedAverage }));
  }, [form.ratings]);

  function handleArrayChange(field, index, value) {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  }

  function addField(field) {
    setForm({ ...form, [field]: [...form[field], ""] });
  }

  function removeField(field, index) {
    const updated = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: updated });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Get employee name from the selected employee
      const selectedEmployee = employees.find(emp => emp._id === form.employeeId);
      const employeeName = selectedEmployee ? 
        (selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim()) : '';
      
      const formData = {
        ...form,
        employeeName
      };
      
      const res = await fetch("/api/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create review");
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/performance");
      }, 2000);
    } catch (err) {
      console.error(err);
      setSuccessMessage("❌ Error creating review. Please try again.");
      setShowSuccessMessage(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      {showSuccessMessage && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccessMessage(false)} 
        />
      )}
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
      
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="text-primary mb-1">
                  📊 Create Performance Review
                </h1>
                <small className="text-muted">Evaluate employee performance and set goals</small>
              </div>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => router.back()}
              >
                ← Back
              </button>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">📄 Performance Review Form</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Employee Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      👤 Employee <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      value={form.employeeId}
                      onChange={(e) =>
                        setForm({ ...form, employeeId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Employee to Review</option>
                      {employees.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name || `${e.firstName} ${e.lastName}` || e.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Review Details */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        📅 Review Period <span className="text-danger">*</span>
                      </label>
                      <input
                        type="month"
                        className="form-control form-control-lg"
                        value={form.reviewPeriod}
                        onChange={(e) =>
                          setForm({ ...form, reviewPeriod: e.target.value })
                        }
                        required
                      />
                      <small className="text-muted">Select the month and year for this review</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        👨💼 Reviewer
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light"
                        value={form.reviewer}
                        readOnly
                        placeholder="Loading..."
                      />
                      <small className="text-muted">Automatically set as current user</small>
                    </div>
                  </div>
                  {/* Goals Section */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      🎯 Goals & Objectives
                    </label>
                    <div className="border rounded p-3 bg-light">
                      {form.goals.map((g, i) => (
                        <div key={i} className="d-flex mb-2">
                          <input
                            type="text"
                            className="form-control"
                            value={g}
                            onChange={(e) =>
                              handleArrayChange("goals", i, e.target.value)
                            }
                            placeholder={`Goal ${i + 1}`}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-danger ms-2"
                            onClick={() => removeField("goals", i)}
                            title="Remove Goal"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => addField("goals")}
                      >
                        ➕ Add Goal
                      </button>
                    </div>
                  </div>
                  {/* Achievements Section */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      🏆 Achievements & Accomplishments
                    </label>
                    <div className="border rounded p-3 bg-light">
                      {form.achievements.map((a, i) => (
                        <div key={i} className="d-flex mb-2">
                          <input
                            type="text"
                            className="form-control"
                            value={a}
                            onChange={(e) =>
                              handleArrayChange("achievements", i, e.target.value)
                            }
                            placeholder={`Achievement ${i + 1}`}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-danger ms-2"
                            onClick={() => removeField("achievements", i)}
                            title="Remove Achievement"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => addField("achievements")}
                      >
                        ➕ Add Achievement
                      </button>
                    </div>
                  </div>
                  {/* Ratings Section */}
                  <div className="mb-4">
                    <h5 className="text-primary mb-3">
                      ⭐ Performance Ratings (1-5 Scale)
                    </h5>
                    <div className="border rounded p-3 bg-light">
                      <div className="row">
                        {Object.keys(form.ratings).map((key) => (
                          <div key={key} className="col-md-6 mb-3">
                            <label className="form-label fw-semibold text-capitalize">
                              {key === 'communication' && '💬 '}
                              {key === 'teamwork' && '🤝 '}
                              {key === 'problemsolving' && '🧠 '}
                              {key === 'leadership' && '👑 '}
                              {key.replace(/([A-Z])/g, " $1")}
                            </label>
                            <div className="d-flex align-items-center">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                className="form-range me-3"
                                value={form.ratings[key]}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ratings: {
                                      ...form.ratings,
                                      [key]: Number(e.target.value),
                                    },
                                  })
                                }
                              />
                              <span className="badge bg-primary fs-6">
                                {form.ratings[key]}/5
                              </span>
                            </div>
                            <div className="text-muted small">
                              {'⭐'.repeat(form.ratings[key])}
                              {'☆'.repeat(5 - form.ratings[key])}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Overall Score */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      🏅 Overall Performance Score (Auto-calculated)
                    </label>
                    <div className="border rounded p-3 bg-success bg-opacity-10">
                      <div className="d-flex align-items-center justify-content-center">
                        <span className="badge bg-success fs-4 me-3">
                          {form.overall}/5
                        </span>
                        <div className="text-center">
                          <div style={{fontSize: '1.5rem'}}>
                            {'⭐'.repeat(Math.floor(form.overall))}
                            {form.overall % 1 !== 0 && '⭐'}
                            {'☆'.repeat(5 - Math.ceil(form.overall))}
                          </div>
                          <small className="text-muted">Average of all ratings</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      📝 Additional Comments & Feedback
                    </label>
                    <textarea
                      className="form-control form-control-lg"
                      rows="4"
                      value={form.comments}
                      onChange={(e) =>
                        setForm({ ...form, comments: e.target.value })
                      }
                      placeholder="Provide detailed feedback, suggestions for improvement, or recognition..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-success btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Review...
                        </>
                      ) : (
                        <>
                          💾 Save Performance Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
