"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SMELayout from "../../components/SMELayout";
import { apiFetch } from "../../utilis/apiFetch";

export default function SMEReport() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [error, setError]  = useState("");
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") router.replace("/");
  }, []);

  useEffect(() => { fetchReport(); }, [selectedDate]);

  const fetchReport = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiFetch(
        `/api/sme/session?type=report&startDate=${selectedDate}&endDate=${selectedDate}`
      );
      if (!res.ok) { setError("Failed to load report"); setData(null); return; }
      setData(await res.json());
    } catch { setError("Failed to load report"); setData(null); }
    finally { setLoading(false); }
  };

  const downloadExcel = async () => {
    setDlLoading(true);
    try {
      const XLSX = await import("xlsx");
      const empName = (localStorage.getItem("userName") || "SME").replace(/\s+/g, "_");
      const empId   = localStorage.getItem("employeeId") || data.employeeId;
      const wb = XLSX.utils.book_new();

      const fmt     = (m) => m != null && m !== "" ? `${Math.floor(m / 60)}h ${m % 60}m` : "—";
      const fmtT    = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
      const fmtFull = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
      const s = data.summary;
      const allSess = data.sessions;

      // ── Sheet 1: Day Summary ──────────────────────────────────────────────
      const summaryRows = [
        ["SME Daily Work Report"],
        [""],
        ["Employee ID",       empId],
        ["Employee Name",     localStorage.getItem("userName") || empId],
        ["Date",              selectedDate],
        ["Generated On",      new Date().toLocaleString()],
        [""],
        ["── DAY TIMING SUMMARY ──"],
        ["Sessions",          allSess.length],
        ["First Login",       allSess[0] ? fmtT(allSess[0].loginTime) : "—"],
        ["Last Logout",       allSess[allSess.length - 1]?.logoutTime ? fmtT(allSess[allSess.length - 1].logoutTime) : "Still Active"],
        ["Total Time",        fmt(s.grandTotalDur)],
        ["Break + Lunch",     fmt(s.grandTotalBreak)],
        ["Net Working Time",  fmt(s.grandTotalNet)],
        ["Net Working Hours", `${s.grandTotalNetHours} hrs`],
        [""],
        ["── TASK SUMMARY ──"],
        ["Total Tasks",       s.totalTasks],
        ["Completed",         s.completedTasks],
        ["In Progress",       data.tasks.filter(t => t.status === "in-progress").length],
        ["Pending",           data.tasks.filter(t => t.status === "pending").length],
        ["Completion Rate",   s.totalTasks > 0 ? `${Math.round(s.completedTasks / s.totalTasks * 100)}%` : "0%"],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 22 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Day Summary");

      // ── Sheet 2: Login-Logout History ─────────────────────────────────────
      const loginHeaders = ["S.No", "Login Time", "Logout Time", "Total Duration", "Break Time", "Lunch Time", "Net Working", "Net Hours", "Status"];
      const loginRows = allSess.map((s, i) => [
        i + 1,
        fmtT(s.loginTime),
        s.logoutTime ? fmtT(s.logoutTime) : "Still Active",
        fmt(s.totalDuration),
        fmt(s.totalBreakTime || 0),
        fmt(s.totalLunchTime || 0),
        fmt(s.netWorkingTime),
        +((s.netWorkingTime || 0) / 60).toFixed(2),
        s.status.toUpperCase(),
      ]);
      loginRows.push([
        "TOTAL", "", "",
        fmt(s.grandTotalDur),
        fmt(allSess.reduce((a, x) => a + (x.totalBreakTime || 0), 0)),
        fmt(allSess.reduce((a, x) => a + (x.totalLunchTime || 0), 0)),
        fmt(s.grandTotalNet),
        s.grandTotalNetHours,
        "",
      ]);
      const wsLogin = XLSX.utils.aoa_to_sheet([loginHeaders, ...loginRows]);
      wsLogin["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, wsLogin, "Login-Logout History");

      // ── Sheet 3: Task Details ─────────────────────────────────────────────
      const taskHeaders = ["T.No", "Task Title", "Description", "Status", "Start Time", "End Time", "Time Spent (mins)"];
      const taskRows = data.tasks.map((t, i) => [
        i + 1,
        t.title,
        t.description || "",
        t.status.replace("-", " ").toUpperCase(),
        t.startTime ? fmtT(t.startTime) : "—",
        t.endTime   ? fmtT(t.endTime)   : "—",
        t.timeSpent || 0,
      ]);
      // Task stats totals at bottom
      taskRows.push([]);
      taskRows.push(["TOTAL TASKS", data.tasks.length, "", "", "", "", ""]);
      taskRows.push(["COMPLETED",   s.completedTasks,  "", "", "", "", ""]);
      taskRows.push(["IN PROGRESS", data.tasks.filter(t => t.status === "in-progress").length, "", "", "", "", ""]);
      taskRows.push(["PENDING",     data.tasks.filter(t => t.status === "pending").length,     "", "", "", "", ""]);
      const wsTasks = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]);
      wsTasks["!cols"] = [{ wch: 6 }, { wch: 34 }, { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsTasks, "Task Details");

      // ── Sheet 4: Break Timeline ───────────────────────────────────────────
      const hasBreaks = allSess.some(s => s.breaks?.length > 0);
      if (hasBreaks) {
        const breakHeaders = ["S.No", "Session", "Type", "Start Time", "End Time", "Duration"];
        const breakRows = allSess.flatMap((s, si) =>
          (s.breaks || []).map((b, idx) => [
            idx + 1,
            `Session ${si + 1}  (${fmtT(s.loginTime)} – ${s.logoutTime ? fmtT(s.logoutTime) : "Active"})`,
            b.type.toUpperCase(),
            fmtT(b.startTime),
            b.endTime ? fmtT(b.endTime) : "Active",
            fmt(b.duration),
          ])
        );
        // Break totals
        const totalBreakMins = allSess.reduce((a, x) => a + (x.totalBreakTime || 0), 0);
        const totalLunchMins = allSess.reduce((a, x) => a + (x.totalLunchTime || 0), 0);
        breakRows.push([]);
        breakRows.push(["TOTAL BREAK TIME", "", "", "", "", fmt(totalBreakMins)]);
        breakRows.push(["TOTAL LUNCH TIME", "", "", "", "", fmt(totalLunchMins)]);
        breakRows.push(["TOTAL BREAK+LUNCH", "", "", "", "", fmt(totalBreakMins + totalLunchMins)]);
        const wsBreaks = XLSX.utils.aoa_to_sheet([breakHeaders, ...breakRows]);
        wsBreaks["!cols"] = [{ wch: 6 }, { wch: 36 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsBreaks, "Break Timeline");
      }

      XLSX.writeFile(wb, `SME_Report_${empName}_${selectedDate}.xlsx`);
    } catch (e) { console.error(e); }
    finally { setDlLoading(false); }
  };

  const fmt    = (m) => m ? `${Math.floor(m / 60)}h ${m % 60}m` : "—";
  const fmtT   = (d) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";
  const session = data?.sessions?.[0];
  const allSessions = data?.sessions || [];

  const statusStyle = (s) => {
    const m = { completed: { bg: "#f0fdf4", color: "#065f46" }, "in-progress": { bg: "#ede9fe", color: "#4c1d95" }, pending: { bg: "#f9fafb", color: "#6b7280" } };
    return { ...(m[s] || m.pending), padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" };
  };

return (
    <SMELayout>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <h1 className="sme-page-title"><i className="bi bi-file-earmark-bar-graph me-2"></i>Daily Report</h1>
          <p style={{ color: "#8b5cf6", fontSize: "14px", margin: "4px 0 0" }}>View your work details and download as Excel</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ border: "1px solid #ddd6fe", borderRadius: "7px", padding: "8px 14px", fontSize: "14px", color: "#4c1d95", background: "#faf5ff", outline: "none" }}
          />
          {data && !loading && (
            <button
              onClick={downloadExcel}
              disabled={dlLoading}
              className="sme-btn"
              style={{ background: "#1d6f42", color: "white", fontWeight: "600" }}
            >
              {dlLoading
                ? <><span className="sme-spinner" style={{ width: "14px", height: "14px", borderWidth: "2px", borderColor: "white", borderTopColor: "transparent" }}></span>Generating...</>
                : <><i className="bi bi-file-earmark-excel-fill"></i>Download Excel</>}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px" }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <div className="sme-spinner"></div>
        </div>
      ) : !data || (data.sessions.length === 0 && data.tasks.length === 0) ? (
        <div style={{ background: "white", border: "1px solid #ddd6fe", borderRadius: "10px", padding: "60px 20px", textAlign: "center" }}>
          <i className="bi bi-calendar-x" style={{ fontSize: "40px", color: "#c4b5fd" }}></i>
          <p style={{ color: "#6d28d9", fontWeight: "600", marginTop: "12px", marginBottom: "4px" }}>No data for this date</p>
          <p style={{ color: "#a78bfa", fontSize: "13px" }}>No sessions or tasks were recorded on {selectedDate}.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Timing Summary (aggregated across all sessions) ── */}
          {allSessions.length > 0 && (
            <div className="sme-panel">
              <div className="sme-panel-header">
                <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                  <i className="bi bi-clock me-2" style={{ color: "#7c3aed" }}></i>Day Timing Summary
                </span>
                <span style={{ fontSize: "13px", color: "#8b5cf6" }}>
                  {allSessions.length} session{allSessions.length !== 1 ? "s" : ""} today
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {[
                  { label: "Sessions",     value: allSessions.length,                                                                                    color: "#4c1d95" },
                  { label: "First Login",  value: fmtT(allSessions[0]?.loginTime),                                                                       color: "#065f46" },
                  { label: "Last Logout",  value: allSessions[allSessions.length - 1]?.logoutTime ? fmtT(allSessions[allSessions.length - 1].logoutTime) : "Still Active", color: "#dc2626" },
                  { label: "Total Time",   value: fmt(data.summary.grandTotalDur),                                                                        color: "#4c1d95" },
                  { label: "Break+Lunch",  value: fmt(data.summary.grandTotalBreak),                                                                      color: "#92400e" },
                  { label: "Net Working",  value: fmt(data.summary.grandTotalNet),                                                                        color: "#065f46" },
                  { label: "Net Hours",    value: `${data.summary.grandTotalNetHours} hrs`,                                                               color: "#4c1d95" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="sme-stat-cell">
                    <div className="sme-stat-label">{label}</div>
                    <div className="sme-stat-value" style={{ color, fontSize: "20px" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Login / Logout History ── */}
          {allSessions.length > 0 && (
            <div className="sme-panel">
              <div className="sme-panel-header">
                <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                  <i className="bi bi-arrow-left-right me-2" style={{ color: "#7c3aed" }}></i>Login / Logout History
                </span>
                <span style={{ fontSize: "13px", color: "#8b5cf6" }}>{allSessions.length} entr{allSessions.length !== 1 ? "ies" : "y"}</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="sme-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Total</th>
                      <th>Break</th>
                      <th>Lunch</th>
                      <th>Net Working</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSessions.map((s, i) => (
                      <tr key={s._id}>
                        <td style={{ color: "#a78bfa", fontWeight: "600", fontSize: "13px" }}>{i + 1}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "14px", color: "#065f46", fontWeight: "600" }}>{fmtT(s.loginTime)}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "14px", color: s.logoutTime ? "#dc2626" : "#f59e0b", fontWeight: "600" }}>
                          {s.logoutTime ? fmtT(s.logoutTime) : <span style={{ color: "#f59e0b" }}>Still Active</span>}
                        </td>
                        <td style={{ color: "#4c1d95", fontWeight: "600" }}>{fmt(s.totalDuration)}</td>
                        <td style={{ color: "#92400e" }}>{fmt(s.totalBreakTime || 0)}</td>
                        <td style={{ color: "#075985" }}>{fmt(s.totalLunchTime || 0)}</td>
                        <td style={{ color: "#065f46", fontWeight: "700" }}>{fmt(s.netWorkingTime)}</td>
                        <td>
                          <span style={{
                            background: s.status === "completed" ? "#f0fdf4" : "#ede9fe",
                            color:      s.status === "completed" ? "#065f46" : "#4c1d95",
                            padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase"
                          }}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tasks Table ── */}
          <div className="sme-panel">
            <div className="sme-panel-header">
              <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                <i className="bi bi-list-task me-2" style={{ color: "#7c3aed" }}></i>Tasks
              </span>
              <span style={{ fontSize: "13px", color: "#8b5cf6" }}>{data.tasks.length} task{data.tasks.length !== 1 ? "s" : ""}</span>
            </div>

            {data.tasks.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#a78bfa" }}>
                <i className="bi bi-inbox" style={{ fontSize: "32px" }}></i>
                <p style={{ marginTop: "10px", marginBottom: 0 }}>No tasks recorded for this date.</p>
              </div>
            ) : (
              <>
                {/* Task stats row */}
                <div className="sme-stat-row" style={{ borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }}>
                  {[
                    { label: "Total",       value: data.tasks.length,                                          color: "#4c1d95" },
                    { label: "Completed",   value: data.tasks.filter(t => t.status === "completed").length,    color: "#065f46" },
                    { label: "In Progress", value: data.tasks.filter(t => t.status === "in-progress").length,  color: "#7c3aed" },
                    { label: "Pending",     value: data.tasks.filter(t => t.status === "pending").length,      color: "#6b7280" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="sme-stat-cell" style={{ padding: "12px 20px" }}>
                      <div className="sme-stat-label">{label}</div>
                      <div className="sme-stat-value" style={{ color, fontSize: "22px" }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="sme-table">
                    <thead>
                      <tr>
                        <th>T.No</th>
                        <th>Task Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Time Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tasks.map((task, i) => (
                        <tr key={task._id}>
                          <td style={{ color: "#a78bfa", fontWeight: "600", fontSize: "13px" }}>{i + 1}</td>
                          <td style={{ fontWeight: "600", color: "#1e1b4b", maxWidth: "220px" }}>{task.title}</td>
                          <td style={{ color: "#6b7280", fontSize: "13px", maxWidth: "260px" }}>{task.description || "—"}</td>
                          <td><span style={statusStyle(task.status)}>{task.status}</span></td>
                          <td style={{ fontSize: "13px", color: "#6b7280", fontFamily: "monospace" }}>
                            {task.startTime ? new Date(task.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ fontSize: "13px", color: "#6b7280", fontFamily: "monospace" }}>
                            {task.endTime ? new Date(task.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={{ fontSize: "13px", color: "#4c1d95", fontWeight: "600" }}>
                            {task.timeSpent ? `${task.timeSpent} min` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* ── Break Timeline (all sessions) ── */}
          {allSessions.some(s => s.breaks?.length > 0) && (
            <div className="sme-panel">
              <div className="sme-panel-header">
                <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                  <i className="bi bi-pause-circle me-2" style={{ color: "#7c3aed" }}></i>Break Timeline
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="sme-table">
                  <thead>
                    <tr><th>S.No</th><th>Session</th><th>Type</th><th>Start</th><th>End</th><th>Duration</th></tr>
                  </thead>
                  <tbody>
                    {allSessions.flatMap((s, si) =>
                      (s.breaks || []).map((b, idx) => (
                        <tr key={`${si}-${idx}`}>
                          <td style={{ color: "#a78bfa", fontWeight: "600" }}>{idx + 1}</td>
                          <td style={{ color: "#8b5cf6", fontSize: "13px" }}>Session {si + 1}</td>
                          <td>
                            <span style={{ background: b.type === "lunch" ? "#e0f2fe" : "#fef3c7", color: b.type === "lunch" ? "#075985" : "#92400e", padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>
                              {b.type}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: "14px" }}>{fmtT(b.startTime)}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "14px" }}>{b.endTime ? fmtT(b.endTime) : <span style={{ color: "#f59e0b" }}>Active</span>}</td>
                          <td style={{ fontWeight: "600", color: "#4c1d95" }}>{fmt(b.duration)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </SMELayout>
  );
}
