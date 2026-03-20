"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { apiFetch } from "../utilis/apiFetch";

// ── Shared design tokens ──────────────────────────────────────────────────────
export const T = {
  violet:      "#4c1d95",
  purple:      "#6d28d9",
  purpleMid:   "#7c3aed",
  purpleLight: "#a78bfa",
  lavender:    "#ede9fe",
  lavenderSoft:"#f5f3ff",
  lavenderBg:  "#faf5ff",
  border:      "#ddd6fe",
  borderSoft:  "#ede9fe",
  textDark:    "#1e1b4b",
  textMid:     "#4c1d95",
  textSoft:    "#7c3aed",
  textMuted:   "#8b5cf6",
  white:       "#ffffff",
};

export default function SMELayout({ children }) {
  const [userName, setUserName]                   = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed]   = useState(false);
  const [currentSession, setCurrentSession]       = useState(null);
  const [mounted, setMounted]                     = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const role  = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    const token = localStorage.getItem("token");
    if (!role || !email || !token || role !== "SME") { router.replace("/"); return; }
    setUserName(email.split("@")[0]);
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const res = await apiFetch("/api/sme/session?type=active");
      if (res.ok) { const d = await res.json(); setCurrentSession(d.session); }
    } catch {}
  };

  const handleLogout = async () => {
    try {
      if (currentSession)
        await apiFetch("/api/sme/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" }),
        });
    } finally {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const navItems = [
    { path: "/sme",          icon: "bi-speedometer2",  label: "Dashboard"   },
    { path: "/sme/sessions", icon: "bi-clock-history", label: "My Sessions" },
    { path: "/sme/tasks",    icon: "bi-list-task",     label: "My Tasks"    },
  ];

  const statusDot = currentSession
    ? currentSession.status === "active" ? "#22c55e"
    : currentSession.status === "break"  ? "#f59e0b" : "#ef4444"
    : null;

  return (
    <>
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { background: ${T.lavenderBg}; }

        /* ── Sidebar nav items ── */
        .sme-nav-btn {
          display: flex; align-items: center; width: 100%;
          padding: 11px 16px; margin: 2px 0;
          background: transparent; border: none; border-radius: 8px;
          color: #c4b5fd; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s ease;
          text-align: left; white-space: nowrap;
        }
        .sme-nav-btn:hover {
          background: rgba(167,139,250,0.15);
          color: #ede9fe;
          padding-left: 20px;
        }
        .sme-nav-btn.active {
          background: rgba(167,139,250,0.22);
          color: #ede9fe !important;
          font-weight: 600;
          border-left: 3px solid #a78bfa;
          padding-left: 13px;
        }
        .sme-nav-btn.active:focus, .sme-nav-btn:focus { outline: none; box-shadow: none; }

        /* ── Shared page styles ── */
        .sme-page-title {
          font-size: 22px; font-weight: 700; color: ${T.violet}; margin: 0;
        }
        .sme-section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.7px;
          text-transform: uppercase; color: ${T.textMuted};
        }
        .sme-divider { border: none; border-top: 1px solid ${T.border}; margin: 0; }

        /* ── Status strip ── */
        .sme-status-strip {
          background: #f0ebff;
          border-left: 4px solid ${T.purple};
          border-radius: 0 8px 8px 0;
          padding: 14px 20px;
        }

        /* ── Flat table ── */
        .sme-table { width: 100%; border-collapse: collapse; }
        .sme-table th {
          font-size: 12px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: ${T.textMuted};
          padding: 11px 16px; background: ${T.lavenderSoft};
          border-bottom: 2px solid ${T.border};
        }
        .sme-table td {
          font-size: 14px; padding: 13px 16px;
          border-bottom: 1px solid ${T.borderSoft};
          vertical-align: middle; color: #374151;
        }
        .sme-table tr:last-child td { border-bottom: none; }
        .sme-table tbody tr:hover td { background: ${T.lavenderBg}; }

        /* ── Flat panel ── */
        .sme-panel {
          background: ${T.white};
          border: 1px solid ${T.border};
          border-radius: 10px;
          overflow: hidden;
        }
        .sme-panel-header {
          padding: 14px 20px;
          border-bottom: 1px solid ${T.borderSoft};
          background: ${T.lavenderSoft};
          display: flex; justify-content: space-between; align-items: center;
        }

        /* ── Stat row ── */
        .sme-stat-row {
          display: flex; align-items: stretch;
          background: ${T.white}; border: 1px solid ${T.border}; border-radius: 10px;
        }
        .sme-stat-cell {
          flex: 1; padding: 16px 20px;
          border-right: 1px solid ${T.border};
        }
        .sme-stat-cell:last-child { border-right: none; }
        .sme-stat-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.6px;
          text-transform: uppercase; color: ${T.textMuted}; margin-bottom: 4px;
        }
        .sme-stat-value {
          font-size: 24px; font-weight: 700; line-height: 1.1;
        }

        /* ── Buttons ── */
        .sme-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 7px; font-size: 14px;
          font-weight: 500; cursor: pointer; border: none; transition: all 0.15s;
        }
        .sme-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sme-btn-primary {
          background: ${T.purple}; color: white;
        }
        .sme-btn-primary:hover:not(:disabled) { background: ${T.violet}; }
        .sme-btn-outline {
          background: white; color: ${T.purple};
          border: 1px solid ${T.border};
        }
        .sme-btn-outline:hover:not(:disabled) { background: ${T.lavender}; border-color: ${T.purpleLight}; }
        .sme-btn-ghost {
          background: transparent; color: ${T.purple};
          border: 1px solid ${T.border};
        }
        .sme-btn-ghost:hover:not(:disabled) { background: ${T.lavenderSoft}; }
        .sme-btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .sme-btn-danger:hover:not(:disabled) { background: #fee2e2; }
        .sme-btn-amber  { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .sme-btn-amber:hover:not(:disabled)  { background: #fef3c7; }
        .sme-btn-teal   { background: #f0fdf4; color: #065f46; border: 1px solid #bbf7d0; }
        .sme-btn-teal:hover:not(:disabled)   { background: #dcfce7; }
        .sme-btn-lg { padding: 11px 28px; font-size: 15px; }

        /* ── Status badge ── */
        .sme-badge {
          display: inline-block; padding: 3px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase;
        }

        /* ── Quick action item ── */
        .sme-quick-action {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; border-bottom: 1px solid ${T.borderSoft};
          cursor: pointer; transition: background 0.15s;
        }
        .sme-quick-action:last-child { border-bottom: none; }
        .sme-quick-action:hover { background: ${T.lavenderBg}; }
        .sme-quick-action-icon {
          width: 36px; height: 36px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: ${T.lavender}; color: ${T.purple}; font-size: 16px; flex-shrink: 0;
        }

        /* ── Form ── */
        .sme-input {
          width: 100%; padding: 9px 13px; border: 1px solid ${T.border};
          border-radius: 7px; font-size: 14px; color: ${T.textDark};
          background: ${T.lavenderBg}; outline: none;
        }
        .sme-input:focus { border-color: ${T.purpleLight}; box-shadow: 0 0 0 3px rgba(167,139,250,0.15); }
        .sme-label { font-size: 13px; font-weight: 600; color: ${T.textMid}; margin-bottom: 6px; display: block; }

        /* ── Modal overlay ── */
        .sme-modal-overlay {
          position: fixed; inset: 0; background: rgba(76,29,149,0.25);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
        }
        .sme-modal {
          background: white; border-radius: 12px; width: 100%; max-width: 480px;
          border: 1px solid ${T.border}; overflow: hidden;
        }
        .sme-modal-header {
          padding: 16px 20px; border-bottom: 1px solid ${T.borderSoft};
          background: ${T.lavenderSoft}; display: flex; justify-content: space-between; align-items: center;
        }
        .sme-modal-body   { padding: 20px; }
        .sme-modal-footer { padding: 14px 20px; border-top: 1px solid ${T.borderSoft}; display: flex; justify-content: flex-end; gap: 8px; }

        /* ── Spinner ── */
        .sme-spinner {
          width: 28px; height: 28px; border: 3px solid ${T.border};
          border-top-color: ${T.purple}; border-radius: 50%;
          animation: sme-spin 0.7s linear infinite;
        }
        @keyframes sme-spin { to { transform: rotate(360deg); } }

        @media (max-width: 768px) {
          .sme-sidebar {
            position: fixed !important; z-index: 1050;
            transform: translateX(-100%); transition: transform 0.3s ease;
            width: min(260px, 85vw) !important; height: 100vh; overflow-y: auto;
          }
          .sme-sidebar.show { transform: translateX(0); }
          .sme-main { margin-left: 0 !important; width: 100% !important; }
          .sme-stat-row { flex-wrap: wrap; }
          .sme-stat-cell { min-width: 50%; border-bottom: 1px solid ${T.border}; }
        }
      `}</style>

      <div style={{ display: "flex", overflowX: "hidden" }}>
        {/* Mobile overlay */}
        {sidebarCollapsed && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1040 }}
            className="d-md-none"
            onClick={() => setSidebarCollapsed(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <div
          className={`sme-sidebar${mounted && sidebarCollapsed ? " show" : ""}`}
          suppressHydrationWarning
          style={{
            width: "250px", minHeight: "100vh", flexShrink: 0,
            background: "linear-gradient(180deg, #2e1065 0%, #3b0764 40%, #4c1d95 100%)",
            boxShadow: "2px 0 16px rgba(76,29,149,0.18)",
          }}
        >
          {/* Brand */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#ede9fe", fontWeight: "700", fontSize: "16px", letterSpacing: "0.3px" }}>
                  <i className="bi bi-person-workspace me-2"></i>SME Portal
                </div>
                <div style={{ color: "#a78bfa", fontSize: "12px", marginTop: "3px" }}>
                  Subject Matter Expert
                </div>
              </div>
              <button
                className="d-md-none"
                onClick={() => setSidebarCollapsed(false)}
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#ede9fe", borderRadius: "6px", padding: "4px 8px", cursor: "pointer" }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: "12px 8px" }}>
            {navItems.map(({ path, icon, label }) => (
              <button
                key={path}
                className={`sme-nav-btn${pathname === path ? " active" : ""}`}
                onClick={() => { router.push(path); setSidebarCollapsed(false); }}
              >
                <i className={`bi ${icon} me-2`} style={{ fontSize: "15px" }}></i>
                {label}
              </button>
            ))}
          </div>

          {/* Session indicator at bottom */}
          {currentSession && (
            <div style={{ position: "absolute", bottom: "20px", left: "16px", right: "16px" }}>
              <div style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusDot, display: "inline-block", flexShrink: 0 }}></span>
                  <span style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: "500" }}>
                    Session {currentSession.status}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Main ── */}
        <div className="sme-main" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Topbar */}
          <div style={{
            background: T.white, borderBottom: `1px solid ${T.border}`,
            padding: "0 20px", height: "56px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(109,40,217,0.06)", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="d-md-none"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ background: T.lavender, border: `1px solid ${T.border}`, color: T.purple, borderRadius: "6px", padding: "5px 10px", cursor: "pointer" }}
              >
                <i className="bi bi-list fs-5"></i>
              </button>
              {pathname === "/sme" ? (
                <span style={{ color: T.purple, fontWeight: "600", fontSize: "14px" }}>
                  <i className="bi bi-house-heart-fill me-2"></i>Welcome back
                </span>
              ) : (
                <nav aria-label="breadcrumb">
                  <ol style={{ display: "flex", gap: "6px", listStyle: "none", margin: 0, padding: 0, fontSize: "14px" }}>
                    <li><a href="/sme" style={{ color: T.textMuted, textDecoration: "none", fontWeight: "500" }}>Home</a></li>
                    <li style={{ color: T.border }}>›</li>
                    <li style={{ color: T.purple, fontWeight: "600" }}>
                      {pathname.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  </ol>
                </nav>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {currentSession && (
                <span className="sme-badge" style={{
                  background: currentSession.status === "active" ? "#ede9fe" : currentSession.status === "break" ? "#fef3c7" : "#fee2e2",
                  color:      currentSession.status === "active" ? T.purple   : currentSession.status === "break" ? "#92400e"  : "#dc2626",
                }}>
                  {currentSession.status}
                </span>
              )}
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowProfileDropdown(p => !p); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: T.lavender, border: `1px solid ${T.border}`, color: T.purple, borderRadius: "7px", padding: "6px 12px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
                >
                  <i className="bi bi-person-circle" style={{ fontSize: "16px" }}></i>
                  <span className="d-none d-sm-inline">{userName}</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: "11px" }}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Profile dropdown portal */}
          {showProfileDropdown && typeof window !== "undefined" && createPortal(
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setShowProfileDropdown(false)} />
              <div style={{ position: "fixed", top: "62px", right: "16px", minWidth: "190px", background: T.white, border: `1px solid ${T.border}`, borderRadius: "9px", boxShadow: "0 6px 20px rgba(109,40,217,0.12)", zIndex: 9999, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.borderSoft}`, background: T.lavenderSoft }}>
                  <div style={{ fontWeight: "600", color: T.textDark, fontSize: "14px" }}>{userName}</div>
                  <div style={{ fontSize: "11px", color: T.textMuted, fontWeight: "500" }}>SME</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ width: "100%", padding: "11px 16px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", color: "#dc2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <i className="bi bi-box-arrow-right"></i>Logout
                </button>
              </div>
            </>,
            document.body
          )}

          {/* Page content */}
          <div style={{ flex: 1, padding: "24px", background: T.lavenderBg, overflowX: "hidden" }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
