"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function MySkillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchSkillDetail();
    }
  }, [params.id]);

  const fetchSkillDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/skills/${params.id}`);
      const data = await res.json();
      setSkill(data);
      if (data.selfEvaluation) {
        setRating(data.selfEvaluation.rating || 0);
        setComments(data.selfEvaluation.comments || "");
      }
    } catch (err) {
      console.error("Error fetching skill:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfEvaluation = async (e) => {
    e.preventDefault();
    if (skill?.verifiedEvaluation) {
      alert("This skill has been verified by admin. You cannot update your evaluation until the proficiency level is updated.");
      return;
    }
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/skills/${params.id}/self-evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comments }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        fetchSkillDetail();
      }
    } catch (err) {
      console.error("Error saving evaluation:", err);
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLevel = () => {
    if (!skill?.proficiencyHistory || skill.proficiencyHistory.length === 0) {
      return skill?.proficiencyLevels?.[0] || "Beginner";
    }
    return skill.proficiencyHistory[skill.proficiencyHistory.length - 1].level;
  };

  const getLevelColor = (level) => {
    const l = level?.toLowerCase() || "";
    if (l.includes("expert")) return "#28a745";
    if (l.includes("advanced")) return "#17a2b8";
    if (l.includes("intermediate")) return "#ffc107";
    return "#6c757d";
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Loading skill details...</p>
        </div>
      </Layout>
    );
  }

  if (!skill) {
    return (
      <Layout>
        <div className="container py-5 text-center">
          <h3>Skill not found</h3>
          <button className="btn btn-primary mt-3" onClick={() => router.push("/my-skills")}>
            Back to My Skills
          </button>
        </div>
      </Layout>
    );
  }

  const currentLevel = getCurrentLevel();

  return (
    <Layout>
      {success && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, background: 'rgba(0,0,0,0.9)', padding: '40px', borderRadius: '15px', animation: 'fadeIn 0.3s' }}>
          <div style={{ textAlign: 'center', color: '#d4af37' }}>
            <div style={{ fontSize: '60px', marginBottom: '20px', animation: 'pulse-in-out 1s' }}>✓</div>
            <h3 style={{ color: '#d4af37' }}>Evaluation Saved!</h3>
          </div>
        </div>
      )}

      <div className="container py-4">
        <button className="btn mb-4" onClick={() => router.push("/my-skills")} style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent' }}>
          <i className="bi bi-arrow-left me-2"></i>Back to My Skills
        </button>

        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h2 className="mb-2" style={{ color: '#d4af37' }}>
                      <i className="bi bi-trophy-fill me-2"></i>{skill.skillName}
                    </h2>
                    <span className="badge" style={{ background: '#2d2d2d', color: '#f4e5c3', border: '1px solid #d4af37' }}>
                      <i className="bi bi-folder-fill me-1"></i>{skill.category}
                    </span>
                  </div>
                  <div className="text-end">
                    <div className="badge fs-5 px-3 py-2" style={{ background: getLevelColor(currentLevel), color: 'white' }}>
                      <i className="bi bi-bar-chart-fill me-2"></i>{currentLevel}
                    </div>
                  </div>
                </div>

                {skill.description && (
                  <div className="mt-3 p-3" style={{ background: '#2d2d2d', borderRadius: '8px', border: '1px solid #444' }}>
                    <small style={{ color: '#f4e5c3' }}><i className="bi bi-info-circle me-2"></i>{skill.description}</small>
                  </div>
                )}

                <div className="mt-4">
                  <h5 style={{ color: '#d4af37' }}><i className="bi bi-graph-up me-2"></i>Proficiency Progression</h5>
                  {skill.proficiencyHistory && skill.proficiencyHistory.length > 0 ? (
                    <div className="mt-3">
                      {skill.proficiencyHistory.map((history, idx) => (
                        <div key={idx} className="d-flex align-items-center mb-3">
                          <div className="me-3" style={{ width: '120px', textAlign: 'right' }}>
                            <small style={{ color: '#f4e5c3' }}>{new Date(history.date).toLocaleDateString()}</small>
                          </div>
                          <div style={{ width: '4px', height: '40px', background: getLevelColor(history.level), borderRadius: '2px' }}></div>
                          <div className="ms-3">
                            <span className="badge" style={{ background: getLevelColor(history.level), color: 'white' }}>
                              {history.level}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#999' }}>No progression history available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}>
                  <i className="bi bi-star-fill me-2"></i>Self Evaluation
                </h5>
              </div>
              <div className="card-body p-4">
                {skill.verifiedEvaluation ? (
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <i className="bi bi-lock-fill" style={{ fontSize: '3rem', color: '#28a745' }}></i>
                    </div>
                    <h5 style={{ color: '#28a745' }}>Evaluation Verified</h5>
                    <p className="text-muted mb-3">Your skill has been verified by admin with a rating of:</p>
                    <div className="d-flex gap-2 justify-content-center mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`bi bi-star${skill.verifiedEvaluation.rating >= star ? '-fill' : ''}`} style={{ fontSize: '2rem', color: '#28a745' }}></i>
                      ))}
                    </div>
                    <div className="badge bg-success fs-6 mb-3">{skill.verifiedEvaluation.rating}/5 Stars</div>
                    {skill.verifiedEvaluation.feedback && (
                      <div className="alert alert-success mt-3">
                        <strong>Admin Feedback:</strong>
                        <p className="mb-0 mt-2">{skill.verifiedEvaluation.feedback}</p>
                      </div>
                    )}
                    <small className="text-muted d-block mt-3">
                      <i className="bi bi-info-circle me-1"></i>
                      You can submit a new evaluation after your proficiency level is updated
                    </small>
                  </div>
                ) : (
                  <form onSubmit={handleSelfEvaluation}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Rate Your Proficiency</label>
                      <div className="d-flex gap-2 justify-content-center my-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`bi bi-star${rating >= star ? '-fill' : ''}`}
                            onClick={() => setRating(star)}
                            style={{ fontSize: '2rem', cursor: 'pointer', color: rating >= star ? '#d4af37' : '#ccc', transition: 'all 0.2s' }}
                          ></i>
                        ))}
                      </div>
                    <div className="text-center">
                      <small className="text-muted">
                        {rating === 0 && "Click to rate"}
                        {rating === 1 && "Beginner"}
                        {rating === 2 && "Basic"}
                        {rating === 3 && "Intermediate"}
                        {rating === 4 && "Advanced"}
                        {rating === 5 && "Expert"}
                      </small>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Comments</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Share your thoughts about your skill level, areas of strength, or areas for improvement..."
                    />
                  </div>

                  {skill.selfEvaluation?.lastUpdated && (
                    <div className="alert alert-info py-2 px-3 mb-3">
                      <small>
                        <i className="bi bi-clock me-2"></i>
                        Last updated: {new Date(skill.selfEvaluation.lastUpdated).toLocaleString()}
                      </small>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn w-100"
                    disabled={saving}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>Save Evaluation
                      </>
                    )}
                  </button>
                </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes pulse-in-out {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </Layout>
  );
}
