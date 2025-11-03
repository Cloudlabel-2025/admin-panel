"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function CreateSkill() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    skillName: "",
    category: "General",
    description: "",
    proficiencyLevel: "Beginner",
  });

  const levelOptions = [
    { value: "Beginner", icon: "bi-1-circle", color: "info" },
    { value: "Intermediate", icon: "bi-2-circle", color: "warning" },
    { value: "Advanced", icon: "bi-3-circle", color: "success" },
    { value: "Expert", icon: "bi-trophy", color: "primary" }
  ];

  const categoryOptions = [
    { value: "Technical", icon: "bi-laptop" },
    { value: "Communication", icon: "bi-chat-dots" },
    { value: "Leadership", icon: "bi-award" },
    { value: "Creative", icon: "bi-palette" },
    { value: "Analytical", icon: "bi-graph-up" },
    { value: "General", icon: "bi-list-ul" }
  ];

  useEffect(() => {
    fetch("/api/Employee")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userRes = await fetch("/api/User");
      if (!userRes.ok) {
        setError("Failed to fetch users");
        setLoading(false);
        return;
      }
      const users = await userRes.json();
      let user = Array.isArray(users) ? users.find(u => u.employeeId === form.employeeId) : null;
      
      if (!user) {
        const employee = employees.find(emp => emp.employeeId === form.employeeId);
        if (!employee) {
          setError("Employee not found");
          setLoading(false);
          return;
        }
        
        const createUserRes = await fetch("/api/User", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: employee.email,
            password: "TempPass@123"
          })
        });
        
        if (!createUserRes.ok) {
          const errorData = await createUserRes.json().catch(() => ({ error: "Failed to create user account" }));
          setError(errorData.error || "Failed to create user account");
          setLoading(false);
          return;
        }
        
        const userData = await createUserRes.json();
        user = userData.user;
      }

      const payload = {
        employeeId: user._id,
        skillName: form.skillName,
        category: form.category,
        description: form.description,
        proficiencyLevels: [form.proficiencyLevel],
        proficiencyHistory: [{ level: form.proficiencyLevel, date: new Date() }]
      };

      const currentUserId = localStorage.getItem("userId");
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": currentUserId
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create skill");
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/skills");
      }, 2000);
    } catch (err) {
      console.error("Error creating skill:", err);
      setError("Failed to create skill. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
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
                      <i className="bi bi-trophy-fill me-2"></i>Add New Skill
                    </h1>
                    <small style={{ color: '#f4e5c3' }}>Create a new skill record for an employee</small>
                  </div>
                  <button 
                    className="btn"
                    onClick={() => router.push('/skills')}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4">
                <span className="me-2">⚠️</span>
                {error}
              </div>
            )}

            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-info-circle-fill me-2"></i>Skill Information</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    {/* Employee Selection */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold"><i className="bi bi-person-fill me-2"></i>Employee <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={form.employeeId}
                        onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        required
                        style={{maxHeight: '200px', overflowY: 'auto'}}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp.employeeId}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Skill Name */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold"><i className="bi bi-star-fill me-2"></i>Skill Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.skillName}
                        onChange={(e) => setForm({ ...form, skillName: e.target.value })}
                        placeholder="e.g., JavaScript, Leadership, Data Analysis"
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    {/* Category */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold"><i className="bi bi-folder-fill me-2"></i>Category</label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Proficiency Level */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold"><i className="bi bi-bar-chart-fill me-2"></i>Proficiency Level</label>
                      <select
                        className="form-select"
                        value={form.proficiencyLevel}
                        onChange={(e) => setForm({ ...form, proficiencyLevel: e.target.value })}
                      >
                        {levelOptions.map((lvl) => (
                          <option key={lvl.value} value={lvl.value}>
                            {lvl.value}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2">
                        <span className={`badge bg-${levelOptions.find(l => l.value === form.proficiencyLevel)?.color || 'secondary'}`}>
                          <i className={`${levelOptions.find(l => l.value === form.proficiencyLevel)?.icon} me-1`}></i>{form.proficiencyLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-pencil-fill me-2"></i>Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe the skill, experience level, or specific expertise..."
                    />
                    <small className="text-muted">Optional: Provide additional details about this skill</small>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 justify-content-end">
                    <button 
                      type="button" 
                      className="btn"
                      onClick={() => router.push('/skills')}
                      disabled={loading}
                      style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent' }}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn px-4"
                      disabled={loading}
                      style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>Save Skill
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
