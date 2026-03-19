"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function SMEUsersManagement() {
  const [smeUsers, setSmeUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    checkAdminRole();
    fetchSMEUsers();
  }, []);

  const checkAdminRole = () => {
    const role = localStorage.getItem("userRole");
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(role)) {
      router.replace("/");
    }
  };

  const fetchSMEUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch('/api/User?role=SME', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSmeUsers(data.users || []);
      } else {
        setError("Failed to fetch SME users");
      }
    } catch (error) {
      console.error('Error fetching SME users:', error);
      setError("Error fetching SME users");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateEmployeeId = () => {
    const prefix = "SME";
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  };

  const handleCreateSME = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const userData = {
        employeeId: formData.employeeId || generateEmployeeId(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "SME"
      };

      const response = await fetch('/api/User', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setSuccess("SME user created successfully");
        setFormData({
          employeeId: "",
          name: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        setShowCreateForm(false);
        fetchSMEUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create SME user");
      }
    } catch (error) {
      console.error('Error creating SME user:', error);
      setError("Error creating SME user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/User/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isTerminated: !currentStatus })
      });

      if (response.ok) {
        setSuccess(`SME user ${!currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchSMEUsers();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update user status");
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError("Error updating user status");
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    setShowCreateForm(false);
    setEditingUser(null);
    setError("");
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0" style={{ color: '#1a1a1a', fontWeight: '700' }}>
                <i className="bi bi-people-fill me-2"></i>SME User Management
              </h2>
              <button
                className="btn btn-success"
                onClick={() => setShowCreateForm(true)}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add SME User
              </button>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError("")}></button>
              </div>
            )}

            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
                <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
              </div>
            )}

            {/* Create SME Form Modal */}
            {showCreateForm && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Create New SME User
                      </h5>
                      <button type="button" className="btn-close" onClick={resetForm}></button>
                    </div>
                    <form onSubmit={handleCreateSME}>
                      <div className="modal-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Employee ID</label>
                            <input
                              type="text"
                              className="form-control"
                              name="employeeId"
                              value={formData.employeeId}
                              onChange={handleInputChange}
                              placeholder="Leave empty to auto-generate"
                            />
                            <small className="text-muted">Leave empty to auto-generate (SME + timestamp)</small>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Full Name <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Email <span className="text-danger">*</span></label>
                            <input
                              type="email"
                              className="form-control"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Password <span className="text-danger">*</span></label>
                            <input
                              type="password"
                              className="form-control"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              minLength="6"
                              required
                            />
                            <small className="text-muted">Minimum 6 characters</small>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                            <input
                              type="password"
                              className="form-control"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              minLength="6"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-success" disabled={loading}>
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Creating...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Create SME User
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SME Users List */}
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                {loading && !showCreateForm ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading SME users...</p>
                  </div>
                ) : smeUsers.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-people" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                    <h4 className="mt-3 mb-2">No SME Users Found</h4>
                    <p className="text-muted mb-4">
                      No SME users have been created yet. Click "Add SME User" to create the first one.
                    </p>
                    <button
                      className="btn btn-success"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Create First SME User
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
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
                            <td>
                              <span className="badge bg-primary">{user.employeeId}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="rounded-circle bg-success bg-opacity-10 p-2 me-2">
                                  <i className="bi bi-person-fill text-success"></i>
                                </div>
                                <strong>{user.name}</strong>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${user.isTerminated ? 'bg-danger' : 'bg-success'}`}>
                                {user.isTerminated ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td>
                              {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  className={`btn btn-sm ${user.isTerminated ? 'btn-success' : 'btn-warning'}`}
                                  onClick={() => handleToggleStatus(user._id, user.isTerminated)}
                                  title={user.isTerminated ? 'Activate User' : 'Deactivate User'}
                                >
                                  <i className={`bi ${user.isTerminated ? 'bi-check-circle' : 'bi-pause-circle'}`}></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => {
                                    localStorage.setItem('selectedSME', user.employeeId);
                                    router.push('/admin/sme-monitoring');
                                  }}
                                  title="View SME Details"
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

            {/* Quick Stats */}
            {smeUsers.length > 0 && (
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-people-fill" style={{ fontSize: '2rem', color: '#4CAF50' }}></i>
                      <h4 className="mt-2 mb-1">{smeUsers.length}</h4>
                      <small className="text-muted">Total SME Users</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem', color: '#28a745' }}></i>
                      <h4 className="mt-2 mb-1">{smeUsers.filter(u => !u.isTerminated).length}</h4>
                      <small className="text-muted">Active Users</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-pause-circle-fill" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
                      <h4 className="mt-2 mb-1">{smeUsers.filter(u => u.isTerminated).length}</h4>
                      <small className="text-muted">Inactive Users</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-calendar-plus" style={{ fontSize: '2rem', color: '#17a2b8' }}></i>
                      <h4 className="mt-2 mb-1">
                        {smeUsers.filter(u => {
                          const created = new Date(u.createdAt || Date.now());
                          const today = new Date();
                          const diffTime = Math.abs(today - created);
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 7;
                        }).length}
                      </h4>
                      <small className="text-muted">New This Week</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}