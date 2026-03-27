"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Layout from "../../components/Layout";
import { generateSMEExcel } from "../../utilis/smeReport";

function SMEMonitoringContent() {
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
  const [expandedBreaks, setExpandedBreaks] = useState({});
  const router = useRouter();
  const searchParams = useSearchParams();

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
  const fmt = (m) => m ? `${Math.floor(m / 60)}h ${m % 60}m` : "0h 0m";
  const fmtDT = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sme?type=analytics", { headers: authHeader() });
      if (res.ok) setAnalytics((await res.json()).analytics);
    } catch {}
  }, []);

  const fetchSMEs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sme?type=smes", { headers: authHeader() });
      if (res.ok) setSmes((await res.json()).smes);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/admin/sme?type=sessions";
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      const res = await fetch(url, { headers: authHeader() });
      if (res.ok) setSessions((await res.json()).sessions);
    } catch {} finally { setLoading(false); }
  }, [selectedSME, dateFilter]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/admin/sme?type=tasks";
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      const res = await fetch(url, { headers: authHeader() });
      if (res.ok) setTasks((await res.json()).tasks);
    } catch {} finally { setLoading(false); }
  }, [selectedSME, dateFilter]);

  // On mount: read URL param, fetch analytics + SMEs
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const adminRoles = ["super-admin", "Super-admin", "admin", "developer", "Team-Lead", "Team-admin"];
    if (!adminRoles.includes(role)) { router.replace("/"); return; }
    const smeParam = searchParams.get("sme");
    if (smeParam) { setSelectedSME(smeParam); setActiveTab("session"); }
    fetchAnalytics();
    fetchSMEs();
  }, [router, searchParams, fetchAnalytics, fetchSMEs]);

  // Fetch tab data when tab / filters change
  useEffect(() => {
    if (activeTab === "session") fetchSessions();
    if (activeTab === "tasks") fetchTasks();
  }, [activeTab, fetchSessions, fetchTasks]);

  const downloadReport = async () => {
    setReportLoading(true); setReportError("");
    try {
      const [year, month] = reportMonth.split("-");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
      let url = `/api/admin/sme?type=report&startDate=${startDate}&endDate=${endDate}`;
      if (selectedSME) url += `&employeeId=${selectedSME}`;
      const res = await fetch(url, { headers: authHeader() });
      if (!res.ok) { const d = await res.json(); setReportError(d.error || "Failed"); return; }
      const data = await res.json();
      const monthLabel = new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
      const smeName = selectedSME
        ? (smes.find(s => s.employeeId === selectedSME)?.name || selectedSME).replace(/\s+/g, "_")
        : "All_SMEs";
      generateSMEExcel(data, `SME_Report_${smeName}_${monthLabel.replace(" ", "_")}.xlsx`);
    } catch { setReportError("Failed to generate report"); }
    finally { setReportLoading(false); }
  };

  const statusBadge = { completed: "success", active: "primary", break: "warning", lunch: "info" };

  const Spinner = () => (
    <div className="text-center py-5">
      <div className="spinner-border spinner-border-sm text-primary"></div>
    </div>
  );

  const Empty = ({ icon, text }) => (
    <div className="text-center py-5 text-muted">
      <i className={`bi bi-${icon}`} style={{ fontSize: "2.5rem", opacity: 0.3 }}></i>
      <p className="mt-2 mb-0 small">{text}</p>
    </div>
  );

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-3">

        {/* ── Header toolbar ── */}
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <div className="me-auto">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-people-fill me-2 text-primary"></i>SME Monitoring
            </h5>
            <small className="text-muted">Read-only view of SME sessions and tasks</small>
          </div>

          {/* Filters */}
          <select className="form-select form-select-sm" style={{ maxWidth: 200 }}
            value={selectedSME} onChange={e => setSelectedSME(e.target.value)}>
            <option value="">All SMEs</option>
            {smes.map(s => (
              <option key={s.employeeId} value={s.employeeId}>{s.name} ({s.employeeId})</option>
            ))}
          </select>
          <input type="date" className="form-control form-control-sm" style={{ maxWidth: 150 }}
            value={dateFilter} onChange={e => setDateFilter(e.target.value)} />

          {/* Report download — inline in toolbar */}
          <input type="month" className="form-control form-control-sm" style={{ maxWidth: 140 }}
            value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
          <button className="btn btn-sm fw-semibold" style={{ background: "#1d6f42", color: "white", whiteSpace: "nowrap" }}
            onClick={downloadReport} disabled={reportLoading}>
            {reportLoading
              ? <><span className="spinner-border spinner-border-sm me-1"></span>Generating...</>
              : <><i className="bi bi-file-earmark-excel-fill me-1"></i>Excel</>}
          </button>
        </div>

        {reportError && (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>{reportError}
          </div>
        )}

        {/* ── Stats strip ── */}
        <div className="d-flex gap-4 mb-3 px-1">
          {[
            { label: "Total SMEs", value: analytics.totalSMEs || 0, color: "#4CAF50" },
            { label: "Active Now", value: analytics.activeSessions || 0, color: "#2196F3" },
            { label: "Today's Sessions", value: analytics.todaySessions || 0, color: "#FF9800" },
          ].map(s => (
            <div key={s.label}>
              <span className="fw-bold fs-5" style={{ color: s.color }}>{s.value}</span>
              <span className="text-muted small ms-1">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <ul className="nav nav-tabs mb-3">
          {[
            { key: "smes", icon: "people", label: "All SMEs" },
            { key: "session", icon: "clock-history", label: "Sessions" },
            { key: "tasks", icon: "list-task", label: "Tasks" },
          ].map(tab => (
            <li key={tab.key} className="nav-item">
              <button className={`nav-link py-2 px-3 ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}>
                <i className={`bi bi-${tab.icon} me-1`}></i>{tab.label}
              </button>
            </li>
          ))}
        </ul>

        {/* ── Tab: All SMEs ── */}
        {activeTab === "smes" && (
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {loading ? <Spinner /> : smes.length === 0 ? <Empty icon="people" text="No SMEs found." /> : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Employee ID</th>
                        <th className="text-center">Sessions</th>
                        <th className="text-center">Tasks</th>
                        <th className="text-center">Hours</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smes.map((sme, i) => (
                        <tr key={sme.employeeId}>
                          <td><span className="badge bg-secondary">{i + 1}</span></td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-success bg-opacity-10 p-1">
                                <i className="bi bi-person-fill text-success"></i>
                              </div>
                              <div>
                                <strong className="d-block">{sme.name}</strong>
                                <small className="text-muted">{sme.email}</small>
                              </div>
                            </div>
                          </td>
                          <td><code className="bg-light px-2 py-1 rounded">{sme.employeeId}</code></td>
                          <td className="text-center">{sme.stats.totalSessions}</td>
                          <td className="text-center">{sme.stats.totalTasks}</td>
                          <td className="text-center">
                            <span className="badge bg-warning text-dark">{sme.stats.totalWorkingHours}h</span>
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary"
                              onClick={() => { setSelectedSME(sme.employeeId); setActiveTab("session"); }}>
                              <i className="bi bi-eye me-1"></i>Sessions
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

        {/* ── Tab: Sessions ── */}
        {activeTab === "session" && (
          <>
            {!selectedSME ? (
              <Empty icon="person-check" text="Select an SME from the dropdown to view sessions." />
            ) : loading ? <Spinner /> : sessions.length === 0 ? (
              <Empty icon="calendar-x" text={`No session found for ${smes.find(s => s.employeeId === selectedSME)?.name || selectedSME} on ${dateFilter}.`} />
            ) : (
              sessions.map((session) => {
                const productivity = session.totalDuration > 0
                  ? Math.round((session.netWorkingTime / session.totalDuration) * 100) : 0;
                const prodColor = productivity >= 70 ? "success" : productivity >= 40 ? "warning" : "danger";
                const smeInfo = smes.find(s => s.employeeId === session.employeeId);
                const hasBreaks = session.breaks?.length > 0;

                return (
                  <div key={session._id} className="card border-0 shadow-sm mb-3">
                    <div className="card-body p-3">

                      {/* Row 1: Name + Status */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <strong>{session.userInfo?.name || smeInfo?.name || selectedSME}</strong>
                          <span className="text-muted small ms-2">{session.employeeId} · {session.date}</span>
                        </div>
                        <span className={`badge bg-${statusBadge[session.status] || "secondary"}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Row 2: Login → Logout | time metrics inline */}
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-3 p-2 rounded" style={{ background: "#f8f9fa" }}>
                        <div className="text-center">
                          <div className="text-success fw-bold small">LOGIN</div>
                          <div className="fw-semibold">{fmtDT(session.loginTime)}</div>
                        </div>
                        <i className="bi bi-arrow-right text-muted"></i>
                        <div className="text-center">
                          <div className="text-danger fw-bold small">LOGOUT</div>
                          <div className="fw-semibold">
                            {session.logoutTime ? fmtDT(session.logoutTime) : <span className="text-warning">Active</span>}
                          </div>
                        </div>
                        <div className="vr mx-1"></div>
                        {[
                          { label: "Total", value: fmt(session.totalDuration), color: "text-primary" },
                          { label: "Net Work", value: fmt(session.netWorkingTime), color: "text-success" },
                          { label: "Break", value: fmt(session.totalBreakTime), color: "text-warning" },
                          { label: "Lunch", value: fmt(session.totalLunchTime), color: "text-info" },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <div className={`fw-bold ${m.color}`}>{m.value}</div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Row 3: Productivity bar */}
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted" style={{ minWidth: 90 }}>Productivity</small>
                        <div className="progress flex-grow-1" style={{ height: 8 }}>
                          <div className={`progress-bar bg-${prodColor}`} style={{ width: `${productivity}%` }}></div>
                        </div>
                        <span className={`badge bg-${prodColor}`} style={{ minWidth: 42 }}>{productivity}%</span>
                      </div>

                      {/* Row 4: Break timeline (collapsible) */}
                      {hasBreaks && (
                        <div className="mt-3">
                          <button className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                            onClick={() => setExpandedBreaks(prev => ({ ...prev, [session._id]: !prev[session._id] }))}>
                            <i className={`bi bi-chevron-${expandedBreaks[session._id] ? "up" : "down"} me-1`}></i>
                            {session.breaks.length} break{session.breaks.length > 1 ? "s" : ""}
                          </button>
                          {expandedBreaks[session._id] && (
                            <div className="table-responsive mt-2">
                              <table className="table table-sm align-middle mb-0">
                                <thead className="table-light">
                                  <tr><th>#</th><th>Type</th><th>Start</th><th>End</th><th>Duration</th></tr>
                                </thead>
                                <tbody>
                                  {session.breaks.map((b, idx) => (
                                    <tr key={idx}>
                                      <td>{idx + 1}</td>
                                      <td>
                                        <span className={`badge bg-${b.type === "lunch" ? "info" : "warning"} text-dark`}>
                                          {b.type.toUpperCase()}
                                        </span>
                                      </td>
                                      <td>{fmtDT(b.startTime)}</td>
                                      <td>{b.endTime ? fmtDT(b.endTime) : <span className="text-warning">Active</span>}</td>
                                      <td><strong>{fmt(b.duration)}</strong></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── Tab: Tasks ── */}
        {activeTab === "tasks" && (
          <>
            {!selectedSME ? (
              <Empty icon="person-check" text="Select an SME from the dropdown to view tasks." />
            ) : (
              <>
                {/* Inline task stats */}
                {tasks.length > 0 && (
                  <div className="d-flex gap-3 mb-3 px-1">
                    <span className="text-muted small">Total: <strong>{tasks.length}</strong></span>
                    <span className="text-success small">Completed: <strong>{tasks.filter(t => t.status === "completed").length}</strong></span>
                    <span className="text-warning small">In Progress: <strong>{tasks.filter(t => t.status === "in-progress").length}</strong></span>
                    <span className="text-secondary small">Pending: <strong>{tasks.filter(t => t.status === "pending").length}</strong></span>
                  </div>
                )}

                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-2">
                    <span className="fw-semibold small">
                      <i className="bi bi-list-task me-1"></i>
                      {smes.find(s => s.employeeId === selectedSME)?.name || selectedSME} — {dateFilter}
                    </span>
                    <span className="badge bg-secondary">{tasks.length}</span>
                  </div>
                  <div className="card-body p-0">
                    {loading ? <Spinner /> : tasks.length === 0 ? (
                      <Empty icon="list-task" text="No tasks found for the selected date." />
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="table-dark">
                            <tr>
                              <th>#</th>
                              <th>Task Title</th>
                              <th>Description</th>
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
                                  <span className={`badge bg-${statusBadge[task.status] || "secondary"}`}>
                                    {task.status?.replace("-", " ").toUpperCase()}
                                  </span>
                                </td>
                                <td className="text-center"><small>{task.date}</small></td>
                                <td className="text-center"><small>{fmtDT(task.createdAt)}</small></td>
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
          </>
        )}

      </div>
    </Layout>
  );
}

export default function SMEMonitoring() {
  return (
    <Suspense fallback={<Layout><div className="text-center py-5"><div className="spinner-border text-primary"></div></div></Layout>}>
      <SMEMonitoringContent />
    </Suspense>
  );
}
