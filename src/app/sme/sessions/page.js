"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import SMELayout from "../../components/SMELayout";
import { apiFetch } from "../../utilis/apiFetch";

export default function SMESessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const router = useRouter();

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/sme/session?type=history";
      if (selectedDate) url += `&date=${selectedDate}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") router.replace("/");
    fetchSessions();
  }, [router, fetchSessions]);

  const fmt = (mins) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60), m = mins % 60;
    return `${h}h ${m}m`;
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  const statusStyle = (status) => {
    const map = {
      completed: { background: "#ede9fe", color: "#5b21b6" },
      active:    { background: "#ddd6fe", color: "#4c1d95" },
      break:     { background: "#fef3c7", color: "#92400e" },
      lunch:     { background: "#e0f2fe", color: "#075985" },
    };
    return {
      ...( map[status] || { background: "#f3f4f6", color: "#374151" }),
      padding: "4px 12px", borderRadius: "20px", fontSize: "13px",
      fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase",
    };
  };

  const totalWork = sessions.reduce((s, x) => s + (x.netWorkingTime || 0), 0);
  const totalDur  = sessions.reduce((s, x) => s + (x.totalDuration || 0), 0);
  const totalBreak = sessions.reduce((s, x) => s + (x.totalBreakTime || 0) + (x.totalLunchTime || 0), 0);

  return (
    <SMELayout>
      <style>{`
        .sessions-table th { font-size: 13px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; color: #7c3aed; border-bottom: 2px solid #ddd6fe; padding: 12px 16px; background: #f5f3ff; }
        .sessions-table td { font-size: 15px; padding: 14px 16px; border-bottom: 1px solid #ede9fe; vertical-align: middle; color: #374151; }
        .sessions-table tr:last-child td { border-bottom: none; }
        .sessions-table tr:hover td { background: #faf5ff; }
        .stat-item { padding: 0 24px; border-right: 1px solid #ddd6fe; }
        .stat-item:last-child { border-right: none; }
        .date-input { border: 1px solid #ddd6fe; border-radius: 6px; padding: 7px 14px; font-size: 14px; color: #4c1d95; background: #faf5ff; outline: none; }
        .date-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,0.15); }
        .clear-btn { border: 1px solid #ddd6fe; border-radius: 6px; padding: 7px 16px; font-size: 14px; background: white; color: #6d28d9; cursor: pointer; }
        .clear-btn:hover { background: #ede9fe; }
        .view-btn { border: 1px solid #c4b5fd; border-radius: 6px; padding: 6px 14px; font-size: 13px; background: white; color: #6d28d9; cursor: pointer; font-weight: 500; }
        .view-btn:hover { background: #ede9fe; }
      `}</style>

      <div>

      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h4 style={{ color: "#4c1d95", fontWeight: "700", margin: 0, fontSize: "24px" }}>
              <i className="bi bi-clock-history me-2" style={{ color: "#7c3aed" }}></i>My Sessions
            </h4>
            <p style={{ color: "#8b5cf6", fontSize: "15px", margin: "4px 0 0" }}>
              Track your work sessions, breaks, and productivity
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="date"
              className="date-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button className="clear-btn" onClick={() => setSelectedDate("")}>
                <i className="bi bi-x me-1"></i>Clear
              </button>
            )}
          </div>
        </div>
      </div>

      </div>

      {/* Summary Strip */}
      {sessions.length > 0 && (
        <div style={{
          background: "white",
          border: "1px solid #ddd6fe",
          borderRadius: "8px",
          padding: "16px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0",
        }}>
          <div className="stat-item">
            <div style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sessions</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#4c1d95", lineHeight: 1.2 }}>{sessions.length}</div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Duration</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#4c1d95", lineHeight: 1.2 }}>{fmt(totalDur)}</div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Break Time</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#92400e", lineHeight: 1.2 }}>{fmt(totalBreak)}</div>
          </div>
          <div className="stat-item">
            <div style={{ fontSize: "13px", color: "#8b5cf6", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Net Working</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#065f46", lineHeight: 1.2 }}>{fmt(totalWork)}</div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div style={{ background: "white", border: "1px solid #ddd6fe", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #ede9fe", background: "#faf5ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "16px" }}>
            <i className="bi bi-table me-2" style={{ color: "#7c3aed" }}></i>
            Session History
            {selectedDate && <span style={{ fontSize: "12px", color: "#8b5cf6", marginLeft: "8px" }}>— {new Date(selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
          </span>
          <span style={{ fontSize: "14px", color: "#8b5cf6" }}>{sessions.length} record{sessions.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div className="spinner-border" style={{ color: "#7c3aed", width: "28px", height: "28px" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ color: "#8b5cf6", marginTop: "12px", fontSize: "15px" }}>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <i className="bi bi-calendar-x" style={{ fontSize: "40px", color: "#c4b5fd" }}></i>
            <p style={{ color: "#6d28d9", fontWeight: "600", marginTop: "12px", marginBottom: "4px" }}>No sessions found</p>
            <p style={{ color: "#a78bfa", fontSize: "15px", marginBottom: "20px" }}>
              {selectedDate ? "No sessions recorded for this date." : "You haven’t started any sessions yet."}
            </p>
            <button
              onClick={() => router.push("/sme")}
              style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "white", border: "none", borderRadius: "6px", padding: "10px 22px", fontSize: "15px", cursor: "pointer", fontWeight: "500" }}
            >
              <i className="bi bi-plus-circle me-2"></i>Start a Session
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sessions-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Login</th>
                  <th>Logout</th>
                  <th>Total</th>
                  <th>Breaks</th>
                  <th>Net Work</th>
                  <th>Tasks</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: "#a78bfa", fontWeight: "600", fontSize: "14px" }}>{i + 1}</td>
                    <td style={{ fontWeight: "600", color: "#4c1d95" }}>{fmtDate(s.date)}</td>
                    <td><span style={statusStyle(s.status)}>{s.status}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: "15px" }}>{fmtTime(s.loginTime)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "15px" }}>{fmtTime(s.logoutTime)}</td>
                    <td style={{ fontWeight: "600", color: "#4c1d95" }}>{fmt(s.totalDuration)}</td>
                    <td style={{ color: "#92400e" }}>{fmt((s.totalBreakTime || 0) + (s.totalLunchTime || 0))}</td>
                    <td style={{ fontWeight: "600", color: "#065f46" }}>{fmt(s.netWorkingTime)}</td>
                    <td>
                      <span style={{ background: "#ede9fe", color: "#5b21b6", borderRadius: "20px", padding: "3px 12px", fontSize: "14px", fontWeight: "600" }}>
                        {s.tasks?.length || 0}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => router.push(`/sme/tasks?sessionId=${s._id}`)}>
                        View Tasks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(109,40,217,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(109,40,217,0.05); }
        }
      `}</style>
    </SMELayout>
  );
}
