"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function MonitorEmployees() {
  const router = useRouter();
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timecards, setTimecards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState('');
  const [userRole, setUserRole] = useState('');
  const [timecardSearch, setTimecardSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [showTimecardSearch, setShowTimecardSearch] = useState(false);
  const [showTaskSearch, setShowTaskSearch] = useState(false);
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "Team-Lead" || role === "Team-admin")) {
      router.push("/");
      return;
    }
    setUserRole(role);
    fetchAllData();
    
    // Auto-refresh every 5 minutes for real-time monitoring
    const refreshInterval = setInterval(() => {
      fetchAllData();
      setCountdown(300);
    }, 300000);
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 300);
    }, 1000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [router]);

  const fetchAllData = async () => {
    await Promise.all([fetchAllDailyTasks(), fetchAllTimecards()]);
    setLastFetchTime(new Date().toLocaleTimeString());
    setCountdown(300);
  };

  const fetchAllDailyTasks = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const userRole = localStorage.getItem("userRole");
      const empId = localStorage.getItem("employeeId");
      
      let url = `/api/daily-task?admin=true&date=${today}&_t=${Date.now()}`;
      
      // For team roles, add department filter
      if ((userRole === "Team-Lead" || userRole === "Team-admin") && empId) {
        const token = localStorage.getItem('token');
        const userRes = await fetch(`/api/Employee/${empId}?_t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          url += `&department=${userData.department}`;
        }
      }
      
      const token = localStorage.getItem('token');
      console.log('Fetching daily tasks from URL:', url);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Daily tasks response status:', res.status);
      const data = await res.json();
      console.log('Daily tasks response data:', data);
      if (res.ok) {
        setDailyTasks(Array.isArray(data) ? data : []);
      } else {
        console.error('Daily tasks API error - Status:', res.status, 'Data:', data);
        setDailyTasks([]);
      }
    } catch (err) {
      console.error("Error fetching daily tasks:", err);
    }
  };

  const fetchAllTimecards = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const userRole = localStorage.getItem("userRole");
      const empId = localStorage.getItem("employeeId");
      const employeeName = localStorage.getItem("name");
      
      let url = `/api/timecard?admin=true&date=${today}&_t=${Date.now()}`;
      
      // For team roles, add department filter
      if ((userRole === "Team-Lead" || userRole === "Team-admin") && empId) {
        const token = localStorage.getItem('token');
        const userRes = await fetch(`/api/Employee/${empId}?_t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          url += `&department=${userData.department}`;
        }
      }
      
      const token = localStorage.getItem('token');
      console.log('Fetching timecards from URL:', url);
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Timecard response status:', res.status);
      const data = await res.json();
      console.log('Timecard response data:', data);
      if (res.ok) {
        setTimecards(Array.isArray(data) ? data : []);
      } else {
        console.error('Timecards API error - Status:', res.status, 'Data:', data);
        setTimecards([]);
      }
    } catch (err) {
      console.error("Error fetching timecards:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB");
  };

  return (
    <Layout>
      <div className="card border-0 shadow-sm mb-4" style={{background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)'}}>
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="mb-1 text-white">
                <i className="bi bi-display me-2"></i>
                Real-time {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Employee" : "Team"} Monitor
              </h2>
              <small style={{ color: '#d4af37' }}><i className="bi bi-clock-history me-1"></i>Last updated: {lastFetchTime || 'Never'}</small>
            </div>
            <div className="d-flex flex-column align-items-end">
              <button className="btn btn-light mb-2 refresh-btn" onClick={fetchAllData} disabled={loading} style={{ transition: 'all 0.3s ease' }}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh Now
                  </>
                )}
              </button>
              <small style={{ color: '#d4af37' }}>
                <i className="bi bi-clock me-1"></i>
                Next refresh: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Timecards Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-header text-white border-0" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)'}}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Today&apos;s Timecards <span className="badge bg-light text-dark ms-2">{timecards.filter(tc => 
                tc.employeeId?.toLowerCase().includes(timecardSearch.toLowerCase()) ||
                tc.employeeName?.toLowerCase().includes(timecardSearch.toLowerCase())
              ).length}</span>
            </h5>
            <div className="d-flex align-items-center">
              {showTimecardSearch ? (
                <div className="input-group" style={{width: '250px', transition: 'all 0.3s ease'}}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by ID or name..."
                    value={timecardSearch}
                    onChange={(e) => setTimecardSearch(e.target.value)}
                    onBlur={() => !timecardSearch && setShowTimecardSearch(false)}
                    autoFocus
                  />
                  <button 
                    className="btn btn-outline-light btn-sm" 
                    onClick={() => {
                      setTimecardSearch('');
                      setShowTimecardSearch(false);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-light btn-sm" 
                  onClick={() => setShowTimecardSearch(true)}
                >
                  <i className="bi bi-search"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading timecard data...</p>
            </div>
          ) : timecards.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-dark">
                  <tr>
                    <th><i className="bi bi-person-badge me-1"></i>Employee ID</th>
                    <th><i className="bi bi-person me-1"></i>Employee Name</th>
                    <th><i className="bi bi-box-arrow-in-right me-1"></i>Log In</th>
                    <th><i className="bi bi-box-arrow-right me-1"></i>Log Out</th>
                    <th><i className="bi bi-cup-hot me-1"></i>Lunch Out</th>
                    <th><i className="bi bi-cup-hot-fill me-1"></i>Lunch In</th>
                    <th><i className="bi bi-clock me-1"></i>Permission</th>
                    <th><i className="bi bi-chat-text me-1"></i>Reason</th>
                    <th><i className="bi bi-stopwatch me-1"></i>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.filter(tc => 
                    tc.employeeId?.toLowerCase().includes(timecardSearch.toLowerCase()) ||
                    tc.employeeName?.toLowerCase().includes(timecardSearch.toLowerCase())
                  ).map((tc, idx) => (
                    <tr key={idx}>
                      <td><span className="badge bg-secondary">{tc.employeeId}</span></td>
                      <td className="fw-semibold">{tc.employeeName || 'Unknown'}</td>
                      <td><span className="badge bg-success">{tc.logIn || '-'}</span></td>
                      <td><span className="badge bg-danger">{tc.logOut || '-'}</span></td>
                      <td>{tc.lunchOut || '-'}</td>
                      <td>{tc.lunchIn || '-'}</td>
                      <td>{tc.permission ? tc.permission + 'Hr' : '-'}</td>
                      <td><small className="text-muted">{tc.reason|| '-'}</small></td>
                      <td><span className="badge bg-info text-dark">{tc.totalHours ? (() => {
                        const [h, m] = (tc.totalHours || '0:0').split(':').map(Number);
                        const hours = h + (m || 0) / 60;
                        return hours.toFixed(2) + 'h';
                      })() : '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-clock-history text-muted" style={{fontSize: '4rem'}}></i>
              <p className="text-muted mb-0 mt-3">No timecard data for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Debug Section - Commented out for production 
      <div className="card mb-3">
        <div className="card-header bg-warning text-dark">
          <h6 className="mb-0">Debug Info</h6>
        </div>
        <div className="card-body">
          <small>
            <strong>Daily Tasks Count:</strong> {dailyTasks.length}<br/>
            <strong>Timecards Count:</strong> {timecards.length}<br/>
            <strong>Last Fetch:</strong> {lastFetchTime || 'Not fetched yet'}
          </small>
          {dailyTasks.length > 0 && (
            <details className="mt-2">
              <summary>Raw Daily Tasks Data</summary>
              <pre className="small mt-2" style={{maxHeight: '200px', overflow: 'auto'}}>
                {JSON.stringify(dailyTasks, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      */}

      {/* Daily Tasks Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header text-white border-0" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)'}}>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <h5 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Today&apos;s Employee Tasks <span className="badge bg-light text-dark ms-2">{dailyTasks.filter(task => 
                task.employeeId?.toLowerCase().includes(taskSearch.toLowerCase()) ||
                task.employeeName?.toLowerCase().includes(taskSearch.toLowerCase())
              ).length}</span>
            </h5>
            <div className="d-flex align-items-center">
              {showTaskSearch ? (
                <div className="input-group" style={{width: '250px', transition: 'all 0.3s ease'}}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by ID or name..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    onBlur={() => !taskSearch && setShowTaskSearch(false)}
                    autoFocus
                  />
                  <button 
                    className="btn btn-outline-light btn-sm" 
                    onClick={() => {
                      setTaskSearch('');
                      setShowTaskSearch(false);
                    }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-light btn-sm" 
                  onClick={() => setShowTaskSearch(true)}
                >
                  <i className="bi bi-search"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body">
          {dailyTasks.filter(task => 
            task.employeeId?.toLowerCase().includes(taskSearch.toLowerCase()) ||
            task.employeeName?.toLowerCase().includes(taskSearch.toLowerCase())
          ).length > 0 ? (
            <div className="row">
              {dailyTasks.filter(task => 
                task.employeeId?.toLowerCase().includes(taskSearch.toLowerCase()) ||
                task.employeeName?.toLowerCase().includes(taskSearch.toLowerCase())
              ).map((employeeTask, idx) => {
                return (
                <div key={idx} className="col-12 mb-3">
                  <div className="border rounded p-3" style={{borderRadius: '8px', background: '#f8f9fa'}}>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
                      <h6 className="mb-0 text-dark">
                        <i className="bi bi-person-circle me-2 text-primary"></i>
                        <span className="fw-bold">{employeeTask.employeeName || 'Unknown'}</span> 
                        <span className="badge bg-secondary ms-2">{employeeTask.employeeId || 'N/A'}</span>
                        <span className="badge bg-info text-dark ms-2">{employeeTask.designation || 'N/A'}</span>
                      </h6>
                      <small className="text-muted"><i className="bi bi-clock me-1"></i>Last updated: {new Date(employeeTask.updatedAt || employeeTask.createdAt).toLocaleTimeString()}</small>
                    </div>
                    {employeeTask.tasks && employeeTask.tasks.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>#</th>
                              <th>Task Details</th>
                              <th>Start Time</th>
                              <th>End Time</th>
                              <th>Status</th>
                              <th>Saved</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeTask.tasks.map((task, taskIdx) => (
                              <tr key={taskIdx} style={{background: task.isSaved ? '#fff' : '#fff3cd'}}>
                                <td><span className="badge bg-secondary">{task.Serialno}</span></td>
                                <td>{task.details || <em className="text-muted">Entering...</em>}</td>
                                <td><span className="badge bg-success">{task.startTime || '-'}</span></td>
                                <td>{task.endTime ? <span className="badge bg-danger">{task.endTime}</span> : <em className="text-muted">In progress...</em>}</td>
                                <td>
                                  <span className={`badge ${
                                    task.status === 'Completed' ? 'bg-success' :
                                    task.status === 'In Progress' ? 'bg-warning text-dark' : 'bg-secondary'
                                  }`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td>
                                  {task.isSaved ? 
                                    <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Saved</span> : 
                                    <span className="badge bg-warning text-dark"><i className="bi bi-pencil me-1"></i>Draft</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0 text-center py-3"><i className="bi bi-inbox me-2"></i>No tasks added today</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-list-task text-muted" style={{fontSize: '4rem'}}></i>
              <p className="text-muted mb-0 mt-3">
                {taskSearch ? `No tasks found matching "${taskSearch}"` : 'No employee tasks found for today'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Add styles
const styles = `
  .refresh-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%) !important;
    color: #000 !important;
    border-color: #d4af37 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}