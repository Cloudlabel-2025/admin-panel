"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [employeesList, setEmployeesList] = useState([]);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const role = localStorage.getItem("userRole");
        setUserRole(role);
        const empId = localStorage.getItem("employeeId");
        
        let url = "/api/performance";
        const params = new URLSearchParams();
        
        if (role) params.append("userRole", role);
        
        // For team roles, add department filter
        if ((role === "Team-Lead" || role === "Team-admin") && empId) {
          const userRes = await fetch(`/api/Employee/${empId}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            params.append("userDepartment", userData.department);
          }
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        console.log('Performance data received:', data);
        
        // Fetch employees list for name lookup
        try {
          const empRes = await fetch("/api/Employee");
          if (empRes.ok) {
            const employees = await empRes.json();
            console.log('Employees fetched:', employees);
            setEmployeesList(Array.isArray(employees) ? employees : []);
          } else {
            console.log('Employee API failed:', empRes.status);
          }
        } catch (err) {
          console.log('Failed to fetch employees list:', err);
        }
        
        // Add employee names using employees list
        const reviewsWithNames = data.map(review => {
          if (review.employeeId && !review.employeeName) {
            // Try to find employee in the employees list
            const employee = employeesList.find(emp => emp._id === review.employeeId);
            if (employee) {
              review.employeeName = employee.name || `${employee.firstName} ${employee.lastName}`.trim();
            } else {
              // Fallback: use employee ID as display name
              review.employeeName = `Employee ${review.employeeId.slice(-4)}`;
            }
          }
          return review;
        });
        
        console.log('Final reviews with names:', reviewsWithNames);
        setReviews(reviewsWithNames);
      } catch (err) {
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformance();
  }, []);

  async function handleDelete(id) {
    if (!confirm("🗑️ Are you sure you want to delete this performance review?")) return;
    try {
      const res = await fetch(`/api/performance/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete review");
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSuccessMessage("❌ Error deleting review. Please try again.");
      setShowSuccessMessage(true);
    }
  }

  const filteredReviews = (Array.isArray(reviews) ? reviews : []).filter(review => {
    const matchesSearch = review.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.reviewPeriod?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = !periodFilter || review.reviewPeriod === periodFilter;
    const matchesRating = !ratingFilter || review.overall === ratingFilter;
    return matchesSearch && matchesPeriod && matchesRating;
  });

  const periods = [...new Set((Array.isArray(reviews) ? reviews : []).map(r => r.reviewPeriod).filter(Boolean))];
  const ratings = [...new Set((Array.isArray(reviews) ? reviews : []).map(r => r.overall).filter(Boolean))];

  const getOverallBadge = (rating) => {
    if (!rating) return 'secondary';
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'primary';
    if (rating >= 2) return 'warning';
    return 'danger';
  };

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="text-primary mb-1">
              📊 Performance Management
            </h1>
            <small className="text-muted">Track and manage employee performance reviews</small>
          </div>
          <div className="badge bg-info fs-6">
            {Array.isArray(reviews) ? reviews.length : 0} Reviews
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h3 className="mb-1">{Array.isArray(reviews) ? reviews.length : 0}</h3>
                <small>📊 Total Reviews</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h3 className="mb-1">{Array.isArray(reviews) ? reviews.filter(r => r.overall >= 4).length : 0}</h3>
                <small>⭐ Excellent</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h3 className="mb-1">{Array.isArray(reviews) ? reviews.filter(r => r.overall >= 3 && r.overall < 4).length : 0}</h3>
                <small>👍 Good</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h3 className="mb-1">{periods.length}</h3>
                <small>📅 Periods</small>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🔍 Filter & Search</h5>
              <Link href="/performance/create" className="btn btn-primary">
                ➕ Add Review
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search by employee, reviewer, or period..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                >
                  <option value="">📅 All Periods</option>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <select
                  className="form-select"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="">⭐ All Ratings</option>
                  {ratings.map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Reviews Content */}
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📊 Performance Reviews</h5>
              <div className="badge bg-light text-dark fs-6">
                {filteredReviews.length} Results
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading performance reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-5">
                <div style={{fontSize: '3rem'}}>📊</div>
                <p className="text-muted mt-2 mb-0">
                  {searchTerm || periodFilter || ratingFilter ? `No reviews found matching your criteria` : 'No performance reviews found. Add your first review!'}
                </p>
                {!searchTerm && !periodFilter && !ratingFilter && (
                  <Link href="/performance/create" className="btn btn-primary mt-3">
                    ➕ Add First Review
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>👤 Employee</th>
                      <th>📅 Period</th>
                      <th>👨‍💼 Reviewer</th>
                      <th>⭐ Overall Rating</th>
                      <th>📅 Review Date</th>
                      <th>⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div className="fw-semibold">{r.employeeName || "—"}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{r.reviewPeriod || "—"}</span>
                        </td>
                        <td>
                          <small className="text-muted">{r.reviewer || "—"}</small>
                        </td>
                        <td>
                          <span className={`badge bg-${getOverallBadge(r.overall)} text-white`}>
                            {r.overall || "—"}
                          </span>
                        </td>
                        <td>
                          <small className="text-muted">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link
                              href={`/performance/${r._id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit Review"
                            >
                              ✏️ Edit
                            </Link>
                            {userRole === "developer" && (
                              <button
                                onClick={() => handleDelete(r._id)}
                                className="btn btn-sm btn-outline-danger"
                                title="Delete Review"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
