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
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-display me-2"></i>
                Real-time {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Employee" : "Team"} Monitor
              </h2>
              <small className="text-muted">Last updated: {lastFetchTime || 'Never'} • Auto-refresh every 5 minutes</small>
            </div>
            <div className="d-flex flex-column align-items-end">
              <button className="btn btn-dark mb-2" onClick={fetchAllData} disabled={loading}>
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
              <small className="text-muted">
                <i className="bi bi-clock me-1"></i>
                Next refresh: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Timecards Section */}
      <div className="card mb-4 shadow-sm border-0">
        <div className="card-header bg-dark text-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Today&apos;s Timecards ({timecards.filter(tc => 
                tc.employeeId?.toLowerCase().includes(timecardSearch.toLowerCase()) ||
                tc.employeeName?.toLowerCase().includes(timecardSearch.toLowerCase())
              ).length})
            </h5>
            <div className="d-flex align-items-center">
              {showTimecardSearch ? (
                <div className="input-group" style={{width: '300px', transition: 'all 0.3s ease'}}>
                  <input
                    type="text"
                    className="form-control border-0"
                    placeholder="Search by ID or name..."
                    value={timecardSearch}
                    onChange={(e) => setTimecardSearch(e.target.value)}
                    onBlur={() => !timecardSearch && setShowTimecardSearch(false)}
                    autoFocus
                  />
                  <button 
                    className="btn btn-outline-light border-0" 
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
                  className="btn text-white" 
                  onClick={() => setShowTimecardSearch(true)}
                  style={{background: 'none', border: 'none'}}
                >
                  🔍
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading timecard data...</p>
            </div>
          ) : timecards.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover table-sm">
                <thead className="table-light">
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
                      <td>{tc.employeeId}</td>
                      <td>{tc.employeeName || 'Unknown'}</td>
                      <td>{tc.logIn || '-'}</td>
                      <td>{tc.logOut || '-'}</td>
                      <td>{tc.lunchOut || '-'}</td>
                      <td>{tc.lunchIn || '-'}</td>
                      <td>{tc.permission + 'Hr' || '-'}</td>
                      <td>{tc.reason|| '-'}</td>
                      <td>{tc.totalHours ? (() => {
                        const [h, m] = (tc.totalHours || '0:0').split(':').map(Number);
                        const hours = h + (m || 0) / 60;
                        return hours.toFixed(2) + 'h';
                      })() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-clock-history text-muted" style={{fontSize: '3rem'}}></i>
              <p className="text-muted mb-0 mt-2">No timecard data for today</p>
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
        <div className="card-header bg-dark text-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Today&apos;s Employee Tasks ({dailyTasks.filter(task => 
                task.employeeId?.toLowerCase().includes(taskSearch.toLowerCase()) ||
                task.employeeName?.toLowerCase().includes(taskSearch.toLowerCase())
              ).length})
            </h5>
            <div className="d-flex align-items-center">
              {showTaskSearch ? (
                <div className="input-group" style={{width: '300px', transition: 'all 0.3s ease'}}>
                  <input
                    type="text"
                    className="form-control border-0"
                    placeholder="Search by ID or name..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    onBlur={() => !taskSearch && setShowTaskSearch(false)}
                    autoFocus
                  />
                  <button 
                    className="btn btn-outline-light border-0" 
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
                  className="btn text-white" 
                  onClick={() => setShowTaskSearch(true)}
                  style={{background: 'none', border: 'none'}}
                >
                  🔍
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
                  <div className="border rounded p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">
                        {employeeTask.employeeName || 'Unknown'} ({employeeTask.employeeId || 'N/A'}) - {employeeTask.designation || 'N/A'}
                      </h6>
                      <small className="text-muted">Last updated: {new Date(employeeTask.updatedAt || employeeTask.createdAt).toLocaleTimeString()}</small>
                    </div>
                    {employeeTask.tasks && employeeTask.tasks.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
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
                              <tr key={taskIdx} className={task.isSaved ? '' : 'table-warning'}>
                                <td>{task.Serialno}</td>
                                <td>{task.details || <em className="text-muted">Entering...</em>}</td>
                                <td>{task.startTime || '-'}</td>
                                <td>{task.endTime || <em className="text-muted">In progress...</em>}</td>
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
                                    <span className="badge bg-success">Saved</span> : 
                                    <span className="badge bg-warning text-dark">Draft</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">No tasks added today</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-list-task text-muted" style={{fontSize: '3rem'}}></i>
              <p className="text-muted mb-0 mt-2">
                {taskSearch ? `No tasks found matching "${taskSearch}"` : 'No employee tasks found for today'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}