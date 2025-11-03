"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function UpdateSkillProficiency() {
  const router = useRouter();
  const params = useParams();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newLevel, setNewLevel] = useState("");

  const levelOptions = [
    { value: "Beginner", color: "#6c757d", icon: "bi-star" },
    { value: "Intermediate", color: "#0dcaf0", icon: "bi-star-half" },
    { value: "Advanced", color: "#198754", icon: "bi-stars" },
    { value: "Expert", color: "#d4af37", icon: "bi-trophy-fill" }
  ];

  useEffect(() => {
    if (params.id) {
      fetch(`/api/skills/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          setSkill(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching skill:", err);
          setError("Failed to load skill");
          setLoading(false);
        });
    }
  }, [params.id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newLevel) {
      setError("Please select a proficiency level");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updatedLevels = [...(skill.proficiencyLevels || []), newLevel];
      const updatedHistory = [...(skill.proficiencyHistory || []), { level: newLevel, date: new Date() }];
      
      const res = await fetch(`/api/skills/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proficiencyLevels: updatedLevels,
          proficiencyHistory: updatedHistory
        }),
      });

      if (!res.ok) throw new Error("Failed to update skill");

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/skills");
      }, 2000);
    } catch (err) {
      console.error("Error updating skill:", err);
      setError("Failed to update skill proficiency");
    } finally {
      setSubmitting(false);
    }
  }

  const getCurrentLevel = () => {
    if (skill?.proficiencyHistory?.length > 0) {
      return skill.proficiencyHistory[skill.proficiencyHistory.length - 1].level;
    }
    if (skill?.proficiencyLevels?.length > 0) {
      return skill.proficiencyLevels[skill.proficiencyLevels.length - 1];
    }
    return "N/A";
  };

  const getLevelStyle = (level) => {
    const option = levelOptions.find(opt => opt.value === level);
    return option || { color: "#6c757d", icon: "bi-star" };
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="spinner-border" style={{ color: '#d4af37', width: '3rem', height: '3rem' }}></div>
        </div>
      </Layout>
    );
  }

  if (!skill) {
    return (
      <Layout>
        <div className="alert alert-danger">Skill not found</div>
      </Layout>
    );
  }

  const currentLevel = getCurrentLevel();
  const currentLevelStyle = getLevelStyle(currentLevel);
  const isExpertLevel = currentLevel === "Expert";

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
          <div className="col-lg-10">
            <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                      <i className="bi bi-graph-up-arrow me-2"></i>Update Skill Proficiency
                    </h1>
                    <small style={{ color: '#f4e5c3' }}>Upgrade proficiency level and track skill progression</small>
                  </div>
                  <button className="btn" onClick={() => router.push('/skills')} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                    <i className="bi bi-arrow-left me-2"></i>Back
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {isExpertLevel && (
              <div className="alert d-flex align-items-center mb-4" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: '2px solid #d4af37', color: '#1a1a1a' }}>
                <i className="bi bi-trophy-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                <div>
                  <strong>Maximum Level Achieved!</strong>
                  <p className="mb-0 small">This skill has reached Expert level - the highest proficiency. No further updates are needed.</p>
                </div>
              </div>
            )}

            <div className="row g-4 mb-4">
              <div className="col-lg-7">
                <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
                  <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
                    <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-info-circle-fill me-2"></i>Current Skill Information</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="mb-4">
                      <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                        <i className="bi bi-person-fill me-2" style={{ color: '#d4af37' }}></i>Employee
                      </label>
                      <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6' }}>
                        <h6 className="mb-0 fw-bold">{skill.employeeId?.name || "N/A"}</h6>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                        <i className="bi bi-star-fill me-2" style={{ color: '#d4af37' }}></i>Skill Name
                      </label>
                      <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6' }}>
                        <h6 className="mb-0 fw-bold">{skill.skillName}</h6>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                        <i className="bi bi-folder-fill me-2" style={{ color: '#d4af37' }}></i>Category
                      </label>
                      <div>
                        <span className="badge px-3 py-2" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a', fontSize: '0.95rem', fontWeight: '600' }}>
                          {skill.category || "Uncategorized"}
                        </span>
                      </div>
                    </div>

                    <div className="mb-0">
                      <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                        <i className={currentLevelStyle.icon + " me-2"} style={{ color: currentLevelStyle.color }}></i>Current Level
                      </label>
                      <div className="p-3 rounded d-flex align-items-center gap-3" style={{ background: `linear-gradient(135deg, ${currentLevelStyle.color}15 0%, ${currentLevelStyle.color}05 100%)`, border: `2px solid ${currentLevelStyle.color}` }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', background: currentLevelStyle.color }}>
                          <i className={currentLevelStyle.icon} style={{ fontSize: '1.3rem', color: '#fff' }}></i>
                        </div>
                        <div>
                          <h5 className="mb-0 fw-bold" style={{ color: currentLevelStyle.color }}>{currentLevel}</h5>
                          <small className="text-muted">Active proficiency level</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card shadow-sm h-100" style={{ border: isExpertLevel ? '2px solid #d4af37' : '2px solid #0dcaf0', borderRadius: '12px', opacity: isExpertLevel ? 1 : 1, position: 'relative', zIndex: 1 }}>
                  <div className="card-header" style={{ background: isExpertLevel ? 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)' : 'linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%)', borderRadius: '10px 10px 0 0' }}>
                    <h5 className="mb-0 text-white"><i className={isExpertLevel ? "bi bi-lock-fill me-2" : "bi bi-plus-circle-fill me-2"}></i>{isExpertLevel ? "Update Locked" : "Add New Level"}</h5>
                  </div>
                  <div className="card-body p-4">
                    {isExpertLevel ? (
                      <div className="text-center py-4">
                        <div className="mb-3" style={{ animation: 'pulse 2s infinite' }}>
                          <i className="bi bi-trophy-fill" style={{ fontSize: '4rem', color: '#d4af37' }}></i>
                        </div>
                        <h5 className="mt-3 mb-2 fw-bold" style={{ color: '#d4af37' }}>Expert Level Reached!</h5>
                        <p className="text-muted mb-4">This skill has achieved the maximum proficiency level. Congratulations!</p>
                        <button
                          type="button"
                          className="btn btn-lg w-100"
                          onClick={() => router.push('/skills')}
                          style={{ background: '#000000', border: '3px solid #d4af37', color: '#d4af37', fontWeight: '700', fontSize: '1.1rem', padding: '12px', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)', position: 'relative', zIndex: 10 }}
                        >
                          <i className="bi bi-arrow-left-circle-fill me-2"></i>Back to Skills
                        </button>
                      </div>
                    ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="form-label fw-semibold d-flex align-items-center">
                          <i className="bi bi-bar-chart-fill me-2" style={{ color: '#0dcaf0' }}></i>
                          Select New Proficiency Level <span className="text-danger ms-1">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          value={newLevel}
                          onChange={(e) => setNewLevel(e.target.value)}
                          required
                          style={{ borderColor: '#0dcaf0', borderWidth: '2px' }}
                        >
                          <option value="">Choose level...</option>
                          {levelOptions.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.value}
                            </option>
                          ))}
                        </select>
                        {newLevel && (
                          <div className="mt-3 p-3 rounded" style={{ background: `linear-gradient(135deg, ${getLevelStyle(newLevel).color}15 0%, ${getLevelStyle(newLevel).color}05 100%)`, border: `2px solid ${getLevelStyle(newLevel).color}` }}>
                            <div className="d-flex align-items-center gap-2">
                              <i className={getLevelStyle(newLevel).icon} style={{ fontSize: '1.5rem', color: getLevelStyle(newLevel).color }}></i>
                              <div>
                                <div className="fw-bold" style={{ color: getLevelStyle(newLevel).color }}>{newLevel}</div>
                                <small className="text-muted">Selected level</small>
                              </div>
                            </div>
                          </div>
                        )}
                        <small className="text-muted mt-2 d-block">
                          <i className="bi bi-info-circle me-1"></i>
                          This will be added to proficiency history
                        </small>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        <button
                          type="submit"
                          className="btn btn-lg w-100"
                          disabled={submitting}
                          style={{ background: 'linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%)', border: 'none', color: '#fff', fontWeight: '600' }}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-arrow-up-circle-fill me-2"></i>Update Proficiency
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-lg w-100"
                          onClick={() => router.push('/skills')}
                          disabled={submitting}
                          style={{ border: '2px solid #6c757d', color: '#6c757d', background: 'transparent' }}
                        >
                          <i className="bi bi-x-circle me-2"></i>Cancel
                        </button>
                      </div>
                    </form>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(skill.proficiencyHistory?.length > 0 || skill.proficiencyLevels?.length > 0) && (
              <div className="card shadow-sm" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
                <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
                  <h5 className="mb-0" style={{ color: '#d4af37' }}>
                    <i className="bi bi-clock-history me-2"></i>Proficiency History
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap gap-2">
                    {(skill.proficiencyHistory || skill.proficiencyLevels || []).map((entry, idx) => {
                      const level = entry.level || entry;
                      const levelStyle = getLevelStyle(level);
                      const isLatest = idx === (skill.proficiencyHistory?.length || skill.proficiencyLevels?.length) - 1;
                      return (
                        <div key={idx} className="badge px-3 py-2 d-flex align-items-center gap-2" style={{ background: isLatest ? `linear-gradient(135deg, ${levelStyle.color} 0%, ${levelStyle.color}dd 100%)` : '#e9ecef', color: isLatest ? '#fff' : '#495057', fontSize: '0.9rem', border: isLatest ? 'none' : '1px solid #dee2e6' }}>
                          <span className="badge rounded-circle" style={{ background: isLatest ? 'rgba(255,255,255,0.3)' : levelStyle.color, color: '#fff', width: '24px', height: '24px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                            {idx + 1}
                          </span>
                          <i className={levelStyle.icon}></i>
                          <span className="fw-semibold">{level}</span>
                          {isLatest && <i className="bi bi-check-circle-fill ms-1"></i>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
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
