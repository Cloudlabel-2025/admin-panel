"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function EditPerformance() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    employeeName: "",
    reviewPeriodFrom: "",
    reviewPeriodTo: "",
    goals: [],
    achievements: [],
    ratings: {}
  });
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setTodayDate(today.toISOString().split('T')[0]);

    fetch(`/api/performance/${id}`)
      .then((r) => r.json())
      .then((data) => {
        // Parse reviewPeriod "YYYY-MM-DD to YYYY-MM-DD" format
        let reviewPeriodFrom = "";
        let reviewPeriodTo = "";
        if (data.reviewPeriod && data.reviewPeriod.includes(" to ")) {
          const [from, to] = data.reviewPeriod.split(" to ");
          reviewPeriodFrom = from;
          reviewPeriodTo = to;
        }
        
        setForm({
          ...data,
          reviewPeriodFrom,
          reviewPeriodTo,
          goals: data.goals || [],
          achievements: data.achievements || [],
          ratings: data.ratings || {}
        });
      });
  }, [id]);

  // Auto-calculate overall score
  useEffect(() => {
    if (form.ratings && Object.keys(form.ratings).length > 0) {
      const { communication, teamwork, problemsolving, leadership } = form.ratings;
      const average = (communication + teamwork + problemsolving + leadership) / 4;
      const roundedAverage = Math.round(average * 10) / 10;
      setForm(prev => ({ ...prev, overall: roundedAverage }));
    }
  }, [form.ratings]);

  if (!form.employeeName) return (
    <Layout>
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: '#d4af37' }} role="status"></div>
        <p className="mt-3" style={{ color: '#d4af37' }}>Loading...</p>
      </div>
    </Layout>
  );

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
    const validGoals = (form.goals || []).filter(g => g.trim() !== '');
    if (validGoals.length === 0) {
      alert('❌ Error: At least one goal is required');
      return;
    }
    
    // Validate achievements - at least one non-empty achievement required
    const validAchievements = (form.achievements || []).filter(a => a.trim() !== '');
    if (validAchievements.length === 0) {
      alert('❌ Error: At least one achievement is required');
      return;
    }
    
    // Validate comments - max 50 chars, max 10 numbers
    if (!form.comments || form.comments.trim().length === 0) {
      alert('❌ Error: Comments are required');
      return;
    }
    const numCount = (form.comments.match(/\d/g) || []).length;
    if (numCount > 10) {
      alert('❌ Error: Comments can contain maximum 10 numbers');
      return;
    }
    
    setLoading(true);
    try {
      const formData = {
        ...form,
        goals: validGoals,
        achievements: validAchievements,
        reviewPeriod: `${form.reviewPeriodFrom} to ${form.reviewPeriodTo}`
      };
      
      await fetch(`/api/performance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/performance");
      }, 2000);
    } catch (err) {
      console.error(err);
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
                      <i className="bi bi-pencil-square me-2"></i>Edit Performance Review
                    </h1>
                    <small style={{ color: '#f4e5c3' }}>Update performance review for {form.employeeName}</small>
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
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-file-earmark-text me-2"></i>Review Details</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Employee Name - Read Only */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-person-fill me-2"></i>Employee</label>
                    <input
                      type="text"
                      className="form-control form-control-lg bg-light"
                      value={form.employeeName}
                      readOnly
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>
                  {/* Review Details */}
                  <div className="row mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold"><i className="bi bi-calendar-range me-2"></i>From <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={form.reviewPeriodFrom}
                        max={todayDate}
                        onChange={(e) => setForm({ ...form, reviewPeriodFrom: e.target.value })}
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
                        min={form.reviewPeriodFrom}
                        max={todayDate}
                        onChange={(e) => setForm({ ...form, reviewPeriodTo: e.target.value })}
                        required
                      />
                      <small className="text-muted">End date</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold"><i className="bi bi-person-badge me-2"></i>Reviewer</label>
                      <input
                        type="text"
                        className="form-control form-control-lg bg-light"
                        value={form.reviewer || ''}
                        readOnly
                        placeholder="Reviewer name"
                      />
                      <small className="text-muted">Original reviewer</small>
                    </div>
                  </div>
                  {/* Goals Section */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-bullseye me-2"></i>Goals & Objectives <span className="text-danger">*</span></label>
                    <small className="text-muted d-block mb-2">Max 30 characters, text only</small>
                    <div className="border rounded p-3 bg-light">
                      {(form.goals || []).map((g, i) => (
                        <div key={i} className="d-flex mb-2">
                          <input
                            type="text"
                            className="form-control"
                            value={g}
                            onChange={(e) => handleArrayChange("goals", i, e.target.value)}
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
                      {(form.achievements || []).map((a, i) => (
                        <div key={i} className="d-flex mb-2">
                          <input
                            type="text"
                            className="form-control"
                            value={a}
                            onChange={(e) => handleArrayChange("achievements", i, e.target.value)}
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
                        {Object.keys(form.ratings || {}).map((key) => (
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
                      value={form.comments || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 50);
                        setForm({ ...form, comments: val });
                      }}
                      placeholder="Provide detailed feedback, suggestions for improvement, or recognition..."
                      required
                      maxLength={50}
                    />
                    <small className="text-muted">Max 50 characters, max 10 numbers allowed ({(form.comments || '').length}/50 chars, {((form.comments || '').match(/\d/g) || []).length}/10 numbers)</small>
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
                          Updating Review...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>Update Performance Review
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
