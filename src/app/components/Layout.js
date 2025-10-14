"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Layout({ children }) {
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    setUserRole(role);
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const navigate = (path) => {
    router.push(path);
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
              <h6 className="text-white-50 px-3 mb-2">EMPLOYEE</h6>
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
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/inventory")}>
               Inventory
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
            </>
          )}

          {/* Team Admin - Department Administration */}
          {userRole === "Team-admin" && (
            <>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin-dashboard")}>
                Admin Dashboard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/admin/monitor")}>
                Monitor Department
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/project")}>
                Department Projects
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/attendance")}>
                Department Attendance
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/absence")}>
                Manage Absence
              </button>
              <hr className="text-white" />
              <h6 className="text-white-50 px-3 mb-2">PERSONAL</h6>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/timecard-entry")}>
                My Timecard
              </button>
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/daily-task")}>
                My Tasks
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
          <div className="ms-auto position-relative">
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
        </nav>

        {/* Page Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}