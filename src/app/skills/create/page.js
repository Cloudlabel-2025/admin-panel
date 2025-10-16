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
    { value: "Beginner", icon: "🌱", color: "info" },
    { value: "Intermediate", icon: "🌿", color: "warning" },
    { value: "Advanced", icon: "🌳", color: "success" },
    { value: "Expert", icon: "🏆", color: "primary" }
  ];

  const categoryOptions = [
    { value: "Technical", icon: "💻" },
    { value: "Communication", icon: "💬" },
    { value: "Leadership", icon: "👑" },
    { value: "Creative", icon: "🎨" },
    { value: "Analytical", icon: "📊" },
    { value: "General", icon: "📋" }
  ];

  useEffect(() => {
    fetch("/api/User")
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
      const payload = {
        employeeId: form.employeeId,
        skillName: form.skillName,
        category: form.category,
        description: form.description,
        proficiencyLevels: [form.proficiencyLevel], 
      };

      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                  🎯 Add New Skill
                </h1>
                <small className="text-muted">Create a new skill record for an employee</small>
              </div>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => router.push('/skills')}
              >
                ← Back to Skills
              </button>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4">
                <span className="me-2">⚠️</span>
                {error}
              </div>
            )}

            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">🎯 Skill Information</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    {/* Employee Selection */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">👤 Employee <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={form.employeeId}
                        onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        required
                        style={{maxHeight: '200px', overflowY: 'auto'}}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Skill Name */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">🎯 Skill Name <span className="text-danger">*</span></label>
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
                      <label className="form-label fw-semibold">📂 Category</label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.value}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Proficiency Level */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">📊 Proficiency Level</label>
                      <select
                        className="form-select"
                        value={form.proficiencyLevel}
                        onChange={(e) => setForm({ ...form, proficiencyLevel: e.target.value })}
                      >
                        {levelOptions.map((lvl) => (
                          <option key={lvl.value} value={lvl.value}>
                            {lvl.icon} {lvl.value}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2">
                        <span className={`badge bg-${levelOptions.find(l => l.value === form.proficiencyLevel)?.color || 'secondary'}`}>
                          {levelOptions.find(l => l.value === form.proficiencyLevel)?.icon} {form.proficiencyLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">📝 Description</label>
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
                      className="btn btn-outline-secondary"
                      onClick={() => router.push('/skills')}
                      disabled={loading}
                    >
                      ❌ Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          💾 Save Skill
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
