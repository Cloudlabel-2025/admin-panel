"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import SuccessMessage from "../../components/SuccessMessage";

export default function SMEMonitoring() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analytics, setAnalytics] = useState({});
  const [smes, setSmes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSME, setSelectedSME] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" });
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkAdminRole();
    fetchAnalytics();
    fetchSMEs();
  }, []);

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    } else if (activeTab === "tasks") {
      fetchTasks();
    }
  }, [activeTab, selectedSME, dateFilter]);

  const checkAdminRole = () => {
    const role = localStorage.getItem("userRole");
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(role)) {
      router.replace("/");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/admin/sme?type=analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchSMEs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch('/api/admin/sme?type=smes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSmes(data.smes);
      }
    } catch (error) {
      console.error('Error fetching SMEs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = '/api/admin/sme?type=sessions';
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = '/api/admin/sme?type=tasks';
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      'completed': 'success',
      'active': 'primary',
      'break': 'warning',
      'lunch': 'info'
    };
    return `badge bg-${colors[status] || 'secondary'}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !selectedSME) {
      setError("Task title and SME selection are required");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          employeeId: selectedSME,
          date: dateFilter
        })
      });

      if (response.ok) {
        setNewTask({ title: "", description: "", priority: "medium" });
        setShowTaskForm(false);
        setSuccessMessage("Task added successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchTasks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add task");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error adding task:', error);
      setError("Network error. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sme/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setSuccessMessage("Task updated successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchTasks();
        setEditingTask(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update task");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError("Network error. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sme/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccessMessage("Task deleted successfully!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        fetchTasks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete task");
        setTimeout(() => setError(""), 3000);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setError("Network error. Please try again.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <Layout>
      <div className="container-fluid mt-3 px-2 px-md-4" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Success Message */}
        {showSuccess && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setShowSuccess(false)}
          />
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Header Section */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3">
                <div className="row align-items-center">
                  <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                    <h2 className="mb-1 fs-4 fs-md-3">
                      <i className="bi bi-people-fill me-2" style={{ color: '#d4af37' }}></i>
                      SME Management System
                    </h2>
                    <p className="text-muted mb-0 small">Monitor and manage SME sessions, tasks, and timecards</p>
                  </div>
                  <div className="col-12 col-lg-6 text-lg-end">
                    <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                      <select
                        className="form-select"
                        value={selectedSME}
                        onChange={(e) => setSelectedSME(e.target.value)}
                        style={{ maxWidth: '250px' }}
                      >
                        <option value="">Select SME</option>
                        {smes.map(sme => (
                          <option key={sme.employeeId} value={sme.employeeId}>
                            {sme.name} ({sme.employeeId})
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="form-control"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ maxWidth: '200px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-2">
                <ul className="nav nav-pills nav-fill mb-0">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                      onClick={() => setActiveTab('dashboard')}
                    >
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      <i className="bi bi-graph-up me-2"></i>Overview
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'smes' ? 'active' : ''}`}
                      onClick={() => setActiveTab('smes')}
                    >
                      <i className="bi bi-people me-2"></i>SMEs
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'sessions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sessions')}
                    >
                      <i className="bi bi-clock-history me-2"></i>Sessions
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tasks')}
                    >
                      <i className="bi bi-list-task me-2"></i>Task Management
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'timecard' ? 'active' : ''}`}
                      onClick={() => setActiveTab('timecard')}
                    >
                      <i className="bi bi-clock-history me-2"></i>Timecard
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Tab - SME Selection Required */}
        {activeTab === 'dashboard' && !selectedSME && (
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-5">
                  <i className="bi bi-speedometer2" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                  <h4 className="mt-3 mb-2">Select an SME</h4>
                  <p className="text-muted">Choose an SME from the dropdown above to view their dashboard and manage their activities.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab - Selected SME */}
        {activeTab === 'dashboard' && selectedSME && (
          <div className="row">
            {/* SME Info Card */}
            <div className="col-md-4 mb-4">
              <div className="card border-0 shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle p-3 me-3" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)' }}>
                      <i className="bi bi-person-fill" style={{ fontSize: '2rem', color: '#d4af37' }}></i>
                    </div>
                    <div>
                      <h4 className="mb-1">{smes.find(s => s.employeeId === selectedSME)?.name || 'SME'}</h4>
                      <p className="text-muted mb-0">{selectedSME}</p>
                      <small className="text-muted">{smes.find(s => s.employeeId === selectedSME)?.email}</small>
                    </div>
                  </div>
                  
                  <div className="row text-center mb-3">
                    <div className="col-6">
                      <div className="border-end">
                        <h5 className="text-primary mb-1">{smes.find(s => s.employeeId === selectedSME)?.stats?.totalSessions || 0}</h5>
                        <small className="text-muted">Total Sessions</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <h5 className="text-success mb-1">{smes.find(s => s.employeeId === selectedSME)?.stats?.totalTasks || 0}</h5>
                      <small className="text-muted">Total Tasks</small>
                    </div>
                  </div>
                  
                  <hr />
                  
                  <div className="text-center">
                    <h3 className="text-warning mb-1">{smes.find(s => s.employeeId === selectedSME)?.stats?.totalWorkingHours || 0}h</h3>
                    <small className="text-muted">Total Working Hours</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Session Performance */}
            <div className="col-md-8 mb-4">
              <div className="card border-0 shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
                <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-day me-2"></i>Today's Performance - {dateFilter}
                  </h5>
                </div>
                <div className="card-body p-4">
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="mt-2">Loading session data...</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center text-muted p-4">
                      <i className="bi bi-calendar-x" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5 className="mt-3">No Activity Today</h5>
                      <p>No session data found for {dateFilter}</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div key={session._id}>
                        {/* Session Status */}
                        <div className="row mb-4">
                          <div className="col-md-6">
                            <div className="card bg-light">
                              <div className="card-body text-center">
                                <h6 className="card-title">
                                  <i className="bi bi-circle-fill me-2" style={{ color: getStatusColor(session.status) === 'success' ? '#28a745' : getStatusColor(session.status) === 'primary' ? '#007bff' : getStatusColor(session.status) === 'warning' ? '#ffc107' : '#17a2b8' }}></i>
                                  Session Status
                                </h6>
                                <span className={`badge bg-${getStatusColor(session.status)} p-2`}>
                                  {session.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="card bg-light">
                              <div className="card-body text-center">
                                <h6 className="card-title">Session Time</h6>
                                <small className="text-muted d-block">
                                  {formatDateTime(session.loginTime)} - {
                                    session.logoutTime ? formatDateTime(session.logoutTime) : 'Active'
                                  }
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Time Metrics */}
                        <div className="row">
                          <div className="col-md-3 text-center mb-3">
                            <div className="bg-primary bg-opacity-10 rounded p-3">
                              <i className="bi bi-clock text-primary" style={{ fontSize: '2rem' }}></i>
                              <h4 className="mt-2 text-primary">{formatTime(session.totalDuration)}</h4>
                              <small className="text-muted">Total Time</small>
                            </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                            <div className="bg-success bg-opacity-10 rounded p-3">
                              <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                              <h4 className="mt-2 text-success">{formatTime(session.netWorkingTime)}</h4>
                              <small className="text-muted">Work Time</small>
                            </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                            <div className="bg-warning bg-opacity-10 rounded p-3">
                              <i className="bi bi-pause-circle text-warning" style={{ fontSize: '2rem' }}></i>
                              <h4 className="mt-2 text-warning">{formatTime(session.totalBreakTime)}</h4>
                              <small className="text-muted">Break Time</small>
                            </div>
                          </div>
                          <div className="col-md-3 text-center mb-3">
                            <div className="bg-info bg-opacity-10 rounded p-3">
                              <i className="bi bi-cup-straw text-info" style={{ fontSize: '2rem' }}></i>
                              <h4 className="mt-2 text-info">{formatTime(session.totalLunchTime)}</h4>
                              <small className="text-muted">Lunch Time</small>
                            </div>
                          </div>
                        </div>

                        {/* Productivity Indicator */}
                        <div className="mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="small">Productivity Rate</span>
                            <span className="badge bg-primary">
                              {session.totalDuration > 0 ? 
                                Math.round(session.netWorkingTime / session.totalDuration * 100) : 0}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '20px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ 
                                width: `${session.totalDuration > 0 ? 
                                  (session.netWorkingTime / session.totalDuration * 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="row">
                <div className="col-md-3 mb-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-people-fill" style={{ fontSize: '2.5rem', color: '#4CAF50' }}></i>
                      <h3 className="mt-2 mb-1">{analytics.totalSMEs || 0}</h3>
                      <small className="text-muted">Total SMEs</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-play-circle-fill" style={{ fontSize: '2.5rem', color: '#2196F3' }}></i>
                      <h3 className="mt-2 mb-1">{analytics.activeSessions || 0}</h3>
                      <small className="text-muted">Active Sessions</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-clock-fill" style={{ fontSize: '2.5rem', color: '#FF9800' }}></i>
                      <h3 className="mt-2 mb-1">{analytics.totalWorkingHours || 0}h</h3>
                      <small className="text-muted">Total Working Hours</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-4">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', color: '#4CAF50' }}></i>
                      <h3 className="mt-2 mb-1">{analytics.taskCompletionRate || 0}%</h3>
                      <small className="text-muted">Task Completion</small>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <div className="row">
                    <div className="col-md-4 mb-4">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title">Today's Activity</h5>
                          <div className="d-flex justify-content-between">
                            <span>Sessions:</span>
                            <strong>{analytics.todaySessions || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-4">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title">This Week</h5>
                          <div className="d-flex justify-content-between">
                            <span>Sessions:</span>
                            <strong>{analytics.weekSessions || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4 mb-4">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <h5 className="card-title">This Month</h5>
                          <div className="d-flex justify-content-between">
                            <span>Sessions:</span>
                            <strong>{analytics.monthSessions || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SMEs Tab */}
            {activeTab === 'smes' && (
              <div className="row">
                {loading ? (
                  <div className="col-12 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : smes.length === 0 ? (
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center p-5">
                        <i className="bi bi-people" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                        <h4 className="mt-3 mb-2">No SMEs Found</h4>
                        <p className="text-muted">No SME users have been created yet.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  smes.map((sme) => (
                    <div key={sme.employeeId} className="col-md-6 col-lg-4 mb-4">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-3">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                              <i className="bi bi-person-fill text-success"></i>
                            </div>
                            <div>
                              <h5 className="mb-1">{sme.name}</h5>
                              <small className="text-muted">{sme.employeeId}</small>
                            </div>
                          </div>
                          
                          <div className="row text-center mb-3">
                            <div className="col-6">
                              <div className="border-end">
                                <strong className="d-block">{sme.stats.totalSessions}</strong>
                                <small className="text-muted">Sessions</small>
                              </div>
                            </div>
                            <div className="col-6">
                              <strong className="d-block">{sme.stats.totalTasks}</strong>
                              <small className="text-muted">Tasks</small>
                            </div>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {sme.stats.totalWorkingHours}h worked
                            </small>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => {
                                setSelectedSME(sme.employeeId);
                                setActiveTab('sessions');
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="row">
                {loading ? (
                  <div className="col-12 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center p-5">
                        <i className="bi bi-clock-history" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                        <h4 className="mt-3 mb-2">No Sessions Found</h4>
                        <p className="text-muted">No work sessions found for the selected criteria.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session._id} className="col-md-6 col-lg-4 mb-4">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">{session.userInfo?.name || 'Unknown'}</h6>
                              <small className="text-muted">{session.userInfo?.employeeId}</small>
                            </div>
                            <span className={getStatusBadge(session.status)}>
                              {session.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="mb-3">
                            <small className="text-muted d-block">Date: {session.date}</small>
                            <small className="text-muted d-block">
                              {formatDateTime(session.loginTime)} - {
                                session.logoutTime ? formatDateTime(session.logoutTime) : 'Active'
                              }
                            </small>
                          </div>

                          <div className="row text-center">
                            <div className="col-4">
                              <strong className="d-block text-primary">
                                {formatTime(session.totalDuration)}
                              </strong>
                              <small className="text-muted">Total</small>
                            </div>
                            <div className="col-4">
                              <strong className="d-block text-warning">
                                {formatTime(session.totalBreakTime + session.totalLunchTime)}
                              </strong>
                              <small className="text-muted">Breaks</small>
                            </div>
                            <div className="col-4">
                              <strong className="d-block text-success">
                                {formatTime(session.netWorkingTime)}
                              </strong>
                              <small className="text-muted">Net Work</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

        {/* Enhanced Task Management Tab */}
        {activeTab === 'tasks' && (
          <div className="row">
            {/* Task Management Header */}
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm" style={{ border: '2px solid #d4af37' }}>
                <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-list-task me-2"></i>Task Management
                    </h5>
                    <button 
                      className="btn btn-warning"
                      onClick={() => setShowTaskForm(!showTaskForm)}
                      disabled={!selectedSME}
                    >
                      <i className="bi bi-plus-circle me-2"></i>Add New Task
                    </button>
                  </div>
                </div>
                <div className="card-body p-3">
                  {!selectedSME ? (
                    <div className="text-center text-muted p-4">
                      <i className="bi bi-person-plus" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                      <h5 className="mt-3">Select an SME</h5>
                      <p>Choose an SME from the dropdown to manage their tasks.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      <div className="col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="fs-5 fw-bold text-primary">{tasks.length}</div>
                          <small className="text-muted">Total Tasks</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="fs-5 fw-bold text-success">{tasks.filter(t => t.status === 'completed').length}</div>
                          <small className="text-muted">Completed</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="fs-5 fw-bold text-warning">{tasks.filter(t => t.status === 'in-progress').length}</div>
                          <small className="text-muted">In Progress</small>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="text-center p-3 bg-light rounded">
                          <div className="fs-5 fw-bold text-secondary">{tasks.filter(t => t.status === 'pending').length}</div>
                          <small className="text-muted">Pending</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Task Form */}
            {showTaskForm && selectedSME && (
              <div className="col-12 mb-4">
                <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                      <i className="bi bi-plus-circle me-2"></i>Add New Task
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Task Title *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          placeholder="Enter task title"
                          maxLength={100}
                        />
                        <small className="text-muted">{newTask.title.length}/100 characters</small>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Priority</label>
                        <select
                          className="form-select"
                          value={newTask.priority}
                          onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-bold">Description</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Task description (optional)"
                          maxLength={200}
                        />
                        <small className="text-muted">{newTask.description.length}/200 characters</small>
                      </div>
                    </div>
                    <div className="mt-3 d-flex gap-2">
                      <button
                        className="btn btn-success"
                        onClick={addTask}
                        disabled={!newTask.title.trim()}
                      >
                        <i className="bi bi-check-circle me-2"></i>Save Task
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowTaskForm(false);
                          setNewTask({ title: "", description: "", priority: "medium" });
                        }}
                      >
                        <i className="bi bi-x-circle me-2"></i>Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Table */}
            {selectedSME && (
              <div className="col-12">
                <div className="card border-0 shadow-sm" style={{ border: '2px solid #d4af37' }}>
                  <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                    <h5 className="mb-0">
                      <i className="bi bi-table me-2"></i>Tasks for {dateFilter}
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    {loading ? (
                      <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"></div>
                        <p className="mt-2">Loading tasks...</p>
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center text-muted p-5">
                        <i className="bi bi-list-task" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
                        <h4 className="mt-3">No Tasks Found</h4>
                        <p>No tasks found for the selected date. Add a new task to get started.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '1000px' }}>
                          <thead className="table-dark text-center">
                            <tr>
                              <th scope="col" style={{ minWidth: '60px' }}>S.No</th>
                              <th scope="col" style={{ minWidth: '250px' }}>Task Title</th>
                              <th scope="col" style={{ minWidth: '200px' }}>Description</th>
                              <th scope="col" style={{ minWidth: '120px' }}>Priority</th>
                              <th scope="col" style={{ minWidth: '150px' }}>Status</th>
                              <th scope="col" style={{ minWidth: '200px' }}>SME</th>
                              <th scope="col" style={{ minWidth: '100px' }}>Date</th>
                              <th scope="col" style={{ minWidth: '150px' }}>Created</th>
                              <th scope="col" style={{ minWidth: '120px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task, index) => (
                              <tr key={task._id}>
                                <td className="text-center">
                                  <span className="badge bg-secondary">{index + 1}</span>
                                </td>
                                <td>
                                  {editingTask === task._id ? (
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      defaultValue={task.title}
                                      onBlur={(e) => updateTask(task._id, { title: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          updateTask(task._id, { title: e.target.value });
                                        }
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <strong>{task.title}</strong>
                                  )}
                                </td>
                                <td>
                                  <small className="text-muted">{task.description || '-'}</small>
                                </td>
                                <td className="text-center">
                                  <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                                    {task.priority.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={task.status}
                                    onChange={(e) => updateTask(task._id, { status: e.target.value })}
                                    style={{ minWidth: '120px' }}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                                      <i className="bi bi-person-fill text-primary"></i>
                                    </div>
                                    <div>
                                      <small>
                                        <strong>{task.userInfo?.name || 'Unknown'}</strong><br/>
                                        <span className="text-muted">({task.userInfo?.employeeId})</span>
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td><small>{task.date}</small></td>
                                <td><small>{formatDateTime(task.createdAt)}</small></td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => setEditingTask(editingTask === task._id ? null : task._id)}
                                      title="Edit Task"
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-outline-danger"
                                      onClick={() => deleteTask(task._id)}
                                      title="Delete Task"
                                    >
                                      <i className="bi bi-trash"></i>
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
            )}
          </div>
        )}

            {/* Enhanced Timecard Tab */}
            {activeTab === 'timecard' && (
              <div className="row">
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0">
                      <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>Timecard Details - {dateFilter}
                      </h5>
                    </div>
                    <div className="card-body">
                      {loading ? (
                        <div className="text-center">
                          <div className="spinner-border text-primary" role="status"></div>
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="text-center text-muted p-5">
                          <i className="bi bi-clock-history" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                          <h4 className="mt-3">No Timecard Data</h4>
                          <p>No session data found for the selected date and SME.</p>
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <div key={session._id}>
                            {/* Login/Logout Timeline */}
                            <div className="row mb-4">
                              <div className="col-md-6">
                                <div className="card bg-success bg-opacity-10 border-success">
                                  <div className="card-body text-center">
                                    <i className="bi bi-box-arrow-in-right text-success" style={{ fontSize: '2rem' }}></i>
                                    <h5 className="mt-2 text-success">LOGIN</h5>
                                    <h4>{formatDateTime(session.loginTime)}</h4>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="card bg-danger bg-opacity-10 border-danger">
                                  <div className="card-body text-center">
                                    <i className="bi bi-box-arrow-right text-danger" style={{ fontSize: '2rem' }}></i>
                                    <h5 className="mt-2 text-danger">LOGOUT</h5>
                                    <h4>
                                      {session.logoutTime ? formatDateTime(session.logoutTime) : (
                                        <span className="text-warning">Still Active</span>
                                      )}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Break Timeline */}
                            {session.breaks && session.breaks.length > 0 && (
                              <div className="mb-4">
                                <h5 className="mb-3">
                                  <i className="bi bi-pause-circle me-2"></i>Break Timeline
                                </h5>
                                <div className="row">
                                  {session.breaks.map((breakItem, index) => (
                                    <div key={index} className="col-md-6 mb-3">
                                      <div className={`card border-${breakItem.type === 'lunch' ? 'info' : 'warning'}`}>
                                        <div className="card-header bg-transparent">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <span className={`badge bg-${breakItem.type === 'lunch' ? 'info' : 'warning'}`}>
                                              <i className={`bi bi-${breakItem.type === 'lunch' ? 'cup-straw' : 'pause-circle'} me-1`}></i>
                                              {breakItem.type.toUpperCase()}
                                            </span>
                                            <strong>{formatTime(breakItem.duration)}</strong>
                                          </div>
                                        </div>
                                        <div className="card-body">
                                          <div className="row text-center">
                                            <div className="col-6">
                                              <small className="text-muted d-block">Break In</small>
                                              <strong>{formatDateTime(breakItem.startTime)}</strong>
                                            </div>
                                            <div className="col-6">
                                              <small className="text-muted d-block">Break Out</small>
                                              <strong>
                                                {breakItem.endTime ? formatDateTime(breakItem.endTime) : (
                                                  <span className="text-warning">Active</span>
                                                )}
                                              </strong>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Time Summary */}
                            <div className="row">
                              <div className="col-md-3 mb-3">
                                <div className="card border-primary text-center">
                                  <div className="card-body">
                                    <i className="bi bi-clock text-primary" style={{ fontSize: '2.5rem' }}></i>
                                    <h3 className="mt-2 text-primary">{formatTime(session.totalDuration)}</h3>
                                    <small className="text-muted">Total Duration</small>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 mb-3">
                                <div className="card border-warning text-center">
                                  <div className="card-body">
                                    <i className="bi bi-pause-circle text-warning" style={{ fontSize: '2.5rem' }}></i>
                                    <h3 className="mt-2 text-warning">{formatTime(session.totalBreakTime)}</h3>
                                    <small className="text-muted">Break Time</small>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 mb-3">
                                <div className="card border-info text-center">
                                  <div className="card-body">
                                    <i className="bi bi-cup-straw text-info" style={{ fontSize: '2.5rem' }}></i>
                                    <h3 className="mt-2 text-info">{formatTime(session.totalLunchTime)}</h3>
                                    <small className="text-muted">Lunch Time</small>
                                  </div>
                                </div>
                              </div>
                              <div className="col-md-3 mb-3">
                                <div className="card border-success text-center">
                                  <div className="card-body">
                                    <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }}></i>
                                    <h3 className="mt-2 text-success">{formatTime(session.netWorkingTime)}</h3>
                                    <small className="text-muted">Net Working Time</small>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Session Status */}
                            <div className="text-center mt-3">
                              <span className={`badge bg-${getStatusBadge(session.status).split(' ')[1]} p-3`} style={{ fontSize: '1.1rem' }}>
                                <i className="bi bi-circle-fill me-2"></i>
                                Session Status: {session.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>
    </Layout>
  );
}