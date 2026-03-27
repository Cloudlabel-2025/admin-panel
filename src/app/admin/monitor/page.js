"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function MonitorEmployees() {
  const router = useRouter();
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timecards, setTimecards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState("");
  const [userRole, setUserRole] = useState("");
  const [search, setSearch] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [expandedEmployee, setExpandedEmployee] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const token = localStorage.getItem("token");
    const headers = { "Cache-Control": "no-cache", Authorization: `Bearer ${token}` };

    await Promise.all([
      fetch(`/api/daily-task?admin=true&date=${today}&_t=${Date.now()}`, { cache: "no-store", headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => setDailyTasks(d ? (Array.isArray(d.tasks) ? d.tasks : Array.isArray(d) ? d : []) : []))
        .catch(() => setDailyTasks([])),

      fetch(`/api/timecard?admin=true&date=${today}&_t=${Date.now()}`, { cache: "no-store", headers })
        .then(r => r.ok ? r.json() : null)
        .then(d => setTimecards(d ? (Array.isArray(d) ? d : []) : []))
        .catch(() => setTimecards([]))
    ]);

    setLastFetchTime(new Date().toLocaleTimeString());
    setCountdown(300);
    setLoading(false);
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "developer" || role === "Team-Lead" || role === "Team-admin")) {
      router.push("/"); return;
    }
    setUserRole(role);
    fetchAllData();

    const refreshInterval = setInterval(() => { fetchAllData(); }, 300000);
    const countdownInterval = setInterval(() => setCountdown(prev => prev > 0 ? prev - 1 : 300), 1000);
    return () => { clearInterval(refreshInterval); clearInterval(countdownInterval); };
  }, [router, fetchAllData]);

  // Derive employee status from timecard
  const getStatus = (tc) => {
    if (!tc.logIn) return { label: "Not In", color: "secondary" };
    if (tc.logOut) return { label: "Logged Out", color: "danger" };
    const onBreak = (tc.breaks || []).some(b => b.breakOut && !b.breakIn);
    if (onBreak) return { label: "On Break", color: "warning" };
    if (tc.lunchOut && !tc.lunchIn) return { label: "Lunch", color: "info" };
    return { label: "Active", color: "success" };
  };

  const filteredTimecards = timecards.filter(tc =>
    tc.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    tc.employeeName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = dailyTasks.filter(t =>
    t.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeName?.toLowerCase().includes(search.toLowerCase())
  );

  const countdownPct = (countdown / 300) * 100;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-3">

        {/* ── Header ── */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <div className="me-auto">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-display me-2 text-primary"></i>
              {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Employee" : "Team"} Monitor
            </h5>
            <small className="text-muted">
              Last updated: <strong>{lastFetchTime || "—"}</strong>
            </small>
          </div>

          {/* Search */}
          <input type="text" className="form-control form-control-sm" style={{ maxWidth: 200 }}
            placeholder="Search by ID or name..." value={search}
            onChange={e => setSearch(e.target.value)} />

          {/* Refresh */}
          <button className="btn btn-sm btn-outline-primary" onClick={fetchAllData} disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-1"></span>Loading</>
              : <><i className="bi bi-arrow-clockwise me-1"></i>Refresh</>}
          </button>
        </div>

        {/* ── Countdown progress bar ── */}
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">Auto-refresh in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</small>
            <small className="text-muted">{timecards.length} timecards · {dailyTasks.length} employees with tasks</small>
          </div>
          <div className="progress" style={{ height: 4 }}>
            <div className="progress-bar bg-primary" style={{ width: `${countdownPct}%`, transition: "width 1s linear" }}></div>
          </div>
        </div>

        {/* ── Timecards table ── */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-header bg-transparent border-bottom py-2 d-flex align-items-center justify-content-between">
            <span className="fw-semibold small">
              <i className="bi bi-clock-history me-1"></i>Today&apos;s Timecards
            </span>
            <span className="badge bg-secondary">{filteredTimecards.length}</span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary"></div>
              </div>
            ) : filteredTimecards.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-clock-history" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                <p className="mt-2 mb-0">{search ? `No results for "${search}"` : "No timecard data for today"}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Punch In</th>
                      <th className="text-center">Punch Out</th>
                      <th className="text-center">Lunch</th>
                      <th className="text-center">Permission</th>
                      <th className="text-center">Total Hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimecards.map((tc, idx) => {
                      const status = getStatus(tc);
                      return (
                        <tr key={idx}>
                          <td>
                            <div className="fw-semibold">{tc.employeeName || "Unknown"}</div>
                            <code className="small text-muted">{tc.employeeId}</code>
                          </td>
                          <td className="text-center">
                            <span className={`badge bg-${status.color}`}>{status.label}</span>
                          </td>
                          <td className="text-center">
                            {tc.logIn ? <span className="badge bg-success">{tc.logIn}</span> : <span className="text-muted">—</span>}
                          </td>
                          <td className="text-center">
                            {tc.logOut ? <span className="badge bg-danger">{tc.logOut}</span> : <span className="text-muted">—</span>}
                          </td>
                          <td className="text-center">
                            <small className="text-muted">
                              {tc.lunchOut || "—"} {tc.lunchIn ? `→ ${tc.lunchIn}` : ""}
                            </small>
                          </td>
                          <td className="text-center">
                            <small>{tc.permission ? `${tc.permission}h` : "—"}</small>
                          </td>
                          <td className="text-center">
                            {tc.totalHours ? (
                              <span className="badge bg-info text-dark">
                                {(() => {
                                  const [h, m] = (tc.totalHours || "0:0").split(":").map(Number);
                                  return (h + (m || 0) / 60).toFixed(2) + "h";
                                })()}
                              </span>
                            ) : <span className="text-muted">—</span>}
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

        {/* ── Daily Tasks — expandable rows ── */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-transparent border-bottom py-2 d-flex align-items-center justify-content-between">
            <span className="fw-semibold small">
              <i className="bi bi-list-task me-1"></i>Today&apos;s Employee Tasks
            </span>
            <span className="badge bg-secondary">{filteredTasks.length}</span>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-list-task" style={{ fontSize: "2rem", opacity: 0.3 }}></i>
                <p className="mt-2 mb-0">{search ? `No results for "${search}"` : "No tasks found for today"}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th className="text-center">Tasks</th>
                      <th className="text-center">Completed</th>
                      <th className="text-center">In Progress</th>
                      <th className="text-center">Last Updated</th>
                      <th className="text-center">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((emp, idx) => {
                      const tasks = emp.tasks || [];
                      const completed = tasks.filter(t => t.status === "Completed").length;
                      const inProgress = tasks.filter(t => t.status === "In Progress").length;
                      const isExpanded = expandedEmployee === emp.employeeId;

                      return (
                        <React.Fragment key={emp.employeeId || idx}>
                          <tr style={{ cursor: "pointer" }}
                            onClick={() => setExpandedEmployee(isExpanded ? null : emp.employeeId)}>
                            <td>
                              <div className="fw-semibold">{emp.employeeName || "Unknown"}</div>
                              <code className="small text-muted">{emp.employeeId}</code>
                              {emp.designation && <span className="badge bg-light text-dark ms-1 small">{emp.designation}</span>}
                            </td>
                            <td className="text-center"><span className="badge bg-secondary">{tasks.length}</span></td>
                            <td className="text-center"><span className="badge bg-success">{completed}</span></td>
                            <td className="text-center"><span className="badge bg-warning text-dark">{inProgress}</span></td>
                            <td className="text-center">
                              <small className="text-muted">
                                {new Date(emp.updatedAt || emp.createdAt).toLocaleTimeString()}
                              </small>
                            </td>
                            <td className="text-center">
                              <i className={`bi bi-chevron-${isExpanded ? "up" : "down"} text-muted`}></i>
                            </td>
                          </tr>

                          {/* Expanded task rows */}
                          {isExpanded && tasks.length > 0 && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <div className="table-responsive bg-light">
                                  <table className="table table-sm mb-0">
                                    <thead>
                                      <tr className="table-secondary">
                                        <th style={{ paddingLeft: 32 }}>#</th>
                                        <th>Task Details</th>
                                        <th className="text-center">Start</th>
                                        <th className="text-center">End</th>
                                        <th className="text-center">Status</th>
                                        <th className="text-center">Saved</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {tasks.map((task, ti) => (
                                        <tr key={ti}>
                                          <td style={{ paddingLeft: 32 }}>
                                            <span className="badge bg-secondary">{task.Serialno}</span>
                                          </td>
                                          <td>{task.details || <em className="text-muted">Entering...</em>}</td>
                                          <td className="text-center">
                                            <span className="badge bg-success">{task.startTime || "—"}</span>
                                          </td>
                                          <td className="text-center">
                                            {task.endTime
                                              ? <span className="badge bg-danger">{task.endTime}</span>
                                              : <em className="text-muted small">In progress</em>}
                                          </td>
                                          <td className="text-center">
                                            <span className={`badge ${task.status === "Completed" ? "bg-success" : task.status === "In Progress" ? "bg-warning text-dark" : "bg-secondary"}`}>
                                              {task.status}
                                            </span>
                                          </td>
                                          <td className="text-center">
                                            {task.detailsLocked
                                              ? <span className="badge bg-success"><i className="bi bi-lock-fill me-1"></i>Saved</span>
                                              : <span className="badge bg-warning text-dark"><i className="bi bi-pencil me-1"></i>Draft</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}

                          {isExpanded && tasks.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center text-muted small py-2 bg-light">
                                No tasks added today
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
