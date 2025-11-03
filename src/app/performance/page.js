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
        
        try {
          const empRes = await fetch("/api/Employee");
          if (empRes.ok) {
            const employees = await empRes.json();
            setEmployeesList(Array.isArray(employees) ? employees : []);
          }
        } catch (err) {
          console.log('Failed to fetch employees list:', err);
        }
        
        const reviewsWithNames = data.map(review => {
          if (review.employeeId && !review.employeeName) {
            const employee = employeesList.find(emp => emp._id === review.employeeId);
            if (employee) {
              review.employeeName = employee.name || `${employee.firstName} ${employee.lastName}`.trim();
            } else {
              review.employeeName = `Employee ${review.employeeId.slice(-4)}`;
            }
          }
          return review;
        });
        
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
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      
      <div className="container py-4">
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-graph-up-arrow me-2"></i>Performance Management
                </h1>
                <small style={{ color: '#f4e5c3' }}>Track and manage employee performance reviews</small>
              </div>
              <div className="badge fs-6" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a' }}>
                {Array.isArray(reviews) ? reviews.length : 0} Reviews
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#d4af37' }}>
                  <i className="bi bi-clipboard-data"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Reviews</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#d4af37' }}>{Array.isArray(reviews) ? reviews.length : 0}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #28a745', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#28a745' }}>
                  <i className="bi bi-star-fill"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Excellent</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#28a745' }}>{Array.isArray(reviews) ? reviews.filter(r => r.overall >= 4).length : 0}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #ffc107', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#ffc107' }}>
                  <i className="bi bi-hand-thumbs-up-fill"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Good</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#ffc107' }}>{Array.isArray(reviews) ? reviews.filter(r => r.overall >= 3 && r.overall < 4).length : 0}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100 shadow-sm" style={{ border: '2px solid #6c757d', borderRadius: '12px' }}>
              <div className="card-body text-center p-4">
                <div className="mb-2" style={{ fontSize: '2.5rem', color: '#6c757d' }}>
                  <i className="bi bi-calendar-range"></i>
                </div>
                <h6 className="text-muted text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Periods</h6>
                <h4 className="mb-0 fw-bold" style={{ color: '#6c757d' }}>{periods.length}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-funnel-fill me-2"></i>Filter & Search</h5>
              <Link href="/performance/create" className="btn" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                <i className="bi bi-plus-circle-fill me-2"></i>Add Review
              </Link>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-lg-4">
                <label className="form-label fw-semibold small text-uppercase mb-2" style={{ color: '#6c757d', letterSpacing: '0.5px' }}>
                  <i className="bi bi-search me-2" style={{ color: '#d4af37' }}></i>Search
                </label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderTop: '2px solid #d4af37', borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37', borderRight: 'none' }}>
                    <i className="bi bi-search" style={{ color: '#d4af37' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by employee, reviewer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderTop: '2px solid #d4af37', borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37', borderLeft: 'none', fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <label className="form-label fw-semibold small text-uppercase mb-2" style={{ color: '#6c757d', letterSpacing: '0.5px' }}>
                  <i className="bi bi-calendar-range me-2" style={{ color: '#d4af37' }}></i>Period
                </label>
                <select
                  className="form-select form-select-lg"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  style={{ border: '2px solid #d4af37', fontSize: '1rem' }}
                >
                  <option value="">All Periods ({periods.length})</option>
                  {periods.map(period => (
                    <option key={period} value={period}>{period}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-4">
                <label className="form-label fw-semibold small text-uppercase mb-2" style={{ color: '#6c757d', letterSpacing: '0.5px' }}>
                  <i className="bi bi-star-fill me-2" style={{ color: '#d4af37' }}></i>Rating
                </label>
                <select
                  className="form-select form-select-lg"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  style={{ border: '2px solid #d4af37', fontSize: '1rem' }}
                >
                  <option value="">All Ratings ({ratings.length})</option>
                  {ratings.map(rating => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Reviews Content */}
        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-list-stars me-2"></i>Performance Reviews</h5>
              <div className="badge fs-6" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a' }}>
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
                <i className="bi bi-clipboard-data" style={{fontSize: '3rem', color: '#d4af37'}}></i>
                <p className="text-muted mt-2 mb-0">
                  {searchTerm || periodFilter || ratingFilter ? `No reviews found matching your criteria` : 'No performance reviews found. Add your first review!'}
                </p>
                {!searchTerm && !periodFilter && !ratingFilter && (
                  <Link href="/performance/create" className="btn mt-3" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                    <i className="bi bi-plus-circle me-2"></i>Add First Review
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th><i className="bi bi-person-fill me-2"></i>Employee</th>
                      <th><i className="bi bi-calendar-range me-2"></i>Period</th>
                      <th><i className="bi bi-person-badge me-2"></i>Reviewer</th>
                      <th><i className="bi bi-star-fill me-2"></i>Overall Rating</th>
                      <th><i className="bi bi-calendar-check me-2"></i>Review Date</th>
                      <th><i className="bi bi-gear-fill me-2"></i>Actions</th>
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
                          <div className="d-flex gap-2">
                            <Link
                              href={`/performance/${r._id}/edit`}
                              className="btn btn-sm"
                              style={{ background: '#d4af37', color: '#1a1a1a', border: 'none' }}
                            >
                              <i className="bi bi-pencil me-1"></i>Edit
                            </Link>
                            {userRole === "developer" && (
                              <button
                                onClick={() => handleDelete(r._id)}
                                className="btn btn-sm"
                                style={{ background: '#dc3545', color: '#fff', border: 'none' }}
                              >
                                <i className="bi bi-trash me-1"></i>Delete
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
