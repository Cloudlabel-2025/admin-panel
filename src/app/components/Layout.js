"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Layout({ children }) {
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    const empId = localStorage.getItem("employeeId");
    
    setUserRole(role);
    setUserEmail(email);
    
    // Fetch user name
    if (empId) {
      fetch(`/api/Employee/${empId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserName(`${data.firstName} ${data.lastName}`);
          }
        })
        .catch(err => console.error('Error fetching user name:', err));
    }
  }, []);

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
      console.log('Fetching notifications for employeeId:', employeeId);
      const response = await fetch(`/api/notifications?employeeId=${employeeId}`);
      const data = await response.json();
      console.log('Notifications response:', data);
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
        body: JSON.stringify({ _id: id, status: 'read' })
      });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, status: 'read' } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (!userRole) {
    return <div>{children}</div>;
  }

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="bg-dark text-white" style={{ width: "250px", minHeight: "100vh" }}>
        <div className="p-3">
          <h5>
            {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Admin Panel" : 
             (userRole === "Team-Lead" || userRole === "Team-admin") ? "Team Management" : 
             "Employee Panel"}
          </h5>
          <small className="text-white-50">Role: {userRole}</small>
        </div>
        <nav className="nav flex-column">
          {/* Super Admin - Full System Access */}
          {(userRole === "super-admin" || userRole === "Super-admin") && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin-dashboard")}>
                Dashboard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/employees/create-emp")}>
                Add Employee
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin/monitor")}>
                Monitor Employees
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/documents")}>
                Document Upload
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/project")}>
                Project
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/skills")}>
                Skills
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/performance")}>
                Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/fund-transfer")}>
                💰 Fund Transfer
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">ACCOUNTING</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/accounts")}>
                Accounts
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/transactions")}>
                Transactions
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/budgeting")}>
                Budgeting
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/petty-cash")}>
                Petty-Cash
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">SALES & PURCHASING</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/sales/customers")}>
                Customers
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/sales/orders")}>
                Sales Orders
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/sales/invoices")}>
                Sales Invoices
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/purchasing/vendors")}>
                Vendors
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/purchasing/purchase-orders")}>
                Purchase Orders
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/purchasing/purchase-invoices")}>
                Purchase Invoices
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                Payroll
              </button>
            </>
          )}

          {/* Admin - Limited System Access */}
          {userRole === "admin" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin-dashboard")}>
                Dashboard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin/monitor")}>
                Monitor Employees
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/project")}>
                Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/performance")}>
                Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/team-absence")}>
                Team Absence
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Absence
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">ACCOUNTING</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/accounts")}>
                Accounts
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/transactions")}>
                Transactions
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/budgeting")}>
                Budgeting
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/petty-cash")}>
                Petty-Cash
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                Payroll
              </button>
            </>
          )}

          {/* Team Lead - Department Management */}
          {userRole === "Team-Lead" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin-dashboard")}>
                Dashboard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin/monitor")}>
                Monitor Team
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/project")}>
                Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                Team Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/performance")}>
                Team Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/team-absence")}>
                Team Absence
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">MY WORK</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                Timecard Entry
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                Daily Task
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-projects")}>
                My Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-performance")}>
                My Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                My Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Absence
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                My Payroll
              </button>
            </>
          )}

          {/* Team Admin - Department Administration */}
          {userRole === "Team-admin" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin-dashboard")}>
                Dashboard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin/monitor")}>
                Monitor Team
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/project")}>
                Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                Team Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/performance")}>
                Team Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/team-absence")}>
                Team Absence
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">MY WORK</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                Timecard Entry
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                Daily Task
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-projects")}>
                My Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-performance")}>
                My Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                My Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Absence
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                My Payroll
              </button>
            </>
          )}

          {/* Employee - Standard Access */}
          {userRole === "Employee" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                Timecard Entry
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                Daily Task
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-projects")}>
                My Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-performance")}>
                My Performance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                My Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Absence
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                My Payroll
              </button>
            </>
          )}

          {/* Intern - Limited Access */}
          {userRole === "Intern" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                Timecard Entry
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                Daily Tasks
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-projects")}>
                Assigned Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                My Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Absence
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/payroll")}>
                My Payroll
              </button>
            </>
          )}

          {/* Fallback for any other roles */}
          {!(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "team-lead" || userRole === "Team-admin" || userRole === "team-admin" || userRole === "Employee" || userRole === "Intern") && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                Timecard Entry
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                Daily Task
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/my-projects")}>
                My Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                My Attendance
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navigation */}
        <nav className="navbar navbar-light bg-light px-3">
          <div className="d-flex justify-content-between align-items-center w-100">
            {pathname === "/admin-dashboard" ? (
              <div className="welcome-message">
                <h5 className="mb-0 text-primary">
                  Welcome {(userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin") 
                    ? `${userRole} ${userName}` 
                    : userName || userEmail}
                </h5>
              </div>
            ) : (
              <div></div>
            )}
            <div className="d-flex align-items-center gap-2">
              {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "team-lead" || userRole === "Team-admin" || userRole === "team-admin") && (
                <div className="position-relative">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) fetchNotifications();
                    }}
                    title="Notifications"
                  >
                    🔔
                  </button>
                  {showNotifications && (
                    <div className="position-absolute end-0 mt-2 bg-white border rounded shadow" style={{ zIndex: 1000, minWidth: "300px", maxHeight: "400px", overflowY: "auto" }}>
                      <div className="p-2 border-bottom bg-light">
                        <strong>Notifications</strong>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-3 text-muted">No notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification._id} 
                            className={`p-2 border-bottom cursor-pointer ${notification.status === 'unread' ? 'bg-light' : ''}`}
                            onClick={() => {
                              navigate('/team-absence');
                              setShowNotifications(false);
                              markAsRead(notification._id);
                            }}
                          >
                            <div className="small fw-bold">{notification.title}</div>
                            <div className="small text-muted">{notification.message}</div>
                            <div className="small text-muted">{new Date(notification.createdAt).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="position-relative">
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  {userEmail} ▼
                </button>
                {showProfileDropdown && (
                  <div className="position-absolute end-0 mt-2 bg-white border rounded shadow" style={{ zIndex: 1000, minWidth: "150px" }}>
                    <button className="dropdown-item btn" onClick={() => navigate("/profile")}>
                      Profile
                    </button>
                    <button className="dropdown-item btn text-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}