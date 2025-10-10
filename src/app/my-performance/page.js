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
      <div className="container mt-4">
        <h2>My Performance Reviews</h2>
        
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <div className="alert alert-info">No performance reviews found.</div>
        ) : (
          <div className="row">
            {reviews.map((review) => (
              <div key={review._id} className="col-md-12 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <h5>Performance Review - {review.reviewPeriod}</h5>
                    <span className={`badge ${getRatingColor(review.overall)} fs-6`}>
                      Overall: {review.overall}/5 ({getRatingText(review.overall)})
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Reviewer:</strong> {review.reviewer || "Not specified"}</p>
                        <p><strong>Review Date:</strong> {new Date(review.createdAt).toLocaleDateString()}</p>
                        
                        <h6>Ratings:</h6>
                        <ul className="list-unstyled">
                          <li>Communication: <span className={getRatingColor(review.ratings?.communication)}>{review.ratings?.communication || "N/A"}/5</span></li>
                          <li>Teamwork: <span className={getRatingColor(review.ratings?.teamwork)}>{review.ratings?.teamwork || "N/A"}/5</span></li>
                          <li>Problem Solving: <span className={getRatingColor(review.ratings?.problemsolving)}>{review.ratings?.problemsolving || "N/A"}/5</span></li>
                          <li>Leadership: <span className={getRatingColor(review.ratings?.leadership)}>{review.ratings?.leadership || "N/A"}/5</span></li>
                        </ul>
                      </div>
                      
                      <div className="col-md-6">
                        {review.goals && review.goals.length > 0 && (
                          <div className="mb-3">
                            <h6>Goals:</h6>
                            <ul>
                              {review.goals.map((goal, index) => (
                                <li key={index}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {review.achievements && review.achievements.length > 0 && (
                          <div className="mb-3">
                            <h6>Achievements:</h6>
                            <ul>
                              {review.achievements.map((achievement, index) => (
                                <li key={index}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {review.comments && (
                      <div className="mt-3">
                        <h6>Feedback & Comments:</h6>
                        <div className="alert alert-light">
                          {review.comments}
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