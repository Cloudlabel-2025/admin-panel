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
          <h5>{userRole === "super-admin" ? "Admin Panel" : "Employee Panel"}</h5>
        </div>
        <nav className="nav flex-column">
          {userRole === "super-admin" ? (
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
              <button className="nav-link text-white btn btn-link text-start" onClick={() => navigate("/accounting/cash")}>
                Cash Management
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
          ) : (
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
                Absencse
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