"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function SkillList() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        setSkills(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching skills:", err);
        setSkills([]);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id) {
    if (!confirm("🗑️ Are you sure you want to delete this skill?")) return;

    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete skill");
      setSkills((prevSkills) => prevSkills.filter((s) => s._id !== id));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setSuccessMessage("❌ Error deleting skill. Please try again.");
      setShowSuccessMessage(true);
    }
  }

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.skillName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || skill.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(skills.map(s => s.category).filter(Boolean))];

  const getProficiencyColor = (levels) => {
    if (!levels || levels.length === 0) return 'secondary';
    const highestLevel = levels[levels.length - 1];
    if (highestLevel?.toLowerCase().includes('expert') || highestLevel?.toLowerCase().includes('advanced')) return 'success';
    if (highestLevel?.toLowerCase().includes('intermediate')) return 'warning';
    return 'info';
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
                  <i className="bi bi-trophy-fill me-2"></i>Skills Management
                </h1>
                <small style={{ color: '#f4e5c3' }}>Manage employee skills and proficiency levels</small>
              </div>
              <div className="badge fs-6" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a' }}>
                {skills.length} Skills
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37', borderRadius: '12px' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37', borderRadius: '10px 10px 0 0' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-funnel-fill me-2"></i>Filter & Search</h5>
              <Link href="/skills/create" className="btn" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                <i className="bi bi-plus-circle-fill me-2"></i>Add Skill
              </Link>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-lg-8">
                <label className="form-label fw-semibold small text-uppercase mb-2" style={{ color: '#6c757d', letterSpacing: '0.5px' }}>
                  <i className="bi bi-search me-2" style={{ color: '#d4af37' }}></i>Search
                </label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '2px solid #d4af37', borderRight: 'none' }}>
                    <i className="bi bi-search" style={{ color: '#d4af37' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by skill name, employee, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: '2px solid #d4af37', borderLeft: 'none', fontSize: '1rem' }}
                  />
                  {searchTerm && (
                    <button 
                      className="btn" 
                      onClick={() => setSearchTerm('')}
                      style={{ background: 'linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%)', border: '2px solid #dc3545', color: '#fff' }}
                      title="Clear search"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <small className="text-muted mt-1 d-block">
                    <i className="bi bi-info-circle me-1"></i>
                    Found {filteredSkills.length} result{filteredSkills.length !== 1 ? 's' : ''}
                  </small>
                )}
              </div>
              <div className="col-lg-4">
                <label className="form-label fw-semibold small text-uppercase mb-2" style={{ color: '#6c757d', letterSpacing: '0.5px' }}>
                  <i className="bi bi-folder-fill me-2" style={{ color: '#d4af37' }}></i>Category
                </label>
                <select
                  className="form-select form-select-lg"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ border: '2px solid #d4af37', fontSize: '1rem' }}
                >
                  <option value="">All Categories ({categories.length})</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {categoryFilter && (
                  <button 
                    className="btn btn-sm mt-2 w-100" 
                    onClick={() => setCategoryFilter('')}
                    style={{ border: '1px solid #6c757d', color: '#6c757d', background: 'transparent' }}
                  >
                    <i className="bi bi-x-circle me-1"></i>Clear Filter
                  </button>
                )}
              </div>
            </div>
            {(searchTerm || categoryFilter) && (
              <div className="mt-3 p-3 rounded" style={{ background: 'linear-gradient(135deg, #d4af3715 0%, #d4af3705 100%)', border: '1px solid #d4af37' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge px-3 py-2" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a', fontSize: '0.9rem' }}>
                      <i className="bi bi-funnel-fill me-2"></i>Active Filters
                    </span>
                    {searchTerm && (
                      <span className="badge bg-info px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-search me-1"></i>Search: "{searchTerm}"
                      </span>
                    )}
                    {categoryFilter && (
                      <span className="badge bg-secondary px-3 py-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-folder-fill me-1"></i>Category: {categoryFilter}
                      </span>
                    )}
                  </div>
                  <button 
                    className="btn btn-sm" 
                    onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
                    style={{ background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)', border: 'none', color: '#fff', fontWeight: '600' }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>Reset All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills Content */}
        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-list-stars me-2"></i>Skills Overview</h5>
              <div className="badge fs-6" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a' }}>
                {filteredSkills.length} Results
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading skills...</p>
              </div>
            ) : filteredSkills.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-trophy" style={{fontSize: '3rem', color: '#d4af37'}}></i>
                <p className="text-muted mt-2 mb-0">
                  {searchTerm || categoryFilter ? `No skills found matching your criteria` : 'No skills found. Add your first skill!'}
                </p>
                {!searchTerm && !categoryFilter && (
                  <Link href="/skills/create" className="btn mt-3" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                    <i className="bi bi-plus-circle me-2"></i>Add First Skill
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th><i className="bi bi-person-fill me-2"></i>Employee</th>
                      <th><i className="bi bi-star-fill me-2"></i>Skill Name</th>
                      <th><i className="bi bi-folder-fill me-2"></i>Category</th>
                      <th><i className="bi bi-pencil-fill me-2"></i>Description</th>
                      <th><i className="bi bi-bar-chart-fill me-2"></i>Proficiency</th>
                      <th><i className="bi bi-gear-fill me-2"></i>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <div className="fw-semibold">{s.employeeId?.name || "N/A"}</div>
                        </td>
                        <td>
                          <div className="fw-semibold text-primary">{s.skillName}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{s.category || 'Uncategorized'}</span>
                        </td>
                        <td>
                          <small className="text-muted">{s.description || '—'}</small>
                        </td>
                        <td>
                          {(s.proficiencyLevels || []).length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {s.proficiencyLevels.map((level, idx) => (
                                <span key={idx} className={`badge bg-${getProficiencyColor(s.proficiencyLevels)} text-white`}>
                                  {level}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Link
                              href={`/skills/${s._id}`}
                              className="btn btn-sm"
                              style={{ background: '#0dcaf0', color: '#fff', border: 'none' }}
                            >
                              <i className="bi bi-eye me-1"></i>View
                            </Link>
                            <Link
                              href={`/skills/${s._id}/update`}
                              className="btn btn-sm"
                              style={{ background: '#ffc107', color: '#000', border: 'none' }}
                            >
                              <i className="bi bi-arrow-up-circle me-1"></i>Update
                            </Link>
                            {userRole === "developer" && (
                              <button
                                onClick={() => handleDelete(s._id)}
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
