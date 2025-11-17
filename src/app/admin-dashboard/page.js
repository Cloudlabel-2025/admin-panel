"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../components/Layout";
import { formatDate } from "../utilis/dateFormat";

export default function AdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    employees: 0,
    totalRevenue: 0,
    attendanceRate: 0,
    activeProjects: 0,
    recentActivities: []
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "developer" || role === "Team-Lead" || role === "Team-admin")) {
      router.push("/");
      return;
    }


    setUserRole(role);
    if (role === "admin") {
      fetchNotifications();
    }
    fetchDashboardData();
    setLoading(false);
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?role=admin");
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch employees data
      const employeesRes = await fetch('/api/Employee').catch(() => ({ json: () => [] }));
      const employees = await employeesRes.json();
      const totalEmployees = Array.isArray(employees) ? employees.length : 0;
      
      // Fetch transactions for revenue
      let totalRevenue = 0;
      try {
        const transactionsRes = await fetch('/api/accounting/transactions');
        if (transactionsRes.ok) {
          const transactions = await transactionsRes.json();
          totalRevenue = Array.isArray(transactions) ? 
            transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) : 0;
        }
      } catch (error) {
        console.log('Transactions API unavailable, using fallback');
        totalRevenue = 125000; // Fallback
      }
      
      // Fetch attendance data
      let attendanceRate = 87; // Default fallback
      try {
        const attendanceRes = await fetch('/api/attendance');
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          if (Array.isArray(attendanceData) && attendanceData.length > 0) {
            const presentCount = attendanceData.filter(a => a.status === 'Present').length;
            attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
          }
        }
      } catch (error) {
        console.log('Attendance API unavailable, using fallback');
      }
      
      // Fetch projects data
      let activeProjects = 8; // Default fallback
      try {
        const projectsRes = await fetch('/api/project');
        if (projectsRes.ok) {
          const projects = await projectsRes.json();
          activeProjects = Array.isArray(projects) ? 
            projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length : 0;
        }
      } catch (error) {
        console.log('Projects API unavailable, using fallback');
      }
      
      // Recent activities from real data
      const recentActivities = [];
      
      // Add recent employee activities
      if (Array.isArray(employees) && employees.length > 0) {
        employees.slice(-3).forEach((emp, index) => {
          recentActivities.push({
            id: `emp-${index}`,
            action: `Employee "${emp.firstName} ${emp.lastName}" joined ${emp.department || 'the team'}`,
            time: formatDate(emp.createdAt || Date.now()),
            type: 'success'
          });
        });
      }
      
      // Add recent transaction activities
      try {
        const transactionsRes = await fetch('/api/accounting/transactions');
        if (transactionsRes.ok) {
          const transactions = await transactionsRes.json();
          if (Array.isArray(transactions) && transactions.length > 0) {
            transactions.slice(-2).forEach((txn, index) => {
              recentActivities.push({
                id: `txn-${index}`,
                action: `${txn.type || 'Transaction'}: ₹${parseFloat(txn.amount || 0).toLocaleString()}`,
                time: formatDate(txn.date || txn.createdAt || Date.now()),
                type: 'info'
              });
            });
          }
        }
      } catch (error) {
        console.log('Unable to fetch recent transactions');
      }
      
      // Add system activities if no real data
      if (recentActivities.length === 0) {
        recentActivities.push(
          {
            id: 'sys-1',
            action: 'System backup completed successfully',
            time: formatDate(new Date()),
            type: 'info'
          },
          {
            id: 'sys-2', 
            action: 'Monthly attendance report generated',
            time: formatDate(Date.now() - 86400000),
            type: 'success'
          }
        );
      }
      
      setDashboardData({
        employees: totalEmployees,
        totalRevenue: Math.round(totalRevenue),
        attendanceRate,
        activeProjects,
        recentActivities: recentActivities.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback data
      setDashboardData({
        employees: 0,
        totalRevenue: 0,
        attendanceRate: 0,
        activeProjects: 0,
        recentActivities: []
      });
    }
  };

  if (loading || !(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "developer" || userRole === "Team-Lead" || userRole === "Team-admin")) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="rounded shadow-sm p-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
            <h2 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
              <i className="bi bi-speedometer2 me-2"></i>{(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "developer") ? "Admin Dashboard" : "Team Management Dashboard"}
            </h2>
            <p className="mb-0" style={{ color: '#f4e5c3' }}>
              {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "developer") ?
                "Overview of your organization's key metrics and activities" :
                "Monitor your team's performance and activities"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/employees/employees-list" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-people-fill me-2"></i>Employees</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.employees}</h2>
                    <small style={{ color: '#C9A961' }}>Total registered</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-people-fill"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/accounting/transactions" style={{ textDecoration: 'none' }}>
            <div className="card h-100 position-relative" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-currency-rupee me-2"></i>Revenue</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }} title={`₹${dashboardData.totalRevenue.toLocaleString('en-IN')}`}>₹{(() => {
                      const amount = dashboardData.totalRevenue;
                      const str = amount.toString();
                      if (str.length > 6) {
                        if (amount >= 10000000) return (amount / 10000000).toFixed(2) + 'Cr';
                        if (amount >= 100000) return (amount / 100000).toFixed(2) + 'L';
                      }
                      return amount.toLocaleString('en-IN');
                    })()}</h2>
                    <small style={{ color: '#C9A961' }}>Total transactions</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-currency-rupee"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/attendance" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-calendar-check me-2"></i>Attendance</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.attendanceRate}%</h2>
                    <small style={{ color: '#C9A961' }}>This month</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-calendar-check"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/project" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-kanban me-2"></i>Projects</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.activeProjects}</h2>
                    <small style={{ color: '#C9A961' }}>Active projects</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-kanban"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts and Activities */}
      <div className="row">
        {/* Chart Section */}
        <div className="col-lg-8 mb-4">
          <div className="card h-100" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-graph-up me-2"></i>Performance Overview</h5>
            </div>
            <div className="card-body">
              {/* Monthly Performance Chart */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Monthly Performance</h6>
                <div className="row text-center">
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '85px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>85%</div>
                      </div>
                    </div>
                    <small className="text-muted">Jan</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '92px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>92%</div>
                      </div>
                    </div>
                    <small className="text-muted">Feb</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '78px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>78%</div>
                      </div>
                    </div>
                    <small className="text-muted">Mar</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: `${dashboardData.attendanceRate}px`, width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>{dashboardData.attendanceRate}%</div>
                      </div>
                    </div>
                    <small className="text-muted">Apr</small>
                  </div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div>
                <h6 className="text-muted mb-3">Key Performance Indicators</h6>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Employee Attendance</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>{dashboardData.attendanceRate}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: `${dashboardData.attendanceRate}%`, background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Project Completion</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>75%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: '75%', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Revenue Target</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>68%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: '68%', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Activities and Notifications */}
        <div className="col-lg-4">
          {/* Recent Activities */}
          <div className="card mb-4" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-clock-history me-2"></i>Recent Activities</h5>
            </div>
            <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 ? dashboardData.recentActivities.map((activity) => (
                <div key={activity.id} className="d-flex align-items-start mb-3 p-2 rounded" style={{ background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <div className="me-3 mt-1" style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activity.type === 'success' ? 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)' : 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', color: activity.type === 'success' ? '#1a1a1a' : '#d4af37' }}>
                    <i className={`bi ${activity.type === 'success' ? 'bi-check-lg' : 'bi-info-lg'}`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-bold">{activity.action}</div>
                    <small className="text-muted">{activity.time}</small>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted py-4">
                  <div className="mb-2">📄</div>
                  <p className="mb-0">No recent activities</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Notifications Panel for Admin */}
          {userRole === "admin" && (
            <div className="card" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-bell me-2"></i>Notifications</h5>
              </div>
              <div className="card-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <p className="text-muted text-center">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className={`alert ${notification.read ? 'alert-secondary' : 'alert-info'} alert-dismissible p-2 mb-2`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong className="small">{notification.title}</strong>
                          <p className="mb-1 small">{notification.message}</p>
                          <small className="text-muted">
                            {formatDate(notification.createdAt)}
                          </small>
                        </div>
                        {!notification.read && (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => markAsRead(notification._id)}
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}