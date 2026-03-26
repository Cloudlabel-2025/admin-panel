"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { generateSMEExcel } from "../../utilis/smeReport";

export default function SMEMonitoring() {
  const [activeTab, setActiveTab] = useState("smes");
  const [analytics, setAnalytics] = useState({});
  const [smes, setSmes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSME, setSelectedSME] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(role)) router.replace("/");
    fetchAnalytics();
    fetchSMEs();
  }, []);

  useEffect(() => {
    if (activeTab === "session") fetchSessions();
    if (activeTab === "tasks") fetchTasks();
  }, [activeTab, selectedSME, dateFilter]);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/sme?type=analytics", { headers: authHeader() });
      if (res.ok) setAnalytics((await res.json()).analytics);
    } catch (e) { console.error(e); }
  };

  const fetchSMEs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sme?type=smes", { headers: authHeader() });
      if (res.ok) setSmes((await res.json()).smes);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let url = "/api/admin/sme?type=sessions";
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      const res = await fetch(url, { headers: authHeader() });
      if (res.ok) setSessions((await res.json()).sessions);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = "/api/admin/sme?type=tasks";
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      const res = await fetch(url, { headers: authHeader() });
      if (res.ok) setTasks((await res.json()).tasks);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const formatTime = (minutes) => {
    if (!minutes) return "0h 0m";
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const statusColor = { completed: "success", active: "primary", break: "warning", lunch: "info" };
  const priorityColor = { high: "danger", medium: "warning", low: "info" };

  const switchToSession = (employeeId) => {
    setSelectedSME(employeeId);
    setActiveTab("session");
  };

  const downloadReport = async () => {
    setReportLoading(true); setReportError("");
    try {
      const [year, month] = reportMonth.split("-");
      const startDate = `${year}-${month}-01`;
      const lastDay   = new Date(year, month, 0).getDate();
      const endDate   = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      let url = `/api/admin/sme?type=report&startDate=${startDate}&endDate=${endDate}`;
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      const res = await fetch(url, { headers: authHeader() });
      if (!res.ok) { const d = await res.json(); setReportError(d.error || "Failed to generate report"); return; }
      const data = await res.json();
      const monthLabel = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
      const smeName = selectedSME
        ? (smes.find(s => s.employeeId === selectedSME)?.name || selectedSME).replace(/\s+/g, "_")
        : "All_SMEs";
      generateSMEExcel(data, `SME_Report_${smeName}_${monthLabel.replace(" ", "_")}.xlsx`);
    } catch { setReportError("Failed to generate report"); }
    finally { setReportLoading(false); }
  };

  const Spinner = () => (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status"></div>
    </div>
  );

  const EmptyState = ({ icon, text }) => (
    <div className="text-center py-5 text-muted">
      <i className={`bi bi-${icon}`} style={{ fontSize: "3rem", opacity: 0.3 }}></i>
      <p className="mt-3 mb-0">{text}</p>
    </div>
  );

  return (
    <Layout>
      <div className="container-fluid mt-3 px-2 px-md-4">

        {/* Header */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body p-3">
            <div className="row align-items-center g-2">
              <div className="col-12 col-lg-5">
                <h5 className="mb-0">
                  <i className="bi bi-people-fill me-2" style={{ color: "#d4af37" }}></i>
                  SME Monitoring
                </h5>
                <small className="text-muted">Read-only view of SME sessions and tasks</small>
              </div>
              <div className="col-12 col-lg-7">
                <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: "220px" }}
                    value={selectedSME}
                    onChange={(e) => setSelectedSME(e.target.value)}
                  >
                    <option value="">All SMEs</option>
                    {smes.map((s) => (
                      <option key={s.employeeId} value={s.employeeId}>
                        {s.name} ({s.employeeId})
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    style={{ maxWidth: "160px" }}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Generator */}
        <div className="card border-0 shadow-sm mb-3" style={{ borderLeft: "4px solid #1d6f42" }}>
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
              <div>
                <div className="fw-bold" style={{ color: "#1d6f42" }}>
                  <i className="bi bi-file-earmark-excel-fill me-2"></i>Excel Report Generator
                </div>
                <small className="text-muted">
                  Export sessions &amp; tasks for payroll — select SME (or leave blank for all) and pick a month
                </small>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <input
                  type="month"
                  className="form-control form-control-sm"
                  style={{ maxWidth: "160px" }}
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                />
                <button
                  className="btn btn-sm fw-semibold"
                  style={{ background: "#1d6f42", color: "white", minWidth: "150px" }}
                  onClick={downloadReport}
                  disabled={reportLoading}
                >
                  {reportLoading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                    : <><i className="bi bi-download me-2"></i>Download Excel</>}
                </button>
              </div>
            </div>
            {reportError && (
              <div className="mt-2 text-danger small">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>{reportError}
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="row g-2 mb-3">
          {[
            { label: "Total SMEs", value: analytics.totalSMEs || 0, icon: "people-fill", color: "#4CAF50" },
            { label: "Active Now", value: analytics.activeSessions || 0, icon: "play-circle-fill", color: "#2196F3" },
            { label: "Today's Sessions", value: analytics.todaySessions || 0, icon: "calendar-check", color: "#FF9800" },

          ].map((stat) => (
            <div key={stat.label} className="col-6 col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center py-3">
                  <i className={`bi bi-${stat.icon}`} style={{ fontSize: "1.8rem", color: stat.color }}></i>
                  <h4 className="mb-0 mt-1">{stat.value}</h4>
                  <small className="text-muted">{stat.label}</small>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body p-2">
            <ul className="nav nav-pills nav-fill mb-0">
              {[
                { key: "smes", icon: "people", label: "All SMEs" },
                { key: "session", icon: "clock-history", label: "Session & Timecard" },
                { key: "tasks", icon: "list-task", label: "Tasks" },
              ].map((tab) => (
                <li key={tab.key} className="nav-item">
                  <button
                    className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`bi bi-${tab.icon} me-2`}></i>{tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tab: All SMEs */}
        {activeTab === "smes" && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? <Spinner /> : smes.length === 0 ? (
                <EmptyState icon="people" text="No SMEs found." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th className="text-center">Sessions</th>
                        <th className="text-center">Tasks</th>
                        <th className="text-center">Hours Worked</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smes.map((sme, i) => (
                        <tr key={sme.employeeId}>
                          <td><span className="badge bg-secondary">{i + 1}</span></td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-success bg-opacity-10 p-2">
                                <i className="bi bi-person-fill text-success"></i>
                              </div>
                              <div>
                                <strong className="d-block">{sme.name}</strong>
                                <small className="text-muted">{sme.email}</small>
                              </div>
                            </div>
                          </td>
                          <td><code>{sme.employeeId}</code></td>
                          <td className="text-center">{sme.stats.totalSessions}</td>
                          <td className="text-center">{sme.stats.totalTasks}</td>
                          <td className="text-center">
                            <span className="badge bg-warning text-dark">{sme.stats.totalWorkingHours}h</span>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => switchToSession(sme.employeeId)}
                            >
                              <i className="bi bi-eye me-1"></i>View Session
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Session & Timecard */}
        {activeTab === "session" && (
          <div>
            {!selectedSME ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <EmptyState icon="person-check" text="Select an SME from the dropdown above to view their session." />
                </div>
              </div>
            ) : loading ? <Spinner /> : sessions.length === 0 ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <EmptyState icon="calendar-x" text={`No session found for ${smes.find(s => s.employeeId === selectedSME)?.name || selectedSME} on ${dateFilter}.`} />
                </div>
              </div>
            ) : (
              sessions.map((session) => {
                const productivity = session.totalDuration > 0
                  ? Math.round((session.netWorkingTime / session.totalDuration) * 100)
                  : 0;
                const smeInfo = smes.find(s => s.employeeId === session.employeeId);
                return (
                  <div key={session._id}>
                    {/* SME Info + Status */}
                    <div className="card border-0 shadow-sm mb-3">
                      <div className="card-body p-3">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle p-3" style={{ background: "linear-gradient(135deg, #1a1a1a, #000)" }}>
                              <i className="bi bi-person-fill" style={{ fontSize: "1.5rem", color: "#d4af37" }}></i>
                            </div>
                            <div>
                              <h5 className="mb-0">{session.userInfo?.name || smeInfo?.name || selectedSME}</h5>
                              <small className="text-muted">{session.employeeId} · {session.date}</small>
                            </div>
                          </div>
                          <span className={`badge bg-${statusColor[session.status] || "secondary"} fs-6 px-3 py-2`}>
                            <i className="bi bi-circle-fill me-2" style={{ fontSize: "0.5rem" }}></i>
                            {session.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Login / Logout */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="card border-success border-2 h-100">
                          <div className="card-body text-center py-3">
                            <i className="bi bi-box-arrow-in-right text-success" style={{ fontSize: "2rem" }}></i>
                            <div className="mt-2 text-success fw-bold">LOGIN</div>
                            <h5 className="mb-0">{formatDateTime(session.loginTime)}</h5>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-danger border-2 h-100">
                          <div className="card-body text-center py-3">
                            <i className="bi bi-box-arrow-right text-danger" style={{ fontSize: "2rem" }}></i>
                            <div className="mt-2 text-danger fw-bold">LOGOUT</div>
                            <h5 className="mb-0">
                              {session.logoutTime ? formatDateTime(session.logoutTime) : (
                                <span className="text-warning">Still Active</span>
                              )}
                            </h5>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Metrics */}
                    <div className="row g-3 mb-3">
                      {[
                        { label: "Total Duration", value: formatTime(session.totalDuration), color: "primary", icon: "clock" },
                        { label: "Net Work Time", value: formatTime(session.netWorkingTime), color: "success", icon: "check-circle" },
                        { label: "Break Time", value: formatTime(session.totalBreakTime), color: "warning", icon: "pause-circle" },
                        { label: "Lunch Time", value: formatTime(session.totalLunchTime), color: "info", icon: "cup-straw" },
                      ].map((m) => (
                        <div key={m.label} className="col-6 col-md-3">
                          <div className={`card border-${m.color} h-100`}>
                            <div className="card-body text-center py-3">
                              <i className={`bi bi-${m.icon} text-${m.color}`} style={{ fontSize: "1.8rem" }}></i>
                              <h4 className={`mt-2 mb-0 text-${m.color}`}>{m.value}</h4>
                              <small className="text-muted">{m.label}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Productivity Bar */}
                    <div className="card border-0 shadow-sm mb-3">
                      <div className="card-body py-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold">Productivity Rate</span>
                          <span className={`badge bg-${productivity >= 70 ? "success" : productivity >= 40 ? "warning" : "danger"}`}>
                            {productivity}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: "12px" }}>
                          <div
                            className={`progress-bar bg-${productivity >= 70 ? "success" : productivity >= 40 ? "warning" : "danger"}`}
                            style={{ width: `${productivity}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Break Timeline */}
                    {session.breaks?.length > 0 && (
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-bottom">
                          <h6 className="mb-0">
                            <i className="bi bi-pause-circle me-2"></i>Break Timeline
                          </h6>
                        </div>
                        <div className="card-body p-0">
                          <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>#</th>
                                  <th>Type</th>
                                  <th>Start</th>
                                  <th>End</th>
                                  <th>Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {session.breaks.map((b, idx) => (
                                  <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>
                                      <span className={`badge bg-${b.type === "lunch" ? "info" : "warning"} text-dark`}>
                                        <i className={`bi bi-${b.type === "lunch" ? "cup-straw" : "pause-circle"} me-1`}></i>
                                        {b.type.toUpperCase()}
                                      </span>
                                    </td>
                                    <td>{formatDateTime(b.startTime)}</td>
                                    <td>{b.endTime ? formatDateTime(b.endTime) : <span className="text-warning">Active</span>}</td>
                                    <td><strong>{formatTime(b.duration)}</strong></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Tasks (Read-only) */}
        {activeTab === "tasks" && (
          <div>
            {!selectedSME ? (
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <EmptyState icon="person-check" text="Select an SME from the dropdown above to view their tasks." />
                </div>
              </div>
            ) : (
              <>
                {/* Task Stats */}
                <div className="row g-2 mb-3">
                  {[
                    { label: "Total", value: tasks.length, color: "primary" },
                    { label: "Completed", value: tasks.filter(t => t.status === "completed").length, color: "success" },
                    { label: "In Progress", value: tasks.filter(t => t.status === "in-progress").length, color: "warning" },
                    { label: "Pending", value: tasks.filter(t => t.status === "pending").length, color: "secondary" },
                  ].map((s) => (
                    <div key={s.label} className="col-6 col-md-3">
                      <div className="card border-0 shadow-sm">
                        <div className="card-body text-center py-3">
                          <h4 className={`mb-0 text-${s.color}`}>{s.value}</h4>
                          <small className="text-muted">{s.label}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tasks Table */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">
                      <i className="bi bi-list-task me-2"></i>
                      Tasks for {smes.find(s => s.employeeId === selectedSME)?.name || selectedSME} — {dateFilter}
                    </h6>
                    <span className="badge bg-secondary">{tasks.length} tasks</span>
                  </div>
                  <div className="card-body p-0">
                    {loading ? <Spinner /> : tasks.length === 0 ? (
                      <EmptyState icon="list-task" text="No tasks found for the selected date." />
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>#</th>
                              <th>Task Title</th>
                              <th>Description</th>
                              <th className="text-center">Priority</th>
                              <th className="text-center">Status</th>
                              <th className="text-center">Date</th>
                              <th className="text-center">Created</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tasks.map((task, i) => (
                              <tr key={task._id}>
                                <td><span className="badge bg-secondary">{i + 1}</span></td>
                                <td><strong>{task.title}</strong></td>
                                <td><small className="text-muted">{task.description || "—"}</small></td>
                                <td className="text-center">
                                  <span className={`badge bg-${priorityColor[task.priority] || "secondary"}`}>
                                    {task.priority?.toUpperCase()}
                                  </span>
                                </td>
                                <td className="text-center">
                                  <span className={`badge bg-${statusColor[task.status] || "secondary"}`}>
                                    {task.status?.replace("-", " ").toUpperCase()}
                                  </span>
                                </td>
                                <td className="text-center"><small>{task.date}</small></td>
                                <td className="text-center"><small>{formatDateTime(task.createdAt)}</small></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
