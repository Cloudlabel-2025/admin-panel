"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SMELayout from "../../components/SMELayout";

export default function SMESessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
    fetchSessions();
  }, [selectedDate]);

  const checkUserRole = () => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") {
      router.replace("/");
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = '/api/sme/session?type=history';
      if (selectedDate) {
        url += `&date=${selectedDate}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  if (loading) {
    return (
      <SMELayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </SMELayout>
    );
  }

  return (
    <SMELayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0" style={{ color: '#2c5530', fontWeight: '700' }}>
                <i className="bi bi-clock-history me-2"></i>My Sessions
              </h2>
              <div className="d-flex gap-2">
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => setSelectedDate("")}
                >
                  Clear
                </button>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-5">
                  <i className="bi bi-clock" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                  <h4 className="mt-3 mb-2">No Sessions Found</h4>
                  <p className="text-muted">
                    {selectedDate ? 'No sessions found for the selected date.' : 'You haven\'t started any work sessions yet.'}
                  </p>
                  <button 
                    className="btn btn-success"
                    onClick={() => router.push('/sme')}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Start New Session
                  </button>
                </div>
              </div>
            ) : (
              <div className="row">
                {sessions.map((session) => (
                  <div key={session._id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <h5 className="card-title mb-0">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </h5>
                          <span className={getStatusBadge(session.status)}>
                            {session.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="row text-center mb-3">
                          <div className="col-6">
                            <div className="border-end">
                              <small className="text-muted d-block">Login</small>
                              <strong>{formatDateTime(session.loginTime)}</strong>
                            </div>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Logout</small>
                            <strong>
                              {session.logoutTime ? formatDateTime(session.logoutTime) : 'Active'}
                            </strong>
                          </div>
                        </div>

                        <div className="row text-center mb-3">
                          <div className="col-4">
                            <small className="text-muted d-block">Total</small>
                            <strong className="text-primary">
                              {formatTime(session.totalDuration)}
                            </strong>
                          </div>
                          <div className="col-4">
                            <small className="text-muted d-block">Breaks</small>
                            <strong className="text-warning">
                              {formatTime(session.totalBreakTime + session.totalLunchTime)}
                            </strong>
                          </div>
                          <div className="col-4">
                            <small className="text-muted d-block">Net Work</small>
                            <strong className="text-success">
                              {formatTime(session.netWorkingTime)}
                            </strong>
                          </div>
                        </div>

                        {session.breaks && session.breaks.length > 0 && (
                          <div className="mb-3">
                            <small className="text-muted d-block mb-2">Break Details:</small>
                            {session.breaks.map((breakItem, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                                <span className={`badge ${breakItem.type === 'lunch' ? 'bg-info' : 'bg-warning'}`}>
                                  {breakItem.type}
                                </span>
                                <small>
                                  {formatDateTime(breakItem.startTime)} - {
                                    breakItem.endTime ? formatDateTime(breakItem.endTime) : 'Active'
                                  }
                                </small>
                                <small className="text-muted">
                                  {formatTime(breakItem.duration)}
                                </small>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="bi bi-list-task me-1"></i>
                            {session.tasks ? session.tasks.length : 0} tasks
                          </small>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => router.push(`/sme/tasks?sessionId=${session._id}`)}
                          >
                            View Tasks
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Statistics */}
            {sessions.length > 0 && (
              <div className="card border-0 shadow-sm mt-4">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-graph-up me-2"></i>
                    Summary Statistics
                  </h5>
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-primary mb-1">{sessions.length}</h4>
                        <small className="text-muted">Total Sessions</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-success mb-1">
                          {formatTime(sessions.reduce((sum, s) => sum + (s.totalDuration || 0), 0))}
                        </h4>
                        <small className="text-muted">Total Hours</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-warning mb-1">
                          {formatTime(sessions.reduce((sum, s) => sum + (s.totalBreakTime || 0) + (s.totalLunchTime || 0), 0))}
                        </h4>
                        <small className="text-muted">Total Breaks</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-info mb-1">
                          {formatTime(sessions.reduce((sum, s) => sum + (s.netWorkingTime || 0), 0))}
                        </h4>
                        <small className="text-muted">Net Working</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SMELayout>
  );
}