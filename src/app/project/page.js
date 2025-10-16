"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Planned",
    assignedBy: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    fetchProjects();
    fetchUsers();
  }, []);

  // Fetch Projects
  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/project");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      if (!Array.isArray(data)) {
        setError(data.error || "Failed to load projects");
        setProjects([]);
      } else {
        setProjects(data);
      }
    } catch (err) {
      console.error("Project fetch error:", err);
      setError("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch Users
  async function fetchUsers() {
    try {
      const res = await fetch("/api/User");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function openModal(project = null) {
    setEditingProject(project);
    const currentUserEmployeeId = localStorage.getItem("employeeId");
    
    if (project) {
      setFormData({
        projectName: project.projectName,
        projectCode: project.projectCode,
        description: project.description || "",
        startDate: project.startDate?.slice(0, 10) || "",
        endDate: project.endDate?.slice(0, 10) || "",
        status: project.status,
        assignedBy: currentUserEmployeeId || "",
        assignedTo: project.assignedTo?.employeeId || project.assignedTo || "",
      });
    } else {
      setFormData({
        projectName: "",
        projectCode: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Planned",
        assignedBy: currentUserEmployeeId || "",
        assignedTo: "",
      });
    }
    setShowModal(true);
    setError("");
  }

  async function saveProject(e) {
    e.preventDefault();
    setError("");
    try {
      const method = editingProject ? "PUT" : "POST";
      const url = editingProject
        ? `/api/project/${editingProject._id}`
        : "/api/project";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.error || "Failed to save project");

      setShowModal(false);
      setEditingProject(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchProjects();
    } catch (err) {
      console.error("Save Project Error:", err);
      setError(err.message);
    }
  }

  async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Failed to delete project");
      fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  const filteredProjects = projects.filter(project => 
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              📋 Project Management
            </h1>
            <small className="text-muted">Manage and track all projects</small>
          </div>
          <div className="badge bg-info fs-6">
            {projects.length} Projects
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                🚀 Projects ({filteredProjects.length})
              </h5>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  {showSearch ? (
                    <div className="input-group" style={{width: '300px', transition: 'all 0.3s ease'}}>
                      <input
                        type="text"
                        className="form-control border-0"
                        placeholder="Search by project name or assigned to..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => !searchTerm && setShowSearch(false)}
                        autoFocus
                      />
                      <button 
                        className="btn btn-outline-light border-0" 
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
                      className="btn text-white" 
                      onClick={() => setShowSearch(true)}
                      style={{background: 'none', border: 'none'}}
                    >
                      🔍
                    </button>
                  )}
                </div>
                <button className="btn btn-light" onClick={() => openModal()}>
                  ➕ Add Project
                </button>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {error && (
              <div className="alert alert-danger m-3">
                ⚠️ {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-5">
                <div style={{fontSize: '3rem'}}>📋</div>
                <p className="text-muted mt-2 mb-0">
                  {searchTerm ? `No projects found matching "${searchTerm}"` : 'No projects found.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>📝 Code</th>
                      <th>🏷️ Name</th>
                      <th>📊 Status</th>
                      <th>✅ Assignment</th>
                      <th>📅 Start</th>
                      <th>🏁 End</th>
                      <th>👤 Assigned By</th>
                      <th>👥 Assigned To</th>
                      <th>⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => {
                const getBadgeClass = () => {
                  if (p.assignmentStatus === 'Pending') return 'bg-warning';
                  if (p.assignmentStatus === 'Accepted') return 'bg-success';
                  return 'bg-danger';
                };
                
                      return (
                        <tr key={p._id}>
                          <td>
                            <code className="bg-light px-2 py-1 rounded">{p.projectCode}</code>
                          </td>
                          <td>
                            <div className="fw-semibold">{p.projectName}</div>
                          </td>
                          <td>
                            <span className={`badge ${
                              p.status === 'Completed' ? 'bg-success' :
                              p.status === 'Ongoing' ? 'bg-warning text-dark' : 'bg-secondary'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getBadgeClass()}`}>
                              {p.assignmentStatus || 'Pending'}
                            </span>
                          </td>
                          <td>{p.startDate?.slice(0, 10) || '—'}</td>
                          <td>{p.endDate?.slice(0, 10) || '—'}</td>
                          <td>{p.assignedBy?.name || "—"}</td>
                          <td>{p.assignedTo?.name || "—"}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => {
                                  setViewingProject(p);
                                  setShowViewModal(true);
                                }}
                                title="View Project"
                              >
                                👁️ View
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => openModal(p)}
                                title="Edit Project"
                              >
                                ✏️ Edit
                              </button>
                              {userRole === "developer" && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => deleteProject(p._id)}
                                  title="Delete Project"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow-lg">
                <form onSubmit={saveProject}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      {editingProject ? "✏️ Edit Project" : "➕ Add New Project"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowModal(false)}
                    />
                  </div>
                  <div className="modal-body p-4">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">🏷️ Project Name</label>
                        <input
                          className="form-control"
                          name="projectName"
                          value={formData.projectName}
                          onChange={handleChange}
                          placeholder="Enter project name"
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">📝 Project Code</label>
                        <input
                          className="form-control"
                          name="projectCode"
                          value={formData.projectCode}
                          onChange={handleChange}
                          placeholder="Enter project code"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">📄 Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter project description"
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold">📅 Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold">🏁 End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold">📊 Status</label>
                        <select
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="Planned">📋 Planned</option>
                          <option value="Ongoing">🚀 Ongoing</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">👤 Assigned By</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`${users.find(u => u.employeeId === formData.assignedBy)?.name || 'Current User'} (${formData.assignedBy})`}
                          readOnly
                          style={{backgroundColor: '#f8f9fa'}}
                        />
                        <small className="text-muted">Automatically set to logged-in user</small>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">👥 Assigned To</label>
                        <select
                          className="form-select"
                          name="assignedTo"
                          value={formData.assignedTo}
                          onChange={handleChange}
                          required
                          style={{maxHeight: '200px', overflowY: 'auto'}}
                        >
                          <option value="">Select Assignee</option>
                          {users.map((u) => (
                            <option key={u._id} value={u.employeeId}>
                              {u.name} ({u.employeeId})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      ❌ Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingProject ? "💾 Update Project" : "➕ Add Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingProject && (
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">
                    👁️ View Project Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowViewModal(false)}
                  />
                </div>
                <div className="modal-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted">🏷️ Project Name</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">{viewingProject.projectName}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted">📝 Project Code</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">{viewingProject.projectCode}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted">📄 Description</label>
                    <p className="form-control-plaintext border rounded p-2 bg-light" style={{minHeight: '80px'}}>
                      {viewingProject.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted">📅 Start Date</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.startDate?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted">🏁 End Date</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.endDate?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted">📊 Project Status</label>
                      <p className="form-control-plaintext">
                        <span className={`badge ${
                          viewingProject.status === 'Completed' ? 'bg-success' :
                          viewingProject.status === 'Ongoing' ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}>
                          {viewingProject.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted">✅ Assignment Status</label>
                      <p className="form-control-plaintext">
                        <span className={`badge ${
                          viewingProject.assignmentStatus === 'Accepted' ? 'bg-success' :
                          viewingProject.assignmentStatus === 'Rejected' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {viewingProject.assignmentStatus || 'Pending'}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-8"></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted">👤 Assigned By</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.assignedBy?.name || '—'}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted">👥 Assigned To</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.assignedTo?.name || '—'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    ❌ Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
