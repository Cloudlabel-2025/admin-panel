"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { setupTokenRefresh } from "../utilis/tokenManager";

export default function Layout({ children }) {
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userPermissions, setUserPermissions] = useState({});
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    const empId = localStorage.getItem("employeeId");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    
    if (!role || !email || !token) {
      router.replace("/");
      return;
    }
    
    // Setup automatic token refresh
    setupTokenRefresh();
    
    setUserRole(role);
    setUserEmail(email);
    
    // Fetch user permissions for RBAC
    if (userId) {
      fetchUserPermissions(userId);
    }
    
    // Fetch user name
    if (empId && (role === "Employee" || role === "Intern" || role === "Team-Lead" || role === "Team-admin")) {
      fetch(`/api/Employee/${empId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserName(`${data.firstName} ${data.lastName}`);
          }
        })
        .catch(err => console.error('Error fetching user name:', err));
    } else if (role === "admin" || role === "super-admin" || role === "Super-admin" || role === "developer") {
      // For admin users, set a default name or extract from email
      setUserName(email ? email.split('@')[0].toUpperCase() : 'Admin');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container') && 
          !event.target.closest('[data-dropdown="profile"]')) {
        setShowProfileDropdown(false);
      }
      if (!event.target.closest('.notification-container') && 
          !event.target.closest('[data-dropdown="notifications"]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown, showNotifications]);

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await fetch(`/api/rbac?userId=${userId}`);
      const permissions = await response.json();
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const hasPermission = (module, subModule, action) => {
    // Check if user has RBAC permissions set
    if (Object.keys(userPermissions).length > 0) {
      return userPermissions[module]?.[subModule]?.[action] || false;
    }
    // Fallback to role-based access if no RBAC permissions
    return true;
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const navigate = (path) => {
    router.push(path);
  };

  const fetchNotifications = async () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await fetch(`/api/notifications?employeeId=${employeeId}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, isRead: true })
      });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!userRole) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        .accordion-button {
          box-shadow: none !important;
          white-space: nowrap;
        }
        .accordion-button:not(.collapsed) {
          background-color: rgba(255,255,255,0.1) !important;
          color: white !important;
        }
        .nav-link {
          transition: all 0.3s ease;
          border-radius: 6px;
          margin: 2px 8px;
          white-space: nowrap;
        }
        .nav-link:hover {
          background-color: rgba(255,255,255,0.1);
          transform: translateX(5px);
        }
        .nav-link.active {
          background-color: #0d6efd;
          color: white !important;
        }
        .sidebar-toggle {
          transition: all 0.3s ease;
        }
        .sidebar-collapsed {
          width: 80px !important;
        }
        .sidebar-collapsed .nav-text {
          display: none;
        }
        .dropdown-toggle::after {
          transition: transform 0.3s ease;
        }
        .dropdown-toggle[aria-expanded="true"]::after {
          transform: rotate(180deg);
        }
        body {
          overflow-x: hidden;
        }
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            z-index: 1050;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.show {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0 !important;
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
        
        {/* Sidebar */}
        <div className={`sidebar bg-dark text-white ${sidebarCollapsed ? 'show' : ''}`} 
             style={{ 
               width: sidebarCollapsed ? "80px" : "280px", 
               minHeight: "100vh",
               transition: "width 0.3s ease",
               boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
             }}>
          
          {/* Header */}
          <div className="p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center justify-content-between">
              {!sidebarCollapsed && (
                <div>
                  <h5 className="mb-1 text-primary">
                    {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "developer") ? "Admin Panel" : 
                     (userRole === "Team-Lead" || userRole === "Team-admin") ? "Team Management" : 
                     userRole === "Intern" ? "Intern Portal" :
                     "Employee Panel"}
                  </h5>
                  <small className="text-white-50">Role: {userRole}</small>
                </div>
              )}
              <button 
                className="btn btn-outline-light btn-sm d-md-block d-none"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>
          
          <div className="accordion accordion-flush" id="sidebarAccordion" style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>
            {/* Super Admin & Developer - 3 Division Access */}
            {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "developer") && (
              <>
                {/* Management */}
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#superAdminManagementCollapse">
                      <span className="me-2">👥</span>
                      {!sidebarCollapsed && "Management"}
                    </button>
                  </h2>
                  <div id="superAdminManagementCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      {hasPermission('Management', 'Dashboard', 'view') && (
                        <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                                onClick={() => navigate("/admin-dashboard")}>
                          <span className="me-2">🏠</span>
                          {!sidebarCollapsed && <span>Dashboard</span>}
                        </button>
                      )}
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/create-emp")}>
                        <span className="me-2">👤</span>
                        {!sidebarCollapsed && <span>Add Employee</span>}
                      </button>
                       <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/employees-list")}>
                        <span className="me-2">👤</span>
                        {!sidebarCollapsed && <span>Employees List</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Monitor Employees</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/documents")}>
                        <span className="me-2">📄</span>
                        {!sidebarCollapsed && <span>Documents</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <span className="me-2">📋</span>
                        {!sidebarCollapsed && <span>Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>Skills</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <span className="me-2">📈</span>
                        {!sidebarCollapsed && <span>Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Team Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/calendar")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Calendar</span>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accounting */}
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#superAdminAccountingCollapse">
                      <span className="me-2">💼</span>
                      {!sidebarCollapsed && "Accounting"}
                    </button>
                  </h2>
                  <div id="superAdminAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/transactions")}>
                        <span className="me-2">💳</span>
                        {!sidebarCollapsed && <span>Transactions</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/budgeting")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Budgeting</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/petty-cash")}>
                        <span className="me-2">💵</span>
                        {!sidebarCollapsed && <span>Petty Cash</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/inventory")}>
                        <span className="me-2">📦</span>
                        {!sidebarCollapsed && <span>Inventory</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>Payroll</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/fund-transfer")}>
                        <span className="me-2">💰</span>
                        {!sidebarCollapsed && <span>Fund Transfer</span>}
                      </button>
                      {userRole === "developer" && (
                        <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                                onClick={() => navigate("/rbac-control")}>
                          <span className="me-2">🔐</span>
                          {!sidebarCollapsed && <span>RBAC Control</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales & Purchase */}
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#superAdminSalesCollapse">
                      <span className="me-2">🛒</span>
                      {!sidebarCollapsed && "Sales & Purchase"}
                    </button>
                  </h2>
                  <div id="superAdminSalesCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/invoices")}>
                        <span className="me-2">🧾</span>
                        {!sidebarCollapsed && <span>Invoice Management</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/purchasing/purchase-orders")}>
                        <span className="me-2">📝</span>
                        {!sidebarCollapsed && <span>Purchase Orders</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/purchasing/purchase-invoices")}>
                        <span className="me-2">📄</span>
                        {!sidebarCollapsed && <span>Purchase Invoices</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Admin - 3 Division Access */}
            {userRole === "admin" && (
              <>
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#adminWorkCollapse">
                      <span className="me-2">💼</span>
                      {!sidebarCollapsed && "My Work"}
                    </button>
                  </h2>
                  <div id="adminWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-dashboard")}>
                        <span className="me-2">🏠</span>
                        {!sidebarCollapsed && <span>Dashboard</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <span className="me-2">⏰</span>
                        {!sidebarCollapsed && <span>Timecard Entry</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <span className="me-2">📝</span>
                        {!sidebarCollapsed && <span>Daily Task</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>My Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>My Payroll</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>My Skills</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>My Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <span className="me-2">📂</span>
                        {!sidebarCollapsed && <span>My Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>My Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-calendar")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Employee Calendar</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#adminManagementCollapse">
                      <span className="me-2">⚙️</span>
                      {!sidebarCollapsed && "Management"}
                    </button>
                  </h2>
                  <div id="adminManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/create-emp")}>
                        <span className="me-2">👤</span>
                        {!sidebarCollapsed && <span>Add Employee</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Monitor Employees</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <span className="me-2">📋</span>
                        {!sidebarCollapsed && <span>Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <span className="me-2">📈</span>
                        {!sidebarCollapsed && <span>Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Team Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/calendar")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Calendar</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#adminAccountsCollapse">
                      <span className="me-2">🏦</span>
                      {!sidebarCollapsed && "Accounts"}
                    </button>
                  </h2>
                  <div id="adminAccountsCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/accounts")}>
                        <span className="me-2">🏦</span>
                        {!sidebarCollapsed && <span>Accounts</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/transactions")}>
                        <span className="me-2">💳</span>
                        {!sidebarCollapsed && <span>Transactions</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/budgeting")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Budgeting</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/petty-cash")}>
                        <span className="me-2">💵</span>
                        {!sidebarCollapsed && <span>Petty Cash</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>Payroll</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Team-Lead - 3 Division Access */}
            {userRole === "Team-Lead" && (
              <>
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamLeadWorkCollapse">
                      <span className="me-2">💼</span>
                      {!sidebarCollapsed && "My Work"}
                    </button>
                  </h2>
                  <div id="teamLeadWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <span className="me-2">⏰</span>
                        {!sidebarCollapsed && <span>Timecard Entry</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <span className="me-2">📝</span>
                        {!sidebarCollapsed && <span>Daily Task</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <span className="me-2">📂</span>
                        {!sidebarCollapsed && <span>My Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>My Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>My Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>My Skills</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Employee Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>My Payroll</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamLeadManagementCollapse">
                      <span className="me-2">👥</span>
                      {!sidebarCollapsed && "Management"}
                    </button>
                  </h2>
                  <div id="teamLeadManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Monitor Team</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <span className="me-2">📋</span>
                        {!sidebarCollapsed && <span>Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Team Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <span className="me-2">📈</span>
                        {!sidebarCollapsed && <span>Team Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Team Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>Team Skills</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamLeadAccountingCollapse">
                      <span className="me-2">💰</span>
                      {!sidebarCollapsed && "Accounting"}
                    </button>
                  </h2>
                  <div id="teamLeadAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>My Payroll</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Team-admin - 3 Division Access */}
            {userRole === "Team-admin" && (
              <>
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamAdminWorkCollapse">
                      <span className="me-2">💼</span>
                      {!sidebarCollapsed && "My Work"}
                    </button>
                  </h2>
                  <div id="teamAdminWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <span className="me-2">⏰</span>
                        {!sidebarCollapsed && <span>Timecard Entry</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <span className="me-2">📝</span>
                        {!sidebarCollapsed && <span>Daily Task</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <span className="me-2">📂</span>
                        {!sidebarCollapsed && <span>My Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>My Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>My Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>My Skills</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Employee Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>My Payroll</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamAdminManagementCollapse">
                      <span className="me-2">⚙️</span>
                      {!sidebarCollapsed && "Management"}
                    </button>
                  </h2>
                  <div id="teamAdminManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <span className="me-2">📊</span>
                        {!sidebarCollapsed && <span>Monitor Team</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <span className="me-2">📋</span>
                        {!sidebarCollapsed && <span>Projects</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <span className="me-2">📅</span>
                        {!sidebarCollapsed && <span>Team Attendance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <span className="me-2">📈</span>
                        {!sidebarCollapsed && <span>Team Performance</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <span className="me-2">🏖️</span>
                        {!sidebarCollapsed && <span>Team Absence</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/documents")}>
                        <span className="me-2">📄</span>
                        {!sidebarCollapsed && <span>Documents</span>}
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <span className="me-2">🎯</span>
                        {!sidebarCollapsed && <span>Team Skills</span>}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamAdminAccountingCollapse">
                      <span className="me-2">💰</span>
                      {!sidebarCollapsed && "Accounting"}
                    </button>
                  </h2>
                  <div id="teamAdminAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <span className="me-2">💸</span>
                        {!sidebarCollapsed && <span>My Payroll</span>}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Intern - Limited Access */}
            {userRole === "Intern" && (
              <div className="accordion-item bg-dark border-0">
                <h2 className="accordion-header">
                  <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#internWorkCollapse">
                    <span className="me-2">🎓</span>
                    {!sidebarCollapsed && "My Work"}
                  </button>
                </h2>
                <div id="internWorkCollapse" className="accordion-collapse collapse show">
                  <div className="accordion-body bg-dark p-0">
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/timecard-entry")}>
                      <span className="me-2">⏰</span>
                      {!sidebarCollapsed && <span>Timecard Entry</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/daily-task")}>
                      <span className="me-2">📝</span>
                      {!sidebarCollapsed && <span>Daily Task</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-projects")}>
                      <span className="me-2">📂</span>
                      {!sidebarCollapsed && <span>My Projects</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-performance")}>
                      <span className="me-2">📊</span>
                      {!sidebarCollapsed && <span>My Performance</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-attendance")}>
                      <span className="me-2">📅</span>
                      {!sidebarCollapsed && <span>My Attendance</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-skills")}>
                      <span className="me-2">🎯</span>
                      {!sidebarCollapsed && <span>My Skills</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-calendar")}>
                      <span className="me-2">📅</span>
                      {!sidebarCollapsed && <span>Employee Calendar</span>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Employee - RBAC Controlled Access */}
            {userRole === "Employee" && (
              <div className="accordion-item bg-dark border-0">
                <h2 className="accordion-header">
                  <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#employeeWorkCollapse">
                    <span className="me-2">💼</span>
                    {!sidebarCollapsed && "My Work"}
                  </button>
                </h2>
                <div id="employeeWorkCollapse" className="accordion-collapse collapse show">
                  <div className="accordion-body bg-dark p-0">
                    {hasPermission('Management', 'Dashboard', 'view') && (
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-dashboard")}>
                        <span className="me-2">🏠</span>
                        {!sidebarCollapsed && <span>Dashboard</span>}
                      </button>
                    )}
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/timecard-entry")}>
                      <span className="me-2">⏰</span>
                      {!sidebarCollapsed && <span>Timecard Entry</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/daily-task")}>
                      <span className="me-2">📝</span>
                      {!sidebarCollapsed && <span>Daily Task</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-projects")}>
                      <span className="me-2">📂</span>
                      {!sidebarCollapsed && <span>My Projects</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-performance")}>
                      <span className="me-2">📊</span>
                      {!sidebarCollapsed && <span>My Performance</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-attendance")}>
                      <span className="me-2">📅</span>
                      {!sidebarCollapsed && <span>My Attendance</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/absence")}>
                      <span className="me-2">🏖️</span>
                      {!sidebarCollapsed && <span>My Absence</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-payroll")}>
                      <span className="me-2">💸</span>
                      {!sidebarCollapsed && <span>My Payroll</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-skills")}>
                      <span className="me-2">🎯</span>
                      {!sidebarCollapsed && <span>My Skills</span>}
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-calendar")}>
                      <span className="me-2">📅</span>
                      {!sidebarCollapsed && <span>Employee Calendar</span>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1">
          {/* Top Navigation */}
          <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3" style={{ overflowX: "hidden" }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-outline-primary d-md-none me-3"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title="Toggle Menu"
                >
                  ☰
                </button>
                {pathname === "/admin-dashboard" ? (
                  <div className="welcome-message">
                    <h5 className="mb-0 text-primary">
                      Welcome {(userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin") 
                        ? `${userRole} ${userName}` 
                        : userName || userEmail}
                    </h5>
                  </div>
                ) : (
                  <div className="breadcrumb-nav">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><a href="/admin-dashboard" className="text-decoration-none">Home</a></li>
                        <li className="breadcrumb-item active" aria-current="page">
                          {pathname.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      </ol>
                    </nav>
                  </div>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "team-lead" || userRole === "Team-admin" || userRole === "team-admin" || userRole === "Employee" || userRole === "employee") && (
                  <div className="position-relative notification-container">
                    <button 
                      className="btn btn-outline-secondary position-relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotifications(!showNotifications);
                        setShowProfileDropdown(false);
                        if (!showNotifications) fetchNotifications();
                      }}
                      title="Notifications"
                    >
                      🔔
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {notifications.filter(n => !n.isRead).length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
                <div className="position-relative dropdown-container" id="profile-dropdown-container">
                  <button 
                    className="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileDropdown(prev => !prev);
                      setShowNotifications(false);
                    }}
                    aria-expanded={showProfileDropdown}
                  >
                    <span className="me-2">👤</span>
                    <span className="d-none d-sm-inline">{userName || userEmail}</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
          
          {/* Notifications Portal */}
          {showNotifications && typeof window !== 'undefined' && createPortal(
            <div 
              data-dropdown="notifications"
              style={{ 
                position: "fixed",
                top: "60px",
                right: "80px", 
                minWidth: "320px", 
                maxHeight: "400px",
                backgroundColor: "white", 
                border: "1px solid #dee2e6", 
                borderRadius: "8px", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 99999,
                overflowY: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-bottom bg-primary text-white rounded-top">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>Notifications</strong>
                  <button 
                    className="btn btn-sm btn-outline-light"
                    onClick={() => setShowNotifications(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <div className="mb-2">🔔</div>
                  <div>No notifications</div>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`p-3 border-bottom cursor-pointer notification-item ${!notification.isRead ? 'bg-light border-start border-primary border-3' : ''}`}
                    onClick={() => {
                      if (notification.type === 'payroll') {
                        navigate('/my-payroll');
                      } else {
                        navigate('/team-absence');
                      }
                      setShowNotifications(false);
                      markAsRead(notification._id);
                    }}
                    style={{ transition: 'background-color 0.2s ease' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = !notification.isRead ? '#f8f9fa' : 'white'}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark mb-1">{notification.title}</div>
                        <div className="text-muted small mb-1">{notification.message}</div>
                        <div className="text-muted small">{new Date(notification.createdAt).toLocaleString()}</div>
                      </div>
                      {!notification.isRead && (
                        <span className="badge bg-primary rounded-pill">New</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
          
          {/* Profile Dropdown Portal */}
          {showProfileDropdown && typeof window !== 'undefined' && createPortal(
            <div 
              data-dropdown="profile"
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
                        }}>{userName || 'User'}</div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: "#6c757d",
                          marginBottom: "2px"
                        }}>{userEmail}</div>
                        <div style={{ 
                          fontSize: "11px", 
                          color: "#0d6efd",
                          fontWeight: "500"
                        }}>{userRole}</div>
                      </div>
                      <button 
                        style={{ 
                          width: "100%", 
                          padding: "12px 16px", 
                          border: "none", 
                          backgroundColor: "transparent", 
                          textAlign: "left", 
                          cursor: "pointer",
                          color: "#212529",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          transition: "background-color 0.2s ease"
                        }}
                        onClick={() => {
                          navigate("/profile");
                          setShowProfileDropdown(false);
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <span style={{ marginRight: "8px" }}>⚙️</span> Profile Settings
                      </button>
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
                        <span style={{ marginRight: "8px" }}>🚪</span> Logout
                      </button>
            </div>,
            document.body
          )}

          {/* Page Content */}
          <div className="p-4 bg-light" style={{ minHeight: "calc(100vh - 76px)" }}>
            <div className="container-fluid">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}