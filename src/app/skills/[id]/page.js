"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import SuccessMessage from "../../components/SuccessMessage";

export default function ViewSkill() {
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyRating, setVerifyRating] = useState(0);
  const [verifyFeedback, setVerifyFeedback] = useState("");
  const [verifying, setVerifying] = useState(false);
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetch(`/api/skills/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Skill not found");
          return res.json();
        })
        .then((data) => {
          setSkill(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setSuccessMessage("Skill not found");
          setShowSuccess(true);
          setTimeout(() => router.push("/skills"), 2000);
        });
    }
  }, [params.id, router]);

  const getLevelStyle = (level) => {
    const styles = {
      'Beginner': { bg: '#6c757d', border: '#5a6268', icon: 'bi-star' },
      'Intermediate': { bg: '#0dcaf0', border: '#0aa2c0', icon: 'bi-star-half' },
      'Advanced': { bg: '#198754', border: '#146c43', icon: 'bi-stars' },
      'Expert': { bg: '#d4af37', border: '#b8941f', icon: 'bi-trophy-fill' }
    };
    return styles[level] || styles['Beginner'];
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/skills/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMessage('Skill deleted successfully');
      setShowSuccess(true);
      setTimeout(() => router.push('/skills'), 1500);
    } catch (err) {
      alert('Error deleting skill');
      setDeleting(false);
    }
  };

  const handleVerify = async () => {
    if (verifyRating === 0) {
      alert('Please select a rating');
      return;
    }
    setVerifying(true);
    try {
      const userId = localStorage.getItem('userId');
      const res = await fetch(`/api/skills/${params.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ rating: verifyRating, feedback: verifyFeedback }),
      });
      if (!res.ok) throw new Error('Failed to verify');
      setSuccessMessage('Evaluation verified successfully');
      setShowSuccess(true);
      setShowVerifyModal(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      alert('Error verifying evaluation');
    } finally {
      setVerifying(false);
    }
  };

  const openVerifyModal = () => {
    setVerifyRating(skill?.selfEvaluation?.rating || 0);
    setVerifyFeedback('');
    setShowVerifyModal(true);
  };

  const getCurrentLevel = () => {
    if (skill?.proficiencyHistory?.length > 0) {
      return skill.proficiencyHistory[skill.proficiencyHistory.length - 1].level;
    }
    if (skill?.proficiencyLevels?.length > 0) {
      return skill.proficiencyLevels[skill.proficiencyLevels.length - 1];
    }
    return 'N/A';
  };

  const getProgressionCount = () => {
    return skill?.proficiencyHistory?.length || skill?.proficiencyLevels?.length || 0;
  };

  const getDaysSinceCreation = () => {
    if (!skill?.createdAt) return 0;
    const created = new Date(skill.createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  };

  const getLevelProgress = (level) => {
    const levels = { 'Beginner': 25, 'Intermediate': 50, 'Advanced': 75, 'Expert': 100 };
    return levels[level] || 0;
  };

  const getProgressionStats = () => {
    const history = skill?.proficiencyHistory || [];
    if (history.length < 2) return null;
    const first = history[0];
    const last = history[history.length - 1];
    const daysBetween = Math.floor((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24));
    const avgDaysPerUpdate = history.length > 1 ? Math.floor(daysBetween / (history.length - 1)) : 0;
    return { totalDays: daysBetween, avgDaysPerUpdate, totalUpdates: history.length - 1 };
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

  if (!skill) return <Layout><p>Skill not found</p></Layout>;

  const currentLevel = getCurrentLevel();
  const currentLevelStyle = getLevelStyle(currentLevel);

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}

      {showVerifyModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: '2px solid #28a745' }}>
              <div className="modal-header" style={{ background: '#28a745', color: '#fff' }}>
                <h5 className="modal-title"><i className="bi bi-check-circle-fill me-2"></i>Verify Self Evaluation</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowVerifyModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Final Rating</label>
                  <div className="d-flex gap-2 justify-content-center my-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi bi-star${verifyRating >= star ? '-fill' : ''}`}
                        onClick={() => setVerifyRating(star)}
                        style={{ fontSize: '2.5rem', cursor: 'pointer', color: verifyRating >= star ? '#28a745' : '#ccc', transition: 'all 0.2s' }}
                      ></i>
                    ))}
                  </div>
                  <div className="text-center">
                    <small className="text-muted">Employee rated: {skill?.selfEvaluation?.rating}/5</small>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Feedback (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={verifyFeedback}
                    onChange={(e) => setVerifyFeedback(e.target.value)}
                    placeholder="Provide feedback about the rating adjustment..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)} disabled={verifying}>Cancel</button>
                <button className="btn btn-success" onClick={handleVerify} disabled={verifying}>
                  {verifying ? <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</> : <><i className="bi bi-check-circle me-2"></i>Verify</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: '2px solid #dc3545' }}>
              <div className="modal-header" style={{ background: '#dc3545', color: '#fff' }}>
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm Delete</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Are you sure you want to delete this skill? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <><span className="spinner-border spinner-border-sm me-2"></span>Deleting...</> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container py-4">
        {/* Header */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-trophy-fill me-2"></i>{skill.skillName}
                </h1>
                <small style={{ color: '#f4e5c3' }}>Comprehensive skill overview and progression tracking</small>
              </div>
              <div className="d-flex gap-2">
                <button className="btn" onClick={() => router.push(`/skills/${params.id}/update`)} style={{ background: 'linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%)', border: 'none', color: '#fff', fontWeight: '600' }}>
                  <i className="bi bi-graph-up-arrow me-2"></i>Update
                </button>
                <button className="btn" onClick={() => setShowDeleteModal(true)} style={{ background: 'linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%)', border: 'none', color: '#fff', fontWeight: '600' }}>
                  <i className="bi bi-trash-fill me-2"></i>Delete
                </button>
                <button className="btn" onClick={() => router.back()} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                  <i className="bi bi-arrow-left me-2"></i>Back
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: currentLevelStyle.bg }}>
                  <i className={currentLevelStyle.icon}></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Current Level</h6>
                <h4 className="mb-0 fw-bold" style={{ color: currentLevelStyle.bg }}>{currentLevel}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #0dcaf0', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#0dcaf0' }}>
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Updates</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#0dcaf0' }}>{getProgressionCount()}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #198754', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#198754' }}>
                  <i className="bi bi-calendar-check"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Days Active</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#198754' }}>{getDaysSinceCreation()}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #6c757d', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#6c757d' }}>
                  <i className="bi bi-folder-fill"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Category</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#6c757d', fontSize: '1.1rem' }}>{skill.category || 'N/A'}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column - Details */}
          <div className="col-lg-5">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-info-circle-fill me-2"></i>Skill Information</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-4">
                  <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                    <i className="bi bi-person-fill me-2" style={{ color: '#d4af37' }}></i>Employee
                  </label>
                  <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6' }}>
                    <h6 className="mb-0 fw-bold">{skill.employeeId?.name || "N/A"}</h6>
                    {skill.employeeId?.email && <small className="text-muted">{skill.employeeId.email}</small>}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                    <i className="bi bi-tag-fill me-2" style={{ color: '#d4af37' }}></i>Skill Name
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
                
                <div className="mb-4">
                  <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                    <i className="bi bi-pencil-fill me-2" style={{ color: '#d4af37' }}></i>Description
                  </label>
                  <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6', minHeight: '100px' }}>
                    <p className="mb-0">{skill.description || "No description provided"}</p>
                  </div>
                </div>

                {skill.selfEvaluation && (
                  <div className="mb-4">
                    <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center justify-content-between">
                      <span><i className="bi bi-star-fill me-2" style={{ color: '#d4af37' }}></i>Self Evaluation</span>
                      {!skill.verifiedEvaluation && (
                        <button className="btn btn-sm" onClick={openVerifyModal} style={{ background: '#28a745', color: '#fff', fontSize: '0.75rem' }}>
                          <i className="bi bi-check-circle me-1"></i>Verify
                        </button>
                      )}
                    </label>
                    <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', border: '2px solid #d4af37' }}>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2 fw-semibold">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i key={star} className={`bi bi-star${skill.selfEvaluation.rating >= star ? '-fill' : ''} me-1`} style={{ color: '#d4af37', fontSize: '1.2rem' }}></i>
                        ))}
                        <span className="ms-2 badge" style={{ background: '#d4af37', color: '#fff' }}>{skill.selfEvaluation.rating}/5</span>
                      </div>
                      {skill.selfEvaluation.comments && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-1">Comments:</small>
                          <p className="mb-0 small" style={{ fontStyle: 'italic' }}>&quot;{skill.selfEvaluation.comments}&quot;</p>
                        </div>
                      )}
                      {skill.selfEvaluation.lastUpdated && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            Last updated: {new Date(skill.selfEvaluation.lastUpdated).toLocaleString()}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {skill.verifiedEvaluation && (
                  <div className="mb-4">
                    <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center justify-content-between">
                      <span><i className="bi bi-check-circle-fill me-2" style={{ color: '#28a745' }}></i>Verified Evaluation</span>
                      <button className="btn btn-sm" onClick={openVerifyModal} style={{ background: '#0dcaf0', color: '#fff', fontSize: '0.75rem' }}>
                        <i className="bi bi-pencil me-1"></i>Update
                      </button>
                    </label>
                    <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', border: '2px solid #28a745' }}>
                      <div className="d-flex align-items-center mb-2">
                        <span className="me-2 fw-semibold">Final Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i key={star} className={`bi bi-star${skill.verifiedEvaluation.rating >= star ? '-fill' : ''} me-1`} style={{ color: '#28a745', fontSize: '1.2rem' }}></i>
                        ))}
                        <span className="ms-2 badge" style={{ background: '#28a745', color: '#fff' }}>{skill.verifiedEvaluation.rating}/5</span>
                        <span className="ms-2 badge bg-success"><i className="bi bi-shield-check"></i> VERIFIED</span>
                      </div>
                      {skill.verifiedEvaluation.feedback && (
                        <div className="mt-2">
                          <small className="text-muted d-block mb-1">Admin Feedback:</small>
                          <p className="mb-0 small" style={{ fontStyle: 'italic' }}>&quot;{skill.verifiedEvaluation.feedback}&quot;</p>
                        </div>
                      )}
                      {skill.verifiedEvaluation.verifiedAt && (
                        <div className="mt-2 pt-2 border-top">
                          <small className="text-muted">
                            <i className="bi bi-check-circle me-1"></i>
                            Verified: {new Date(skill.verifiedEvaluation.verifiedAt).toLocaleString()}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-0">
                  <label className="text-muted small mb-2 text-uppercase fw-semibold d-flex align-items-center">
                    <i className="bi bi-clock-history me-2" style={{ color: '#d4af37' }}></i>Timestamps
                  </label>
                  <div className="p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted small">Created:</span>
                      <span className="fw-semibold small">{skill.createdAt ? new Date(skill.createdAt).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted small">Updated:</span>
                      <span className="fw-semibold small">{skill.updatedAt ? new Date(skill.updatedAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Progression */}
          <div className="col-lg-7">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0" style={{ color: '#d4af37' }}>
                    <i className="bi bi-graph-up-arrow me-2"></i>Proficiency Progression
                  </h5>
                  <span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a', fontSize: '0.85rem', fontWeight: '600' }}>
                    {getProgressionCount()} {getProgressionCount() === 1 ? 'Entry' : 'Entries'}
                  </span>
                </div>
              </div>
              <div className="card-body p-4">
                {skill.proficiencyHistory && skill.proficiencyHistory.length > 1 && (() => {
                  const stats = getProgressionStats();
                  return stats && (
                    <div className="mb-4 p-3 rounded" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6' }}>
                      <div className="row g-3 text-center">
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <i className="bi bi-calendar-range" style={{ fontSize: '1.5rem', color: '#d4af37' }}></i>
                            <span className="fw-bold mt-1" style={{ fontSize: '1.2rem', color: '#1a1a1a' }}>{stats.totalDays}</span>
                            <small className="text-muted">Total Days</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <i className="bi bi-arrow-repeat" style={{ fontSize: '1.5rem', color: '#0dcaf0' }}></i>
                            <span className="fw-bold mt-1" style={{ fontSize: '1.2rem', color: '#1a1a1a' }}>{stats.totalUpdates}</span>
                            <small className="text-muted">Updates</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="d-flex flex-column">
                            <i className="bi bi-speedometer2" style={{ fontSize: '1.5rem', color: '#198754' }}></i>
                            <span className="fw-bold mt-1" style={{ fontSize: '1.2rem', color: '#1a1a1a' }}>{stats.avgDaysPerUpdate}</span>
                            <small className="text-muted">Avg Days/Update</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                {skill.proficiencyHistory && skill.proficiencyHistory.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {skill.proficiencyHistory.map((entry, idx) => {
                      const levelStyle = getLevelStyle(entry.level);
                      const isLatest = idx === skill.proficiencyHistory.length - 1;
                      const prevEntry = idx > 0 ? skill.proficiencyHistory[idx - 1] : null;
                      const daysSincePrev = prevEntry ? Math.floor((new Date(entry.date) - new Date(prevEntry.date)) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <div key={idx}>
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3 position-relative" style={{ background: isLatest ? `linear-gradient(135deg, ${levelStyle.bg} 0%, ${levelStyle.border} 100%)` : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: `2px solid ${isLatest ? levelStyle.border : '#dee2e6'}`, transition: 'all 0.3s', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px ${levelStyle.bg}50`; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}>
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px', minWidth: '60px', background: isLatest ? 'rgba(255,255,255,0.3)' : `linear-gradient(135deg, ${levelStyle.bg} 0%, ${levelStyle.border} 100%)`, border: isLatest ? '3px solid rgba(255,255,255,0.5)' : 'none', boxShadow: `0 4px 15px ${levelStyle.bg}60`, animation: isLatest ? 'pulse 2s infinite' : 'none' }}>
                              <i className={levelStyle.icon} style={{ fontSize: '1.5rem', color: '#fff' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <h5 className="mb-0 fw-bold" style={{ color: isLatest ? '#fff' : levelStyle.bg }}>{entry.level}</h5>
                                  <small style={{ color: isLatest ? 'rgba(255,255,255,0.9)' : '#6c757d' }}>
                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(entry.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </small>
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                  {isLatest && <span className="badge bg-white text-dark px-2 py-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-check-circle-fill me-1" style={{ color: '#198754' }}></i>Current</span>}
                                  {idx === 0 && !isLatest && <span className="badge bg-secondary px-2 py-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-flag-fill me-1"></i>Start</span>}
                                  {idx > 0 && prevEntry && prevEntry.level !== entry.level && (
                                    <span className="badge px-2 py-1" style={{ background: isLatest ? 'rgba(255,255,255,0.3)' : '#ffc107', color: isLatest ? '#fff' : '#000', fontSize: '0.7rem', fontWeight: '600' }}>
                                      <i className="bi bi-arrow-up-circle-fill me-1"></i>Upgraded
                                    </span>
                                  )}
                                  {daysSincePrev > 0 && (
                                    <span className="badge px-2 py-1" style={{ background: isLatest ? 'rgba(255,255,255,0.2)' : '#e9ecef', color: isLatest ? '#fff' : '#495057', fontSize: '0.7rem', border: isLatest ? '1px solid rgba(255,255,255,0.3)' : '1px solid #dee2e6' }}>
                                      +{daysSincePrev}d
                                    </span>
                                  )}
                                  <div className="badge px-3 py-2" style={{ background: isLatest ? 'rgba(255,255,255,0.3)' : levelStyle.bg, color: '#fff', fontSize: '1rem', fontWeight: '700', border: isLatest ? '2px solid rgba(255,255,255,0.5)' : 'none' }}>
                                    {getLevelProgress(entry.level)}%
                                  </div>
                                </div>
                              </div>
                              <div className="progress" style={{ height: '8px', background: isLatest ? 'rgba(255,255,255,0.3)' : '#e9ecef', borderRadius: '4px' }}>
                                <div className="progress-bar" style={{ width: `${getLevelProgress(entry.level)}%`, background: isLatest ? '#fff' : `linear-gradient(90deg, ${levelStyle.bg} 0%, ${levelStyle.border} 100%)`, borderRadius: '4px', transition: 'width 1s ease' }}></div>
                              </div>
                            </div>
                            <div className="position-absolute" style={{ top: '10px', left: '10px', background: isLatest ? 'rgba(255,255,255,0.3)' : levelStyle.bg, color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', border: isLatest ? '2px solid rgba(255,255,255,0.5)' : 'none' }}>
                              {idx + 1}
                            </div>
                          </div>
                          {idx < skill.proficiencyHistory.length - 1 && (
                            <div className="d-flex justify-content-center my-1">
                              <i className="bi bi-arrow-down" style={{ fontSize: '1.2rem', color: '#d4af37' }}></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : skill.proficiencyLevels && skill.proficiencyLevels.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {skill.proficiencyLevels.map((level, idx) => {
                      const levelStyle = getLevelStyle(level);
                      return (
                        <div key={idx}>
                          <div className="d-flex align-items-center gap-3 p-3 rounded-3 position-relative" style={{ background: `linear-gradient(135deg, ${levelStyle.bg} 0%, ${levelStyle.border} 100%)`, border: `2px solid ${levelStyle.border}`, transition: 'all 0.3s', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px ${levelStyle.bg}50`; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; }}>
                            <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px', minWidth: '60px', background: 'rgba(255,255,255,0.3)', border: '3px solid rgba(255,255,255,0.5)', boxShadow: `0 4px 15px ${levelStyle.bg}60` }}>
                              <i className={levelStyle.icon} style={{ fontSize: '1.5rem', color: '#fff' }}></i>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <h5 className="mb-0 fw-bold" style={{ color: '#fff' }}>{level}</h5>
                                  <small style={{ color: 'rgba(255,255,255,0.9)' }}>
                                    {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                  </small>
                                </div>
                                <div className="d-flex gap-2 align-items-center">
                                  <span className="badge bg-white text-dark px-2 py-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}><i className="bi bi-flag-fill me-1" style={{ color: '#6c757d' }}></i>Initial</span>
                                  <div className="badge px-3 py-2" style={{ background: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '1rem', fontWeight: '700', border: '2px solid rgba(255,255,255,0.5)' }}>
                                    {getLevelProgress(level)}%
                                  </div>
                                </div>
                              </div>
                              <div className="progress" style={{ height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px' }}>
                                <div className="progress-bar" style={{ width: `${getLevelProgress(level)}%`, background: '#fff', borderRadius: '4px', transition: 'width 1s ease' }}></div>
                              </div>
                            </div>
                            <div className="position-absolute" style={{ top: '10px', left: '10px', background: 'rgba(255,255,255,0.3)', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', border: '2px solid rgba(255,255,255,0.5)' }}>
                              {idx + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3" style={{ animation: 'float 3s ease-in-out infinite' }}>
                      <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#d4af37', opacity: 0.3 }}></i>
                    </div>
                    <p className="text-muted mt-3 mb-1 fw-semibold">No proficiency history available</p>
                    <small className="text-muted">Updates will appear here as they are recorded</small>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #d4af37 0%, #b8941f 100%);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #b8941f 0%, #d4af37 100%);
        }
      `}</style>
    </Layout>
  );
}
