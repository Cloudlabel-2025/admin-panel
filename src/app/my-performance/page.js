"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function MyPerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    setEmployeeId(empId);
    if (empId) {
      fetchMyReviews(empId);
    }
  }, []);

  const fetchMyReviews = async (empId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/performance?employee=true&employeeId=${empId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-success";
    if (rating >= 3) return "text-warning";
    return "text-danger";
  };

  const getRatingText = (rating) => {
    if (rating >= 4) return "Excellent";
    if (rating >= 3) return "Good";
    if (rating >= 2) return "Average";
    return "Needs Improvement";
  };

  return (
    <Layout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="text-primary mb-1">
              📊 My Performance Reviews
            </h1>
            <small className="text-muted">View your performance evaluations and feedback</small>
          </div>
          <div className="badge bg-info fs-6">
            {reviews.length} Reviews
          </div>
        </div>

        {/* Stats Cards */}
        {reviews.length > 0 && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{reviews.length}</h3>
                  <small>📊 Total Reviews</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{(reviews.reduce((sum, r) => sum + r.overall, 0) / reviews.length).toFixed(1)}</h3>
                  <small>⭐ Average Rating</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{reviews.filter(r => r.overall >= 4).length}</h3>
                  <small>🏆 Excellent</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="mb-1">{reviews[0]?.reviewPeriod || 'N/A'}</h3>
                  <small>📅 Latest Review</small>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading your performance reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-5">
            <div style={{fontSize: '3rem'}}>📊</div>
            <p className="text-muted mt-2 mb-0">No performance reviews found.</p>
            <p className="text-muted">Your manager will create reviews for you.</p>
          </div>
        ) : (
          <div className="row">
            {reviews.map((review) => (
              <div key={review._id} className="col-md-12 mb-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      📅 {review.reviewPeriod ? new Date(review.reviewPeriod + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Performance Review'}
                    </h5>
                    <span className="badge bg-light text-dark fs-6">
                      ⭐ {review.overall}/5 - {getRatingText(review.overall)}
                    </span>
                  </div>
                  <div className="card-body p-4">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <p className="mb-2"><strong>👨💼 Reviewer:</strong> {review.reviewer || "Not specified"}</p>
                          <p className="mb-3"><strong>📅 Review Date:</strong> {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <h6 className="text-primary mb-3">📊 Performance Ratings</h6>
                        <div className="border rounded p-3 bg-light">
                          <div className="row">
                            <div className="col-6 mb-2">
                              <small className="text-muted">💬 Communication</small>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div className="progress-bar bg-primary" style={{width: `${(review.ratings?.communication || 0) * 20}%`}}></div>
                                </div>
                                <span className="badge bg-primary">{review.ratings?.communication || 0}/5</span>
                              </div>
                            </div>
                            <div className="col-6 mb-2">
                              <small className="text-muted">🤝 Teamwork</small>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div className="progress-bar bg-success" style={{width: `${(review.ratings?.teamwork || 0) * 20}%`}}></div>
                                </div>
                                <span className="badge bg-success">{review.ratings?.teamwork || 0}/5</span>
                              </div>
                            </div>
                            <div className="col-6 mb-2">
                              <small className="text-muted">🧠 Problem Solving</small>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div className="progress-bar bg-warning" style={{width: `${(review.ratings?.problemsolving || 0) * 20}%`}}></div>
                                </div>
                                <span className="badge bg-warning">{review.ratings?.problemsolving || 0}/5</span>
                              </div>
                            </div>
                            <div className="col-6 mb-2">
                              <small className="text-muted">👑 Leadership</small>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div className="progress-bar bg-info" style={{width: `${(review.ratings?.leadership || 0) * 20}%`}}></div>
                                </div>
                                <span className="badge bg-info">{review.ratings?.leadership || 0}/5</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        {review.goals && review.goals.length > 0 && (
                          <div className="mb-3">
                            <h6 className="text-primary">🎯 Goals & Objectives</h6>
                            <div className="border rounded p-3 bg-light">
                              {review.goals.map((goal, index) => (
                                <div key={index} className="d-flex align-items-start mb-2">
                                  <span className="badge bg-primary me-2">{index + 1}</span>
                                  <span>{goal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {review.achievements && review.achievements.length > 0 && (
                          <div className="mb-3">
                            <h6 className="text-success">🏆 Achievements</h6>
                            <div className="border rounded p-3 bg-light">
                              {review.achievements.map((achievement, index) => (
                                <div key={index} className="d-flex align-items-start mb-2">
                                  <span className="badge bg-success me-2">✓</span>
                                  <span>{achievement}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {review.comments && (
                      <div className="mt-4">
                        <h6 className="text-primary">📝 Feedback & Comments</h6>
                        <div className="border rounded p-3 bg-light">
                          <p className="mb-0">{review.comments}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}