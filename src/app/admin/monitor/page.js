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

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "super-admin") {
      router.push("/");
      return;
    }
    fetchAllData();
    
    // Auto-refresh every 5 minutes for real-time monitoring
    const interval = setInterval(fetchAllData, 300000); // 300000 ms = 5 minutes
    return () => clearInterval(interval);
  }, [router]);

  const fetchAllData = async () => {
    await Promise.all([fetchAllDailyTasks(), fetchAllTimecards()]);
    setLastFetchTime(new Date().toLocaleTimeString());
  };

  const fetchAllDailyTasks = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/daily-task?admin=true&date=${today}`);
      const data = await res.json();
      if (res.ok) {
        setDailyTasks(data || []);
      }
    } catch (err) {
      console.error("Error fetching daily tasks:", err);
    }
  };

  const fetchAllTimecards = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/timecard?admin=true&date=${today}`);
      const data = await res.json();
      if (res.ok) {
        setTimecards(data || []);
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Real-time Employee Monitor</h2>
        <div>
          <span className="badge bg-success me-2">Auto-refresh: 5 Min</span>
          <button className="btn btn-primary" onClick={fetchAllData} disabled={loading}>
            {loading ? "Loading..." : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Timecards Section */}
      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Today&apos;s Timecards</h5>
        </div>
        <div className="card-body">
          {timecards.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Log In</th>
                    <th>Log Out</th>
                    <th>Lunch Out</th>
                    <th>Lunch In</th>
                    <th>Permission</th>
                    <th>Reason</th>
                    <th>Total Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.map((tc, idx) => (
                    <tr key={idx}>
                      <td>{tc.employeeId}</td>
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
            <p className="text-muted mb-0">No timecard data for today</p>
          )}
        </div>
      </div>

      {/* Debug Section */}
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

      {/* Daily Tasks Section */}
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Today&apos;s Employee Tasks</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <small className="text-muted">Found {dailyTasks.length} employee task records</small>
          </div>
          {dailyTasks.length > 0 ? (
            <div className="row">
              {dailyTasks.map((employeeTask, idx) => {
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
            <div className="text-center py-4">
              <p className="text-muted mb-0">No employee tasks found for today</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}