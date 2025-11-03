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
    reviewPeriodFrom: "",
    reviewPeriodTo: "",
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
  const [minDate, setMinDate] = useState("");
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    const userDepartment = localStorage.getItem("userDepartment");
    
    // Set today's date as max for 'To' field
    const today = new Date();
    setTodayDate(today.toISOString().split('T')[0]);
    
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
    if (field === 'goals') {
      // Goals: max 30 chars, text only
      updated[index] = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
    } else if (field === 'achievements') {
      // Achievements: max 30 chars, text, numbers, /, - only
      updated[index] = value.replace(/[^a-zA-Z0-9\s\/-]/g, '').slice(0, 30);
    } else {
      updated[index] = value;
    }
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
    
    // Validate goals - at least one non-empty goal required
    const validGoals = form.goals.filter(g => g.trim() !== '');
    if (validGoals.length === 0) {
      setSuccessMessage('❌ Error: At least one goal is required');
      setShowSuccessMessage(true);
      return;
    }
    
    // Validate achievements - at least one non-empty achievement required
    const validAchievements = form.achievements.filter(a => a.trim() !== '');
    if (validAchievements.length === 0) {
      setSuccessMessage('❌ Error: At least one achievement is required');
      setShowSuccessMessage(true);
      return;
    }
    
    // Validate comments - max 50 chars, max 10 numbers
    if (!form.comments || form.comments.trim().length === 0) {
      setSuccessMessage('❌ Error: Comments are required');
      setShowSuccessMessage(true);
      return;
    }
    const numCount = (form.comments.match(/\d/g) || []).length;
    if (numCount > 10) {
      setSuccessMessage('❌ Error: Comments can contain maximum 10 numbers');
      setShowSuccessMessage(true);
      return;
    }
    
    setLoading(true);
    try {
      // Get employee name from the selected employee
      const selectedEmployee = employees.find(emp => emp._id === form.employeeId);
      const employeeName = selectedEmployee ? 
        (selectedEmployee.name || `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim()) : '';
      
      const formData = {
        ...form,
        goals: validGoals,
        achievements: validAchievements,
        employeeName,
        reviewPeriod: `${form.reviewPeriodFrom} to ${form.reviewPeriodTo}`
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
      const errorData = await err.response?.json?.() || {};
      setSuccessMessage(`❌ Error: ${errorData.error || err.message || 'Failed to create review'}`);
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
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                      <i className="bi bi-graph-up-arrow me-2"></i>Create Performance Review
                    </h1>
                    <small style={{ color: '#f4e5c3' }}>Evaluate employee performance and set goals</small>
                  </div>
                  <button 
                    type="button" 
                    className="btn"
                    onClick={() => router.back()}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>Back
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-file-earmark-text me-2"></i>Performance Review Form</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Employee Selection */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-person-fill me-2"></i>Employee <span className="text-danger">*</span></label>
                    <select
                      className="form-select form-select-lg"
                      value={form.employeeId}
                      onChange={(e) => {
                        const selectedEmp = employees.find(emp => emp._id === e.target.value);
                        if (selectedEmp?.joiningDate) {
                          const joiningDate = new Date(selectedEmp.joiningDate);
                          const minDateStr = joiningDate.toISOString().split('T')[0];
                          setMinDate(minDateStr);
                          setForm({ ...form, employeeId: e.target.value, reviewPeriodFrom: minDateStr, reviewPeriodTo: "" });
                        } else {
                          setMinDate("");
                          setForm({ ...form, employeeId: e.target.value });
                        }
                      }}
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
                    <div className="col-md-4">
                      <label className="form-label fw-semibold"><i className="bi bi-calendar-range me-2"></i>From <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={form.reviewPeriodFrom}
                        min={minDate}
                        max={todayDate}
                        onChange={(e) =>
                          setForm({ ...form, reviewPeriodFrom: e.target.value })
                        }
                        required
                      />
                      <small className="text-muted">Start date</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold"><i className="bi bi-calendar-range me-2"></i>To <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={form.reviewPeriodTo}
                        min={form.reviewPeriodFrom || minDate}
                        max={todayDate}
                        onChange={(e) =>
                          setForm({ ...form, reviewPeriodTo: e.target.value })
                        }
                        required
                      />
                      <small className="text-muted">End date</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold"><i className="bi bi-person-badge me-2"></i>Reviewer</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light"
                        value={form.reviewer}
                        readOnly
                        placeholder="Loading..."
                      />
                      <small className="text-muted">Current user</small>
                    </div>
                  </div>
                  {/* Goals Section */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-bullseye me-2"></i>Goals & Objectives <span className="text-danger">*</span></label>
                    <small className="text-muted d-block mb-2">Max 30 characters, text only</small>
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
                            maxLength={30}
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
                    <label className="form-label fw-semibold"><i className="bi bi-trophy me-2"></i>Achievements & Accomplishments <span className="text-danger">*</span></label>
                    <small className="text-muted d-block mb-2">Max 30 characters, text/numbers//-only</small>
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
                            maxLength={30}
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
                    <h5 className="mb-3" style={{ color: '#d4af37' }}>
                      <i className="bi bi-star-fill me-2"></i>Performance Ratings (1-5 Scale)
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
                    <label className="form-label fw-semibold"><i className="bi bi-award me-2"></i>Overall Performance Score (Auto-calculated)</label>
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
                    <label className="form-label fw-semibold"><i className="bi bi-chat-left-text me-2"></i>Additional Comments & Feedback <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control form-control-lg"
                      rows="4"
                      value={form.comments}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 50);
                        setForm({ ...form, comments: val });
                      }}
                      placeholder="Provide detailed feedback, suggestions for improvement, or recognition..."
                      required
                      maxLength={50}
                    />
                    <small className="text-muted">Max 50 characters, max 10 numbers allowed ({form.comments.length}/50 chars, {(form.comments.match(/\d/g) || []).length}/10 numbers)</small>
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-lg"
                      disabled={loading}
                      style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating Review...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>Save Performance Review
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
