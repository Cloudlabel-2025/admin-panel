"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function SkillList() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
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
      alert("❌ Error deleting skill. Please try again.");
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
              🎯 Skills Management
            </h1>
            <small className="text-muted">Manage employee skills and proficiency levels</small>
          </div>
          <div className="badge bg-info fs-6">
            {skills.length} Skills
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🔍 Filter & Search</h5>
              <Link href="/skills/create" className="btn btn-primary">
                ➕ Add Skill
              </Link>
            </div>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center">
                  {showSearch ? (
                    <div className="input-group" style={{transition: 'all 0.3s ease'}}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by skill name, employee, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => !searchTerm && setShowSearch(false)}
                        autoFocus
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={() => {
                          setSearchTerm('');
                          setShowSearch(false);
                        }}
                      >
                        ❌
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-outline-primary" 
                      onClick={() => setShowSearch(true)}
                    >
                      🔍 Search Skills
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">📂 All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Content */}
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">🎯 Skills Overview</h5>
              <div className="badge bg-light text-dark fs-6">
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
                <div style={{fontSize: '3rem'}}>🎯</div>
                <p className="text-muted mt-2 mb-0">
                  {searchTerm || categoryFilter ? `No skills found matching your criteria` : 'No skills found. Add your first skill!'}
                </p>
                {!searchTerm && !categoryFilter && (
                  <Link href="/skills/create" className="btn btn-primary mt-3">
                    ➕ Add First Skill
                  </Link>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>👤 Employee</th>
                      <th>🎯 Skill Name</th>
                      <th>📂 Category</th>
                      <th>📝 Description</th>
                      <th>📊 Proficiency</th>
                      <th>⚙️ Actions</th>
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
                          <div className="btn-group" role="group">
                            <Link
                              href={`/skills/${s._id}/edit`}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit Skill"
                            >
                              ✏️ Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(s._id)}
                              className="btn btn-sm btn-outline-danger"
                              title="Delete Skill"
                            >
                              🗑️ Delete
                            </button>
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
