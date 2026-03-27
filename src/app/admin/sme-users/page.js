"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function SMEUsersManagement() {
  const [smeUsers, setSmeUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    employeeId: "", name: "", email: "", password: "", confirmPassword: ""
  });

  const fetchSMEUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/User?role=SME", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSmeUsers(data.users || []);
      } else {
        setError("Failed to fetch SME users");
      }
    } catch {
      setError("Error fetching SME users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(role)) { router.replace("/"); return; }
    fetchSMEUsers();
  }, [router, fetchSMEUsers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ employeeId: "", name: "", email: "", password: "", confirmPassword: "" });
    setShowCreateForm(false);
    setError("");
  };

  const handleCreateSME = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/User", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employeeId: formData.employeeId || `SME${Date.now().toString().slice(-6)}`,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: "SME"
        })
      });
      if (res.ok) {
        setSuccess("SME user created successfully");
        resetForm();
        fetchSMEUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const d = await res.json();
        setError(d.error || "Failed to create SME user");
      }
    } catch {
      setError("Error creating SME user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, isTerminated) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/User/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isTerminated: !isTerminated })
      });
      if (res.ok) {
        setSuccess(`User ${!isTerminated ? "deactivated" : "activated"} successfully`);
        fetchSMEUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update user status");
      }
    } catch {
      setError("Error updating user status");
    }
  };

  const active = smeUsers.filter(u => !u.isTerminated).length;
  const inactive = smeUsers.filter(u => u.isTerminated).length;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-3">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-people-fill me-2 text-success"></i>SME User Management
            </h5>
            {smeUsers.length > 0 && (
              <small className="text-muted">
                {smeUsers.length} total &middot; <span className="text-success">{active} active</span> &middot; <span className="text-danger">{inactive} inactive</span>
              </small>
            )}
          </div>
          <button className="btn btn-success btn-sm" onClick={() => setShowCreateForm(true)} disabled={loading}>
            <i className="bi bi-plus-circle me-1"></i>Add SME User
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible py-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible py-2 mb-3">
            <i className="bi bi-check-circle-fill me-2"></i>{success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
          </div>
        )}

        {/* Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border spinner-border-sm text-success"></div>
                <p className="mt-2 text-muted small">Loading...</p>
              </div>
            ) : smeUsers.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-people" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                <p className="mt-3 mb-3">No SME users yet.</p>
                <button className="btn btn-success btn-sm" onClick={() => setShowCreateForm(true)}>
                  <i className="bi bi-plus-circle me-1"></i>Create First SME User
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smeUsers.map((user) => (
                      <tr key={user._id}>
                        <td><code className="bg-light px-2 py-1 rounded">{user.employeeId}</code></td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-success bg-opacity-10 p-1">
                              <i className="bi bi-person-fill text-success"></i>
                            </div>
                            <strong>{user.name}</strong>
                          </div>
                        </td>
                        <td className="text-muted small">{user.email}</td>
                        <td>
                          <span className={`badge ${user.isTerminated ? "bg-danger" : "bg-success"}`}>
                            {user.isTerminated ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="text-muted small">
                          {new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className={`btn btn-sm ${user.isTerminated ? "btn-outline-success" : "btn-outline-warning"}`}
                              onClick={() => handleToggleStatus(user._id, user.isTerminated)}
                              title={user.isTerminated ? "Activate" : "Deactivate"}
                            >
                              <i className={`bi ${user.isTerminated ? "bi-check-circle" : "bi-pause-circle"}`}></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => router.push(`/admin/sme-monitoring?sme=${user.employeeId}`)}
                              title="View Sessions"
                            >
                              <i className="bi bi-eye"></i>
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

        {/* Create Modal */}
        {showCreateForm && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header py-3">
                  <h6 className="modal-title fw-bold">
                    <i className="bi bi-person-plus-fill me-2"></i>Create SME User
                  </h6>
                  <button type="button" className="btn-close" onClick={resetForm}></button>
                </div>
                <form onSubmit={handleCreateSME}>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger py-2 small">{error}</div>}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Employee ID</label>
                        <input type="text" className="form-control form-control-sm" name="employeeId"
                          value={formData.employeeId} onChange={handleInputChange}
                          placeholder="Auto-generated if empty" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Full Name <span className="text-danger">*</span></label>
                        <input type="text" className="form-control form-control-sm" name="name"
                          value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Email <span className="text-danger">*</span></label>
                        <input type="email" className="form-control form-control-sm" name="email"
                          value={formData.email} onChange={handleInputChange} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Password <span className="text-danger">*</span></label>
                        <input type="password" className="form-control form-control-sm" name="password"
                          value={formData.password} onChange={handleInputChange} minLength="6" required />
                        <small className="text-muted">Min 6 characters</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Confirm Password <span className="text-danger">*</span></label>
                        <input type="password" className="form-control form-control-sm" name="confirmPassword"
                          value={formData.confirmPassword} onChange={handleInputChange} minLength="6" required />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer py-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="btn btn-success btn-sm" disabled={loading}>
                      {loading ? <><span className="spinner-border spinner-border-sm me-1"></span>Creating...</> : <><i className="bi bi-check-circle me-1"></i>Create</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
