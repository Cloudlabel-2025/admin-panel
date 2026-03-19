"use client";

import { useState, useEffect } from "react";

export default function SMEDashboard({ selectedSME, dateFilter, onSMEChange, onDateChange }) {
  const [dashboardData, setDashboardData] = useState({
    todayStats: {},
    weekStats: {},
    monthStats: {},
    recentTasks: [],
    activeSession: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSME) {
      fetchDashboardData();
    }
  }, [selectedSME, dateFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch today's data
      const todayRes = await fetch(`/api/admin/sme?type=sessions&employeeId=${selectedSME.employeeId}&date=${dateFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch recent tasks
      const tasksRes = await fetch(`/api/admin/sme?type=tasks&employeeId=${selectedSME.employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (todayRes.ok && tasksRes.ok) {
        const todayData = await todayRes.json();
        const tasksData = await tasksRes.json();
        
        setDashboardData({
          todayStats: calculateDayStats(todayData.sessions),
          recentTasks: tasksData.tasks.slice(0, 5),
          activeSession: todayData.sessions.find(s => ['active', 'break', 'lunch'].includes(s.status))
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDayStats = (sessions) => {
    if (!sessions.length) return {};
    
    const session = sessions[0];
    return {
      totalTime: session.totalDuration || 0,
      workTime: session.netWorkingTime || 0,
      breakTime: session.totalBreakTime || 0,
      lunchTime: session.totalLunchTime || 0,
      status: session.status,
      tasksCount: session.tasks?.length || 0
    };
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'break': return 'warning';
      case 'lunch': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="row">
      {/* SME Info Card */}
      <div className="col-md-4 mb-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <i className="bi bi-person-fill text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <div>
                <h4 className="mb-1">{selectedSME.name}</h4>
                <p className="text-muted mb-0">{selectedSME.employeeId}</p>
                <small className="text-muted">{selectedSME.email}</small>
              </div>
            </div>
            
            {/* Current Status */}
            {dashboardData.activeSession && (
              <div className="alert alert-info mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-circle-fill me-2"></i>
                    Currently {dashboardData.activeSession.status}
                  </span>
                  <span className={`badge bg-${getStatusColor(dashboardData.activeSession.status)}`}>
                    LIVE
                  </span>
                </div>
              </div>
            )}
            
            {/* Overall Stats */}
            <div className="row text-center">
              <div className="col-6">
                <div className="border-end">
                  <h5 className="text-primary mb-1">{selectedSME.stats.totalSessions}</h5>
                  <small className="text-muted">Total Sessions</small>
                </div>
              </div>
              <div className="col-6">
                <h5 className="text-success mb-1">{selectedSME.stats.totalTasks}</h5>
                <small className="text-muted">Total Tasks</small>
              </div>
            </div>
            
            <hr />
            
            <div className="text-center">
              <h3 className="text-warning mb-1">{selectedSME.stats.totalWorkingHours}h</h3>
              <small className="text-muted">Total Working Hours</small>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="col-md-8 mb-4">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-header bg-transparent border-0">
            <h5 className="mb-0">
              <i className="bi bi-calendar-day me-2"></i>Today's Performance - {dateFilter}
            </h5>
          </div>
          <div className="card-body">
            {Object.keys(dashboardData.todayStats).length === 0 ? (
              <div className="text-center text-muted p-4">
                <i className="bi bi-calendar-x" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <h5 className="mt-3">No Activity Today</h5>
                <p>No session data found for {dateFilter}</p>
              </div>
            ) : (
              <>
                {/* Time Metrics */}
                <div className="row mb-4">
                  <div className="col-md-3 text-center">
                    <div className="bg-primary bg-opacity-10 rounded p-3">
                      <i className="bi bi-clock text-primary" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2 text-primary">{formatTime(dashboardData.todayStats.totalTime)}</h4>
                      <small className="text-muted">Total Time</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="bg-success bg-opacity-10 rounded p-3">
                      <i className="bi bi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2 text-success">{formatTime(dashboardData.todayStats.workTime)}</h4>
                      <small className="text-muted">Work Time</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="bg-warning bg-opacity-10 rounded p-3">
                      <i className="bi bi-pause-circle text-warning" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2 text-warning">{formatTime(dashboardData.todayStats.breakTime)}</h4>
                      <small className="text-muted">Break Time</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="bg-info bg-opacity-10 rounded p-3">
                      <i className="bi bi-cup-straw text-info" style={{ fontSize: '2rem' }}></i>
                      <h4 className="mt-2 text-info">{formatTime(dashboardData.todayStats.lunchTime)}</h4>
                      <small className="text-muted">Lunch Time</small>
                    </div>
                  </div>
                </div>

                {/* Productivity Indicator */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6>Productivity Rate</h6>
                        <div className="progress mb-2" style={{ height: '20px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ 
                              width: `${dashboardData.todayStats.totalTime > 0 ? 
                                (dashboardData.todayStats.workTime / dashboardData.todayStats.totalTime * 100) : 0}%` 
                            }}
                          ></div>
                        </div>
                        <small className="text-muted">
                          {dashboardData.todayStats.totalTime > 0 ? 
                            Math.round(dashboardData.todayStats.workTime / dashboardData.todayStats.totalTime * 100) : 0}% 
                          productive time
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h6>Session Status</h6>
                        <span className={`badge bg-${getStatusColor(dashboardData.todayStats.status)} p-2`}>
                          <i className="bi bi-circle-fill me-2"></i>
                          {dashboardData.todayStats.status?.toUpperCase() || 'INACTIVE'}
                        </span>
                        <div className="mt-2">
                          <small className="text-muted">
                            {dashboardData.todayStats.tasksCount} tasks today
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="col-12">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-0">
            <h5 className="mb-0">
              <i className="bi bi-list-task me-2"></i>Recent Tasks
            </h5>
          </div>
          <div className="card-body">
            {dashboardData.recentTasks.length === 0 ? (
              <div className="text-center text-muted p-4">
                <i className="bi bi-list-task" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <h5 className="mt-3">No Recent Tasks</h5>
                <p>No tasks found for this SME</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Task</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Time Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentTasks.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <strong>{task.title}</strong>
                          {task.description && (
                            <small className="d-block text-muted">{task.description}</small>
                          )}
                        </td>
                        <td>
                          <span className={`badge bg-${
                            task.priority === 'high' ? 'danger' : 
                            task.priority === 'medium' ? 'warning' : 'info'
                          }`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${
                            task.status === 'completed' ? 'success' : 
                            task.status === 'in-progress' ? 'primary' : 'secondary'
                          }`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td><small>{task.date}</small></td>
                        <td>
                          <small>{task.timeSpent ? formatTime(task.timeSpent) : '-'}</small>
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
    </div>
  );
}