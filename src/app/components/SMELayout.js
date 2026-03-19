"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";

export default function SMELayout({ children }) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    const token = localStorage.getItem("token");

    if (!role || !email || !token || role !== "SME") {
      router.replace("/");
      return;
    }

    setUserEmail(email);
    setUserName(email.split('@')[0]);

    // Check for active session
    checkActiveSession();
  }, []);

  const checkActiveSession = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/session?type=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // End current session if active
      if (currentSession) {
        const token = localStorage.getItem("token");
        await fetch('/api/sme/session', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'end' })
        });
      }
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const navigate = (path) => {
    router.push(path);
  };

  return (
    <>
      <style jsx global>{`
        .nav-link {
          transition: all 0.3s ease;
          border-radius: 8px;
          margin: 3px 8px;
          white-space: nowrap;
          padding: 10px 16px !important;
        }
        .nav-link:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(244, 229, 195, 0.2) 100%);
          transform: translateX(5px);
          border-left: 3px solid #d4af37;
        }
        .nav-link.active {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%);
          color: #1a1a1a !important;
          font-weight: 600;
          border-left: 3px solid #d4af37;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed !important;
            z-index: 1050;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: min(280px, 85vw) !important;
            height: 100vh;
            overflow-y: auto;
          }
          .sidebar.show {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div className="d-flex" style={{ overflowX: "hidden" }}>
        {/* Mobile Overlay */}
        {sidebarCollapsed && (
          <div
            className="position-fixed w-100 h-100 bg-dark bg-opacity-50 d-md-none"
            style={{ zIndex: 1040 }}
            onClick={() => setSidebarCollapsed(false)}
          />
        )}

        {/* SME Sidebar */}
        <div className={`sidebar text-white ${sidebarCollapsed ? 'show' : ''}`}
          style={{
            width: "280px",
            minHeight: "100vh",
            transition: "all 0.3s ease",
            boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
            background: "linear-gradient(180deg, #2c5530 0%, #1a3d1f 100%)"
          }}>

          {/* Header */}
          <div className="p-3" style={{
            background: "linear-gradient(135deg, #2c5530 0%, #4a7c59 100%)",
            borderBottom: "3px solid #4CAF50",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h5 className="mb-1" style={{ color: "#4CAF50", fontWeight: "700", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
                  <i className="bi bi-person-workspace me-2"></i>
                  SME Portal
                </h5>
                <small style={{ color: "#a8d5aa", fontWeight: "500" }}>
                  <i className="bi bi-person-badge me-1"></i>Subject Matter Expert
                </small>
              </div>
              <button
                className="btn btn-sm d-md-none"
                onClick={() => setSidebarCollapsed(false)}
                title="Close Menu"
                style={{
                  background: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
                  border: "none",
                  color: "#1a1a1a",
                  fontWeight: "600"
                }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-2" style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
            <div className="nav flex-column">
              <button 
                className={`nav-link text-white btn btn-link text-start d-flex align-items-center w-100 ${pathname === '/sme' ? 'active' : ''}`}
                onClick={() => navigate("/sme")}>
                <i className="bi bi-speedometer2 me-2"></i>
                Dashboard
              </button>
              
              <button 
                className={`nav-link text-white btn btn-link text-start d-flex align-items-center w-100 ${pathname === '/sme/sessions' ? 'active' : ''}`}
                onClick={() => navigate("/sme/sessions")}>
                <i className="bi bi-clock-history me-2"></i>
                My Sessions
              </button>
              
              <button 
                className={`nav-link text-white btn btn-link text-start d-flex align-items-center w-100 ${pathname === '/sme/tasks' ? 'active' : ''}`}
                onClick={() => navigate("/sme/tasks")}>
                <i className="bi bi-list-task me-2"></i>
                My Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 main-content" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
          {/* Top Navigation */}
          <nav className="navbar navbar-expand-lg navbar-light px-3" style={{
            overflowX: "hidden",
            background: "linear-gradient(135deg, #2c5530 0%, #4a7c59 100%)",
            borderBottom: "3px solid #4CAF50",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
          }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="d-flex align-items-center">
                <button
                  className="btn d-md-none me-3"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title="Toggle Menu"
                  style={{
                    background: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
                    border: "none",
                    color: "#1a1a1a",
                    fontWeight: "600"
                  }}
                >
                  <i className="bi bi-list fs-4"></i>
                </button>
                
                {pathname === "/sme" ? (
                  <div className="welcome-message">
                    <h5 className="mb-0" style={{ color: "#4CAF50", fontWeight: "700", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>
                      <i className="bi bi-house-heart-fill me-2"></i>Welcome {userName}
                    </h5>
                  </div>
                ) : (
                  <div className="breadcrumb-nav">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                          <a href="/sme" className="text-decoration-none" style={{ color: "#4CAF50", fontWeight: "600" }}>
                            Home
                          </a>
                        </li>
                        <li className="breadcrumb-item" style={{ color: "#a8d5aa" }} aria-current="page">
                          {pathname.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      </ol>
                    </nav>
                  </div>
                )}
              </div>
              
              <div className="d-flex align-items-center gap-2">
                {/* Session Status Indicator */}
                {currentSession && (
                  <div className="d-flex align-items-center me-3">
                    <span className="badge me-2" style={{
                      background: currentSession.status === 'active' ? '#4CAF50' : 
                                 currentSession.status === 'break' ? '#FF9800' : '#F44336',
                      fontSize: '12px'
                    }}>
                      {currentSession.status.toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="position-relative dropdown-container">
                  <button
                    className="btn dropdown-toggle d-flex align-items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileDropdown(prev => !prev);
                    }}
                    style={{
                      background: "linear-gradient(135deg, #4CAF50 0%, #81C784 100%)",
                      border: "none",
                      color: "#1a1a1a",
                      fontWeight: "600",
                      padding: "8px 16px"
                    }}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    <span className="d-none d-sm-inline">{userName}</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Profile Dropdown Portal */}
          {showProfileDropdown && typeof window !== 'undefined' && createPortal(
            <div
              style={{
                position: "fixed",
                top: "60px",
                right: "20px",
                minWidth: "220px",
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 99999,
                display: "block"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: "16px",
                borderBottom: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa"
              }}>
                <div style={{
                  fontWeight: "600",
                  color: "#212529",
                  fontSize: "14px",
                  marginBottom: "4px"
                }}>{userName}</div>
                <div style={{
                  fontSize: "11px",
                  color: "#4CAF50",
                  fontWeight: "500"
                }}>SME</div>
              </div>
              
              <button
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  backgroundColor: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "#dc3545",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  transition: "background-color 0.2s ease"
                }}
                onClick={handleLogout}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              >
                <i className="bi bi-box-arrow-right me-2"></i> Logout
              </button>
            </div>,
            document.body
          )}

          {/* Page Content */}
          <div className="p-2 p-md-4 bg-light" style={{ minHeight: "calc(100vh - 76px)", width: '100%', overflowX: 'hidden' }}>
            <div className="container-fluid" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}