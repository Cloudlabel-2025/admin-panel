"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { setupTokenRefresh } from "../utilis/tokenManager";

export default function Layout({ children }) {
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
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
    
    // Fetch user name and profile picture
    if (empId && !empId.startsWith('ADMIN')) {
      fetch(`/api/Employee/${empId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.firstName && data.lastName) {
            setUserName(`${data.firstName} ${data.lastName}`);
            if (data.profilePicture) {
              setProfilePicture(data.profilePicture);
            }
          } else {
            setUserName(email ? email.split('@')[0] : 'User');
          }
        })
        .catch(err => {
          setUserName(email ? email.split('@')[0] : 'User');
        });
    } else {
      setUserName(email ? email.split('@')[0] : 'User');
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

    const handleStorageChange = (e) => {
      if (e.key === 'profilePictureUpdated') {
        const empId = localStorage.getItem('employeeId');
        if (empId && !empId.startsWith('ADMIN')) {
          fetch(`/api/Employee/${empId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.profilePicture) {
                setProfilePicture(data.profilePicture);
              } else {
                setProfilePicture('');
              }
            })
            .catch(err => console.error('Error refreshing profile picture:', err));
        }
        localStorage.removeItem('profilePictureUpdated');
      }
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('storage', handleStorageChange);
    };
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
        @media (max-width: 768px) {
          .sidebar .nav-text {
            display: inline !important;
          }
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
            position: fixed !important;
            z-index: 1050;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            width: 280px !important;
          }
          .sidebar.show {
            transform: translateX(0);
          }
          .sidebar.show .nav-text {
            display: inline !important;
          }
          .main-content {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
        @media (min-width: 769px) {
          .sidebar {
            position: relative;
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
               width: "280px", 
               minHeight: "100vh",
               transition: "all 0.3s ease",
               boxShadow: "2px 0 10px rgba(0,0,0,0.1)"
             }}>
          
          {/* Header */}
          <div className="p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-md-none d-block">
                <h5 className="mb-1 text-primary">
                  {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "developer") ? "Admin Panel" : 
                   (userRole === "Team-Lead" || userRole === "Team-admin") ? "Team Management" : 
                   userRole === "Intern" ? "Intern Portal" :
                   "Employee Panel"}
                </h5>
                <small className="text-white-50">Role: {userRole}</small>
              </div>
              {!sidebarCollapsed && (
                <div className="d-none d-md-block">
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
                className="btn btn-outline-light btn-sm d-none d-md-block"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
              </button>
              <button 
                className="btn btn-outline-light btn-sm d-md-none"
                onClick={() => setSidebarCollapsed(false)}
                title="Close Menu"
              >
                <i className="bi bi-x-lg"></i>
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
                      <i className="bi bi-people-fill me-2"></i>
                      <span className="nav-text">Management</span>
                    </button>
                  </h2>
                  <div id="superAdminManagementCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      {hasPermission('Management', 'Dashboard', 'view') && (
                        <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                                onClick={() => navigate("/admin-dashboard")}>
                          <i className="bi bi-house-fill me-2"></i>
                          <span className="nav-text">Dashboard</span>
                        </button>
                      )}
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/create-emp")}>
                        <i className="bi bi-person-plus-fill me-2"></i>
                        <span className="nav-text">Add Employee</span>
                      </button>
                       <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/employees-list")}>
                        <i className="bi bi-people-fill me-2"></i>
                        <span className="nav-text">Employees List</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/terminated-employees")}>
                        <i className="bi bi-person-x-fill me-2"></i>
                        <span className="nav-text">Terminated Employees</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        <span className="nav-text">Monitor Employees</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/documents")}>
                        <i className="bi bi-file-earmark-text-fill me-2"></i>
                        <span className="nav-text">Documents</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <i className="bi bi-kanban-fill me-2"></i>
                        <span className="nav-text">Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">Skills</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        <span className="nav-text">Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <i className="bi bi-calendar-x-fill me-2"></i>
                        <span className="nav-text">Team Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/calendar")}>
                        <i className="bi bi-calendar3 me-2"></i>
                        <span className="nav-text">Calendar</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/notifications")}>
                        <i className="bi bi-bell-fill me-2"></i>
                        <span className="nav-text">Notifications</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accounting */}
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#superAdminAccountingCollapse">
                      <i className="bi bi-calculator-fill me-2"></i>
                      <span className="nav-text">Accounting</span>
                    </button>
                  </h2>
                  <div id="superAdminAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/transactions")}>
                        <i className="bi bi-credit-card-fill me-2"></i>
                        <span className="nav-text">Transactions</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/budgeting")}>
                        <i className="bi bi-pie-chart-fill me-2"></i>
                        <span className="nav-text">Budgeting</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/petty-cash")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">Petty Cash</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/inventory")}>
                        <i className="bi bi-box-seam-fill me-2"></i>
                        <span className="nav-text">Inventory</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/payroll")}>
                        <i className="bi bi-wallet2 me-2"></i>
                        <span className="nav-text">Payroll</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/fund-transfer")}>
                        <i className="bi bi-arrow-left-right me-2"></i>
                        <span className="nav-text">Fund Transfer</span>
                      </button>
                      {userRole === "developer" && (
                        <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                                onClick={() => navigate("/rbac-control")}>
                          <i className="bi bi-shield-lock-fill me-2"></i>
                          <span className="nav-text">RBAC Control</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sales & Purchase */}
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#superAdminSalesCollapse">
                      <i className="bi bi-cart-fill me-2"></i>
                      <span className="nav-text">Sales & Purchase</span>
                    </button>
                  </h2>
                  <div id="superAdminSalesCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/invoices")}>
                        <i className="bi bi-receipt me-2"></i>
                        <span className="nav-text">Invoice Management</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/purchasing/purchase-orders")}>
                        <i className="bi bi-clipboard-check-fill me-2"></i>
                        <span className="nav-text">Purchase Orders</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/purchasing/purchase-invoices")}>
                        <i className="bi bi-file-earmark-invoice me-2"></i>
                        <span className="nav-text">Purchase Invoices</span>
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
                      <i className="bi bi-briefcase-fill me-2"></i>
                      <span className="nav-text">My Work</span>
                    </button>
                  </h2>
                  <div id="adminWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-dashboard")}>
                        <i className="bi bi-house-fill me-2"></i>
                        <span className="nav-text">Dashboard</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <i className="bi bi-clock-fill me-2"></i>
                        <span className="nav-text">Timecard Entry</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <i className="bi bi-list-task me-2"></i>
                        <span className="nav-text">Daily Task</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">My Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">My Payroll</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">My Skills</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        <span className="nav-text">My Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <i className="bi bi-folder-fill me-2"></i>
                        <span className="nav-text">My Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <i className="bi bi-calendar-x-fill me-2"></i>
                        <span className="nav-text">My Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-calendar")}>
                        <i className="bi bi-calendar3 me-2"></i>
                        <span className="nav-text">Employee Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#adminManagementCollapse">
                      <i className="bi bi-gear-fill me-2"></i>
                      <span className="nav-text">Management</span>
                    </button>
                  </h2>
                  <div id="adminManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employees/create-emp")}>
                        <i className="bi bi-person-plus-fill me-2"></i>
                        <span className="nav-text">Add Employee</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        <span className="nav-text">Monitor Employees</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <i className="bi bi-kanban-fill me-2"></i>
                        <span className="nav-text">Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <i className="bi bi-graph-up me-2"></i>
                        <span className="nav-text">Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <i className="bi bi-calendar-x me-2"></i>
                        <span className="nav-text">Team Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/calendar")}>
                        <i className="bi bi-calendar3 me-2"></i>
                        <span className="nav-text">Calendar</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#adminAccountsCollapse">
                      <i className="bi bi-bank me-2"></i>
                      <span className="nav-text">Accounts</span>
                    </button>
                  </h2>
                  <div id="adminAccountsCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/accounts")}>
                        <i className="bi bi-bank me-2"></i>
                        <span className="nav-text">Accounts</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/transactions")}>
                        <i className="bi bi-credit-card-fill me-2"></i>
                        <span className="nav-text">Transactions</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/budgeting")}>
                        <i className="bi bi-pie-chart-fill me-2"></i>
                        <span className="nav-text">Budgeting</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/petty-cash")}>
                        <i className="bi bi-cash me-2"></i>
                        <span className="nav-text">Petty Cash</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/accounting/payroll")}>
                        <i className="bi bi-wallet2 me-2"></i>
                        <span className="nav-text">Payroll</span>
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
                      <i className="bi bi-briefcase-fill me-2"></i>
                      <span className="nav-text">My Work</span>
                    </button>
                  </h2>
                  <div id="teamLeadWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <i className="bi bi-clock-fill me-2"></i>
                        <span className="nav-text">Timecard Entry</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <i className="bi bi-list-task me-2"></i>
                        <span className="nav-text">Daily Task</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <i className="bi bi-folder-fill me-2"></i>
                        <span className="nav-text">My Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        <span className="nav-text">My Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">My Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">My Skills</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <i className="bi bi-calendar-x-fill me-2"></i>
                        <span className="nav-text">Employee Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">My Payroll</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamLeadManagementCollapse">
                      <i className="bi bi-people-fill me-2"></i>
                      <span className="nav-text">Management</span>
                    </button>
                  </h2>
                  <div id="teamLeadManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        <span className="nav-text">Monitor Team</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <i className="bi bi-kanban-fill me-2"></i>
                        <span className="nav-text">Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">Team Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <i className="bi bi-graph-up me-2"></i>
                        <span className="nav-text">Team Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <i className="bi bi-calendar-x me-2"></i>
                        <span className="nav-text">Team Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">Team Skills</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamLeadAccountingCollapse">
                      <i className="bi bi-cash-coin me-2"></i>
                      <span className="nav-text">Accounting</span>
                    </button>
                  </h2>
                  <div id="teamLeadAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">My Payroll</span>
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
                      <i className="bi bi-briefcase-fill me-2"></i>
                      <span className="nav-text">My Work</span>
                    </button>
                  </h2>
                  <div id="teamAdminWorkCollapse" className="accordion-collapse collapse show">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/timecard-entry")}>
                        <i className="bi bi-clock-fill me-2"></i>
                        <span className="nav-text">Timecard Entry</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/daily-task")}>
                        <i className="bi bi-list-task me-2"></i>
                        <span className="nav-text">Daily Task</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-projects")}>
                        <i className="bi bi-folder-fill me-2"></i>
                        <span className="nav-text">My Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-performance")}>
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        <span className="nav-text">My Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/employee-attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">My Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">My Skills</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/absence")}>
                        <i className="bi bi-calendar-x-fill me-2"></i>
                        <span className="nav-text">Employee Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">My Payroll</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamAdminManagementCollapse">
                      <i className="bi bi-gear-fill me-2"></i>
                      <span className="nav-text">Management</span>
                    </button>
                  </h2>
                  <div id="teamAdminManagementCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin/monitor")}>
                        <i className="bi bi-bar-chart-fill me-2"></i>
                        <span className="nav-text">Monitor Team</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/project")}>
                        <i className="bi bi-kanban-fill me-2"></i>
                        <span className="nav-text">Projects</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/attendance")}>
                        <i className="bi bi-calendar-check-fill me-2"></i>
                        <span className="nav-text">Team Attendance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/performance")}>
                        <i className="bi bi-graph-up me-2"></i>
                        <span className="nav-text">Team Performance</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-absence")}>
                        <i className="bi bi-calendar-x me-2"></i>
                        <span className="nav-text">Team Absence</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/documents")}>
                        <i className="bi bi-file-earmark-text-fill me-2"></i>
                        <span className="nav-text">Documents</span>
                      </button>
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/skills")}>
                        <i className="bi bi-award-fill me-2"></i>
                        <span className="nav-text">Team Skills</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="accordion-item bg-dark border-0">
                  <h2 className="accordion-header">
                    <button className="accordion-button bg-dark text-white border-0 py-2" type="button" data-bs-toggle="collapse" data-bs-target="#teamAdminAccountingCollapse">
                      <i className="bi bi-cash-coin me-2"></i>
                      <span className="nav-text">Accounting</span>
                    </button>
                  </h2>
                  <div id="teamAdminAccountingCollapse" className="accordion-collapse collapse">
                    <div className="accordion-body bg-dark p-0">
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/my-payroll")}>
                        <i className="bi bi-cash-stack me-2"></i>
                        <span className="nav-text">My Payroll</span>
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
                    <i className="bi bi-mortarboard-fill me-2"></i>
                    <span className="nav-text">My Work</span>
                  </button>
                </h2>
                <div id="internWorkCollapse" className="accordion-collapse collapse show">
                  <div className="accordion-body bg-dark p-0">
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/timecard-entry")}>
                      <i className="bi bi-clock-fill me-2"></i>
                      <span className="nav-text">Timecard Entry</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/daily-task")}>
                      <i className="bi bi-list-task me-2"></i>
                      <span className="nav-text">Daily Task</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-projects")}>
                      <i className="bi bi-folder-fill me-2"></i>
                      <span className="nav-text">My Projects</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-performance")}>
                      <i className="bi bi-graph-up-arrow me-2"></i>
                      <span className="nav-text">My Performance</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-attendance")}>
                      <i className="bi bi-calendar-check-fill me-2"></i>
                      <span className="nav-text">My Attendance</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-skills")}>
                      <i className="bi bi-award-fill me-2"></i>
                      <span className="nav-text">My Skills</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-calendar")}>
                      <i className="bi bi-calendar3 me-2"></i>
                      <span className="nav-text">Employee Calendar</span>
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
                    <i className="bi bi-briefcase-fill me-2"></i>
                    <span className="nav-text">My Work</span>
                  </button>
                </h2>
                <div id="employeeWorkCollapse" className="accordion-collapse collapse show">
                  <div className="accordion-body bg-dark p-0">
                    {hasPermission('Management', 'Dashboard', 'view') && (
                      <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                              onClick={() => navigate("/admin-dashboard")}>
                        <i className="bi bi-house-fill me-2"></i>
                        <span className="nav-text">Dashboard</span>
                      </button>
                    )}
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/timecard-entry")}>
                      <i className="bi bi-clock-fill me-2"></i>
                      <span className="nav-text">Timecard Entry</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/daily-task")}>
                      <i className="bi bi-list-task me-2"></i>
                      <span className="nav-text">Daily Task</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-projects")}>
                      <i className="bi bi-folder-fill me-2"></i>
                      <span className="nav-text">My Projects</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-performance")}>
                      <i className="bi bi-graph-up-arrow me-2"></i>
                      <span className="nav-text">My Performance</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-attendance")}>
                      <i className="bi bi-calendar-check-fill me-2"></i>
                      <span className="nav-text">My Attendance</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/absence")}>
                      <i className="bi bi-calendar-x-fill me-2"></i>
                      <span className="nav-text">My Absence</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-payroll")}>
                      <i className="bi bi-cash-stack me-2"></i>
                      <span className="nav-text">My Payroll</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/my-skills")}>
                      <i className="bi bi-award-fill me-2"></i>
                      <span className="nav-text">My Skills</span>
                    </button>
                    <button className="nav-link text-white btn btn-link text-start d-flex align-items-center w-100 px-4 py-2" 
                            onClick={() => navigate("/employee-calendar")}>
                      <i className="bi bi-calendar3 me-2"></i>
                      <span className="nav-text">Employee Calendar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 main-content" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
          {/* Top Navigation */}
          <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-3" style={{ overflowX: "hidden" }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-outline-primary d-md-none me-3"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title="Toggle Menu"
                >
                  <i className="bi bi-list fs-4"></i>
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
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="rounded-circle me-2"
                        style={{width: '32px', height: '32px', objectFit: 'cover'}}
                      />
                    ) : (
                      <span className="me-2">👤</span>
                    )}
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
                        }}>{userName || userEmail.split('@')[0]}</div>
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
                          color: "#212529",
                          fontSize: "14px",
                          display: "flex",
                          alignItems: "center",
                          transition: "background-color 0.2s ease",
                          borderTop: "1px solid #e9ecef"
                        }}
                        onClick={() => {
                          navigate("/account-settings");
                          setShowProfileDropdown(false);
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                      >
                        <span style={{ marginRight: "8px" }}>🔒</span> Account Settings
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