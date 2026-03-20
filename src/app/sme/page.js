"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SMELayout from "../components/SMELayout";
import { apiFetch } from "../utilis/apiFetch";

export default function SMEDashboard() {
  const [session, setSession]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setAL]    = useState(false);
  const [error, setError]         = useState("");
  const [elapsed, setElapsed]     = useState({ total: "0h 0m", net: "0h 0m" });
  const timerRef                  = useRef(null);
  const router                    = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") router.replace("/");
    fetchSession();
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (!session || session.status === "completed") return;
    const tick = () => {
      const now      = Date.now();
      const loginMs  = new Date(session.loginTime).getTime();
      const totalMin = Math.floor((now - loginMs) / 60000);

      let breakMin = (session.totalBreakTime || 0) + (session.totalLunchTime || 0);
      if ((session.status === "break" || session.status === "lunch") && session.breaks?.length) {
        const cur = session.breaks[session.breaks.length - 1];
        if (cur && !cur.endTime)
          breakMin += Math.floor((now - new Date(cur.startTime).getTime()) / 60000);
      }
      const netMin = Math.max(0, totalMin - breakMin);
      setElapsed({ total: fmt(totalMin), net: fmt(netMin) });
    };
    tick();
    timerRef.current = setInterval(tick, 60000);
    return () => clearInterval(timerRef.current);
  }, [session?.loginTime, session?.status]);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await apiFetch("/api/sme/session?type=active");
      if (res.ok) { const d = await res.json(); setSession(d.session || null); }
    } catch {}
    finally { setLoading(false); }
  };

  const doAction = async (action) => {
    setAL(true); setError("");
    try {
      const res = await apiFetch("/api/sme/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const d = await res.json();
        setSession(d.session || null);
        if (action === "end") setTimeout(() => window.location.reload(), 1200);
      } else {
        const d = await res.json();
        setError(d.error || `Failed to ${action}`);
      }
    } catch { setError(`Failed to ${action}`); }
    finally { setAL(false); }
  };

  const fmt = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

  const fmtTime = (d) =>
    d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

  const statusMeta = {
    active: { label: "Active",   bg: "#ede9fe", color: "#4c1d95", dot: "#6d28d9" },
    break:  { label: "On Break", bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
    lunch:  { label: "On Lunch", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  };
  const meta = session ? (statusMeta[session.status] || statusMeta.active) : null;

  if (loading) return (
    <SMELayout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div className="sme-spinner"></div>
      </div>
    </SMELayout>
  );

  return (
    <SMELayout>
      {/* ── Page header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "8px" }}>
        <div>
          <h1 className="sme-page-title"><i className="bi bi-speedometer2 me-2"></i>Dashboard</h1>
          <p style={{ color: "#8b5cf6", fontSize: "14px", margin: "4px 0 0" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="bi bi-exclamation-triangle-fill"></i>{error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── No session ── */}
      {!session ? (
        <div style={{ maxWidth: "520px", margin: "60px auto 0", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <i className="bi bi-play-circle" style={{ fontSize: "32px", color: "#6d28d9" }}></i>
          </div>
          <h3 style={{ color: "#1e1b4b", fontWeight: "700", marginBottom: "8px" }}>Ready to start your day?</h3>
          <p style={{ color: "#8b5cf6", fontSize: "15px", marginBottom: "28px" }}>
            Start a session to begin tracking your work time, breaks, and tasks.
          </p>
          <button className="sme-btn sme-btn-primary sme-btn-lg" onClick={() => doAction("start")} disabled={actionLoading}>
            {actionLoading ? <span className="sme-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></span> : <i className="bi bi-play-fill"></i>}
            Start Work Session
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── Session status strip ── */}
          <div className="sme-status-strip" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: meta.dot, display: "inline-block", boxShadow: `0 0 0 3px ${meta.dot}30` }}></span>
                <span style={{ fontWeight: "700", color: "#1e1b4b", fontSize: "15px" }}>{meta.label}</span>
                <span className="sme-badge" style={{ background: meta.bg, color: meta.color }}>{session.status}</span>
              </div>

              <div style={{ width: "1px", height: "20px", background: "#ddd6fe" }}></div>

              {/* Start time */}
              <div>
                <div className="sme-section-label">Started</div>
                <div style={{ fontWeight: "600", color: "#1e1b4b", fontSize: "15px" }}>{fmtTime(session.loginTime)}</div>
              </div>

              <div style={{ width: "1px", height: "20px", background: "#ddd6fe" }}></div>

              {/* Total time */}
              <div>
                <div className="sme-section-label">Total Time</div>
                <div style={{ fontWeight: "700", color: "#4c1d95", fontSize: "18px", fontFamily: "monospace" }}>{elapsed.total}</div>
              </div>

              <div style={{ width: "1px", height: "20px", background: "#ddd6fe" }}></div>

              {/* Net work */}
              <div>
                <div className="sme-section-label">Net Working</div>
                <div style={{ fontWeight: "700", color: "#065f46", fontSize: "18px", fontFamily: "monospace" }}>{elapsed.net}</div>
              </div>
            </div>
          </div>

          {/* ── Session controls ── */}
          <div className="sme-panel">
            <div className="sme-panel-header">
              <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                <i className="bi bi-sliders me-2" style={{ color: "#7c3aed" }}></i>Session Controls
              </span>
            </div>
            <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {session.status === "active" && (
                <>
                  <button className="sme-btn sme-btn-amber" onClick={() => doAction("break")} disabled={actionLoading}>
                    <i className="bi bi-pause-fill"></i>Start Break
                  </button>
                  <button className="sme-btn sme-btn-outline" onClick={() => doAction("lunch")} disabled={actionLoading}>
                    <i className="bi bi-cup-hot-fill"></i>Start Lunch
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button className="sme-btn sme-btn-danger" onClick={() => doAction("end")} disabled={actionLoading}>
                    <i className="bi bi-stop-fill"></i>End Session
                  </button>
                </>
              )}
              {(session.status === "break" || session.status === "lunch") && (
                <>
                  <div style={{ color: "#92400e", fontSize: "14px", fontWeight: "500" }}>
                    <i className="bi bi-clock me-2"></i>
                    {session.status === "break" ? "On break" : "On lunch"} — click Resume to continue working
                  </div>
                  <div style={{ flex: 1 }}></div>
                  <button className="sme-btn sme-btn-teal" onClick={() => doAction("resume")} disabled={actionLoading}>
                    <i className="bi bi-play-fill"></i>Resume Work
                  </button>
                </>
              )}
              {actionLoading && <span className="sme-spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></span>}
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div className="sme-panel">
            <div className="sme-panel-header">
              <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
                <i className="bi bi-lightning-charge me-2" style={{ color: "#7c3aed" }}></i>Quick Actions
              </span>
            </div>
            <div>
              <div
                className="sme-quick-action"
                onClick={() => session.status === "active" && router.push("/sme/tasks")}
                style={{ opacity: session.status !== "active" ? 0.45 : 1, cursor: session.status !== "active" ? "not-allowed" : "pointer" }}
              >
                <div className="sme-quick-action-icon"><i className="bi bi-plus-circle"></i></div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e1b4b", fontSize: "14px" }}>Add Task</div>
                  <div style={{ color: "#8b5cf6", fontSize: "12px" }}>Log a new task to your active session</div>
                </div>
                <i className="bi bi-chevron-right" style={{ marginLeft: "auto", color: "#c4b5fd" }}></i>
              </div>
              <div className="sme-quick-action" onClick={() => router.push("/sme/tasks")}>
                <div className="sme-quick-action-icon"><i className="bi bi-list-task"></i></div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e1b4b", fontSize: "14px" }}>Manage Tasks</div>
                  <div style={{ color: "#8b5cf6", fontSize: "12px" }}>View and update your task list</div>
                </div>
                <i className="bi bi-chevron-right" style={{ marginLeft: "auto", color: "#c4b5fd" }}></i>
              </div>
              <div className="sme-quick-action" onClick={() => router.push("/sme/sessions")}>
                <div className="sme-quick-action-icon"><i className="bi bi-clock-history"></i></div>
                <div>
                  <div style={{ fontWeight: "600", color: "#1e1b4b", fontSize: "14px" }}>View Sessions</div>
                  <div style={{ color: "#8b5cf6", fontSize: "12px" }}>Browse your session history and stats</div>
                </div>
                <i className="bi bi-chevron-right" style={{ marginLeft: "auto", color: "#c4b5fd" }}></i>
              </div>
            </div>
          </div>

        </div>
      )}
    </SMELayout>
  );
}
