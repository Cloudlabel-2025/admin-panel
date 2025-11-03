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
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    const today = new Date().toISOString().split('T')[0];
    setTodayDate(today);
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

  function generateProjectCode(projectName) {
    const words = projectName.trim().split(/\s+/);
    const initials = words.map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3);
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `${initials}-${dateStr}`;
  }

  function getMaxEndDate(startDate) {
    if (!startDate) return '';
    const start = new Date(startDate);
    const maxEnd = new Date(start);
    maxEnd.setFullYear(maxEnd.getFullYear() + 1);
    return maxEnd.toISOString().split('T')[0];
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let newValue = value;
    let updates = {};
    
    if (name === 'projectName') {
      // Project Name: max 30 chars, text only
      newValue = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
      // Auto-generate project code when project name changes
      if (newValue.trim()) {
        updates.projectCode = generateProjectCode(newValue);
      }
    } else if (name === 'description') {
      // Description: max 50 chars
      newValue = value.slice(0, 50);
    } else if (name === 'startDate') {
      // Reset end date if it exceeds 1 year from new start date
      if (formData.endDate) {
        const maxEnd = getMaxEndDate(value);
        if (formData.endDate > maxEnd) {
          updates.endDate = '';
        }
      }
    }
    
    setFormData({ ...formData, [name]: newValue, ...updates });
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
    
    // Validate description - max 10 numbers
    if (formData.description) {
      const numCount = (formData.description.match(/\d/g) || []).length;
      if (numCount > 10) {
        setError('Description can contain maximum 10 numbers');
        return;
      }
    }
    
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
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      <div className="container py-4">
        <div className="row align-items-center mb-4">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <h1 className="mb-0 d-flex align-items-center" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700'}}>
              <i className="bi bi-kanban me-2"></i>
              <span className="d-none d-sm-inline">Project Management</span>
              <span className="d-inline d-sm-none">Projects</span>
            </h1>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <div className="d-inline-flex align-items-center gap-2 flex-wrap">
              <div className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '1px solid #d4af37'}}>
                <i className="bi bi-folder me-1"></i>
                {projects.length} Total
              </div>
              <div className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>
                <i className="bi bi-check-circle me-1"></i>
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4af37'}}>
          <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
            <div className="d-flex justify-content-between align-items-center py-2">
              <h5 className="mb-0">
                <i className="bi bi-kanban me-2"></i>
                Projects <span className="badge ms-2" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>{filteredProjects.length}</span>
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
                      className="btn btn-sm text-white" 
                      onClick={() => setShowSearch(true)}
                      style={{background: 'rgba(212, 175, 55, 0.3)', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px'}}
                    >
                      <i className="bi bi-search"></i>
                    </button>
                  )}
                </div>
                <button className="btn add-project-btn" onClick={() => openModal()} style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600', border: 'none', transition: 'all 0.3s ease'}}>
                  <i className="bi bi-plus-circle me-1"></i> Add Project
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
                  <thead style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', borderBottom: '2px solid #d4af37'}}>
                    <tr>
                      <th><i className="bi bi-code-square me-1"></i>Code</th>
                      <th><i className="bi bi-tag me-1"></i>Name</th>
                      <th><i className="bi bi-bar-chart me-1"></i>Status</th>
                      <th><i className="bi bi-check-circle me-1"></i>Assignment</th>
                      <th><i className="bi bi-calendar-event me-1"></i>Start</th>
                      <th><i className="bi bi-calendar-check me-1"></i>End</th>
                      <th><i className="bi bi-person me-1"></i>Assigned By</th>
                      <th><i className="bi bi-people me-1"></i>Assigned To</th>
                      <th><i className="bi bi-gear me-1"></i>Actions</th>
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
                        <tr key={p._id} style={{transition: 'all 0.2s ease'}}>
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
              <div className="modal-content shadow-lg" style={{borderRadius: '12px', overflow: 'hidden', border: '2px solid #d4af37'}}>
                <form onSubmit={saveProject}>
                  <div className="modal-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
                    <h5 className="modal-title">
                      {editingProject ? <><i className="bi bi-pencil-square me-2"></i>Edit Project</> : <><i className="bi bi-plus-circle me-2"></i>Add New Project</>}
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
                        <label className="form-label fw-semibold"><i className="bi bi-tag me-1"></i>Project Name <span className="text-danger">*</span></label>
                        <input
                          className="form-control"
                          name="projectName"
                          value={formData.projectName}
                          onChange={handleChange}
                          placeholder="Enter project name"
                          required
                          maxLength={30}
                        />
                        <small className="text-muted">Max 30 characters, text only</small>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold"><i className="bi bi-code-square me-1"></i>Project Code <span className="text-danger">*</span></label>
                        <input
                          className="form-control bg-light"
                          name="projectCode"
                          value={formData.projectCode}
                          readOnly
                          placeholder="Auto-generated"
                          required
                          style={{ cursor: 'not-allowed' }}
                        />
                        <small className="text-muted">Auto-generated from project name and date</small>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold"><i className="bi bi-file-text me-1"></i>Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter project description"
                        maxLength={50}
                      />
                      <small className="text-muted">Max 50 characters, max 10 numbers allowed ({formData.description.length}/50 chars, {(formData.description.match(/\d/g) || []).length}/10 numbers)</small>
                    </div>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold"><i className="bi bi-calendar-event me-1"></i>Start Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          min={todayDate}
                        />
                        <small className="text-muted">Cannot be in the past</small>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold"><i className="bi bi-calendar-check me-1"></i>End Date</label>
                        <input
                          type="date"
                          className="form-control"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate}
                          max={getMaxEndDate(formData.startDate)}
                        />
                        <small className="text-muted">Max 1 year from start date</small>
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-semibold"><i className="bi bi-bar-chart me-1"></i>Status</label>
                        <select
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="Planned">Planned</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold"><i className="bi bi-person me-1"></i>Assigned By</label>
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
                        <label className="form-label fw-semibold"><i className="bi bi-people me-1"></i>Assigned To</label>
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
                  <div className="modal-footer" style={{borderTop: '2px solid #d4af37'}}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      <i className="bi bi-x-circle me-1"></i> Cancel
                    </button>
                    <button type="submit" className="btn text-white submit-project-btn" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37', transition: 'all 0.3s ease'}}>
                      <i className="bi bi-check-circle me-1"></i> {editingProject ? "Update Project" : "Add Project"}
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
              <div className="modal-content shadow-lg" style={{borderRadius: '12px', overflow: 'hidden', border: '2px solid #d4af37'}}>
                <div className="modal-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
                  <h5 className="modal-title">
                    <i className="bi bi-eye me-2"></i>View Project Details
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
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-tag me-1"></i>Project Name</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">{viewingProject.projectName}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-code-square me-1"></i>Project Code</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">{viewingProject.projectCode}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-muted"><i className="bi bi-file-text me-1"></i>Description</label>
                    <p className="form-control-plaintext border rounded p-2 bg-light" style={{minHeight: '80px'}}>
                      {viewingProject.description || 'No description provided'}
                    </p>
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-calendar-event me-1"></i>Start Date</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.startDate?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-calendar-check me-1"></i>End Date</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.endDate?.slice(0, 10) || '—'}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-bar-chart me-1"></i>Project Status</label>
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
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-check-circle me-1"></i>Assignment Status</label>
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
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-person me-1"></i>Assigned By</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.assignedBy?.name || '—'}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold text-muted"><i className="bi bi-people me-1"></i>Assigned To</label>
                      <p className="form-control-plaintext border rounded p-2 bg-light">
                        {viewingProject.assignedTo?.name || '—'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{borderTop: '2px solid #d4af37'}}>
                  <button
                    type="button"
                    className="btn text-white"
                    onClick={() => setShowViewModal(false)}
                    style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37'}}
                  >
                    <i className="bi bi-x-circle me-1"></i> Close
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
        .table-hover tbody tr:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%);
          transform: scale(1.01);
          border-left: 3px solid #d4af37;
        }
        .add-project-btn:hover {
          background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%) !important;
          color: #d4af37 !important;
          border: 2px solid #d4af37 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
        .submit-project-btn:hover {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%) !important;
          color: #000 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
      `}</style>
    </Layout>
  );
}
