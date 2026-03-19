"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SMELayout from "../components/SMELayout";

export default function SMEDashboard() {
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionTime, setSessionTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkUserRole();
    fetchActiveSession();
    
    // Update session time every minute
    const interval = setInterval(() => {
      if (currentSession && currentSession.status !== 'completed') {
        updateSessionTime();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const checkUserRole = () => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") {
      router.replace("/");
    }
  };

  const fetchActiveSession = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/session?type=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        if (data.session) {
          updateSessionTime(data.session);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionTime = (session = currentSession) => {
    if (!session) return;
    
    const now = new Date();
    const loginTime = new Date(session.loginTime);
    const totalMinutes = Math.floor((now - loginTime) / (1000 * 60));
    setSessionTime(totalMinutes);
    
    // Calculate current break time
    let currentBreakMinutes = session.totalBreakTime + session.totalLunchTime;
    if (session.status === 'break' || session.status === 'lunch') {
      const currentBreak = session.breaks[session.breaks.length - 1];
      if (currentBreak && !currentBreak.endTime) {
        const breakStart = new Date(currentBreak.startTime);
        const breakMinutes = Math.floor((now - breakStart) / (1000 * 60));
        currentBreakMinutes += breakMinutes;
      }
    }
    setBreakTime(currentBreakMinutes);
  };

  const startSession = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async (action) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        setError("");
        
        if (action === 'end') {
          // Session ended, redirect or refresh
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError(`Failed to ${action} session`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'break': return '#FF9800';
      case 'lunch': return '#F44336';
      default: return '#9E9E9E';
    }
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
                <i className="bi bi-speedometer2 me-2"></i>SME Dashboard
              </h2>
              <div className="text-muted">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {!currentSession ? (
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center p-5">
                      <div className="mb-4">
                        <i className="bi bi-play-circle" style={{ fontSize: '4rem', color: '#4CAF50' }}></i>
                      </div>
                      <h4 className="mb-3">Ready to Start Your Work Session?</h4>
                      <p className="text-muted mb-4">
                        Click the button below to begin tracking your work time. 
                        Your session will automatically track breaks, lunch, and tasks.
                      </p>
                      <button 
                        className="btn btn-lg px-5"
                        onClick={startSession}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '600'
                        }}
                      >
                        <i className="bi bi-play-fill me-2"></i>
                        Start Work Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="row">
                {/* Session Status Card */}
                <div className="col-md-4 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '50px',
                            height: '50px',
                            backgroundColor: getStatusColor(currentSession.status) + '20',
                            border: `2px solid ${getStatusColor(currentSession.status)}`
                          }}
                        >
                          <i className={`bi ${
                            currentSession.status === 'active' ? 'bi-play-fill' :
                            currentSession.status === 'break' ? 'bi-pause-fill' :
                            currentSession.status === 'lunch' ? 'bi-cup-hot-fill' : 'bi-stop-fill'
                          }`} style={{ color: getStatusColor(currentSession.status), fontSize: '1.5rem' }}></i>
                        </div>
                        <div>
                          <h5 className="mb-1">Session Status</h5>
                          <span 
                            className="badge"
                            style={{ backgroundColor: getStatusColor(currentSession.status) }}
                          >
                            {currentSession.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="row text-center">
                        <div className="col-6">
                          <div className="border-end">
                            <h6 className="text-muted mb-1">Total Time</h6>
                            <strong>{formatTime(sessionTime)}</strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <h6 className="text-muted mb-1">Net Work</h6>
                          <strong>{formatTime(sessionTime - breakTime)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Controls */}
                <div className="col-md-8 mb-4">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="card-title mb-4">Session Controls</h5>
                      <div className="row g-3">
                        {currentSession.status === 'active' && (
                          <>
                            <div className="col-md-4">
                              <button 
                                className="btn btn-warning w-100"
                                onClick={() => handleSessionAction('break')}
                                disabled={loading}
                              >
                                <i className="bi bi-pause-fill me-2"></i>
                                Start Break
                              </button>
                            </div>
                            <div className="col-md-4">
                              <button 
                                className="btn btn-info w-100"
                                onClick={() => handleSessionAction('lunch')}
                                disabled={loading}
                              >
                                <i className="bi bi-cup-hot-fill me-2"></i>
                                Start Lunch
                              </button>
                            </div>
                            <div className="col-md-4">
                              <button 
                                className="btn btn-danger w-100"
                                onClick={() => handleSessionAction('end')}
                                disabled={loading}
                              >
                                <i className="bi bi-stop-fill me-2"></i>
                                End Session
                              </button>
                            </div>
                          </>
                        )}
                        
                        {(currentSession.status === 'break' || currentSession.status === 'lunch') && (
                          <div className="col-md-6 mx-auto">
                            <button 
                              className="btn btn-success w-100"
                              onClick={() => handleSessionAction('resume')}
                              disabled={loading}
                            >
                              <i className="bi bi-play-fill me-2"></i>
                              Resume Work
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="col-12">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title mb-4">Quick Actions</h5>
                      <div className="row g-3">
                        <div className="col-md-4">
                          <button 
                            className="btn btn-outline-success w-100"
                            onClick={() => router.push('/sme/tasks')}
                            disabled={currentSession.status !== 'active'}
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Task
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button 
                            className="btn btn-outline-primary w-100"
                            onClick={() => router.push('/sme/sessions')}
                          >
                            <i className="bi bi-clock-history me-2"></i>
                            View Sessions
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button 
                            className="btn btn-outline-info w-100"
                            onClick={() => router.push('/sme/tasks')}
                          >
                            <i className="bi bi-list-task me-2"></i>
                            Manage Tasks
                          </button>
                        </div>
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