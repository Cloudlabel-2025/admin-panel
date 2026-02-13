"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../components/Layout";
import { formatDate } from "../utilis/dateFormat";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    attendance: { present: 0, total: 0, rate: 0 },
    tasks: { completed: 0, pending: 0, total: 0 },
    leaves: { used: 0, available: 0 },
    performance: 0,
    recentActivities: []
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    
    if (!empId || !role) {
      router.push("/");
      return;
    }

    setEmployeeId(empId);
    fetchDashboardData(empId);
  }, [router]);

  const fetchDashboardData = async (empId) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Fetch attendance
      const attendanceRes = await fetch(`/api/attendance?employeeId=${empId}&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`);
      const attendanceData = await attendanceRes.json();
      const presentDays = Array.isArray(attendanceData) ? attendanceData.filter(a => a.status === 'Present').length : 0;
      const totalDays = Array.isArray(attendanceData) ? attendanceData.length : 0;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Fetch daily tasks
      const tasksRes = await fetch(`/api/daily-task?employeeId=${empId}`);
      const tasksData = await tasksRes.json();
      let completedTasks = 0, pendingTasks = 0, totalTasks = 0;
      if (Array.isArray(tasksData) && tasksData.length > 0) {
        tasksData.forEach(day => {
          if (day.tasks) {
            totalTasks += day.tasks.length;
            completedTasks += day.tasks.filter(t => t.status === 'Completed').length;
            pendingTasks += day.tasks.filter(t => t.status !== 'Completed').length;
          }
        });
      }

      // Fetch leaves
      const leavesRes = await fetch(`/api/absence?employeeId=${empId}`);
      const leavesData = await leavesRes.json();
      const usedLeaves = Array.isArray(leavesData) ? leavesData.filter(l => l.status === 'Approved').reduce((sum, l) => sum + (l.totalDays || 0), 0) : 0;

      // Recent activities
      const recentActivities = [];
      
      if (Array.isArray(attendanceData) && attendanceData.length > 0) {
        attendanceData.slice(-3).forEach((att, i) => {
          recentActivities.push({
            id: `att-${i}`,
            action: `Attendance marked: ${att.status} (${att.totalHours || 0}h)`,
            time: formatDate(att.date),
            type: att.status === 'Present' ? 'success' : 'info'
          });
        });
      }

      if (Array.isArray(leavesData) && leavesData.length > 0) {
        leavesData.slice(-2).forEach((leave, i) => {
          recentActivities.push({
            id: `leave-${i}`,
            action: `Leave ${leave.status}: ${leave.absenceType} (${leave.totalDays} days)`,
            time: formatDate(leave.createdAt),
            type: leave.status === 'Approved' ? 'success' : 'info'
          });
        });
      }

      setDashboardData({
        attendance: { present: presentDays, total: totalDays, rate: attendanceRate },
        tasks: { completed: completedTasks, pending: pendingTasks, total: totalTasks },
        leaves: { used: usedLeaves, available: Math.max(0, 20 - usedLeaves) },
        performance: Math.min(100, Math.round((completedTasks / Math.max(1, totalTasks)) * 100)),
        recentActivities: recentActivities.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
              <i className="bi bi-speedometer2 me-2"></i>My Dashboard
            </h2>
            <p className="mb-0" style={{ color: '#f4e5c3' }}>
              Overview of your performance and activities
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/attendance" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-calendar-check me-2"></i>Attendance</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.attendance.rate}%</h2>
                    <small style={{ color: '#C9A961' }}>{dashboardData.attendance.present}/{dashboardData.attendance.total} days</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-calendar-check"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/daily-task" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-list-check me-2"></i>Tasks</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.tasks.completed}</h2>
                    <small style={{ color: '#C9A961' }}>{dashboardData.tasks.pending} pending</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-list-check"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/absence" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-calendar-x me-2"></i>Leaves</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.leaves.available}</h2>
                    <small style={{ color: '#C9A961' }}>{dashboardData.leaves.used} used</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-calendar-x"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="col-lg-3 col-md-6 mb-3">
          <Link href="/my-performance" style={{ textDecoration: 'none' }}>
            <div className="card h-100" style={{ cursor: 'pointer', transition: 'all 0.3s', background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', border: '2px solid #d4af37', backdropFilter: 'blur(10px)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(212, 175, 55, 0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title mb-1" style={{ color: '#d4af37' }}><i className="bi bi-graph-up me-2"></i>Performance</h6>
                    <h2 className="mb-0" style={{ color: '#f4e5c3' }}>{dashboardData.performance}%</h2>
                    <small style={{ color: '#C9A961' }}>Task completion</small>
                  </div>
                  <div className="fs-1" style={{ color: 'rgba(212, 175, 55, 0.8)' }}><i className="bi bi-graph-up"></i></div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Charts and Activities */}
      <div className="row">
        {/* Performance Overview */}
        <div className="col-lg-8 mb-4">
          <div className="card h-100" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-graph-up me-2"></i>My Performance Overview</h5>
            </div>
            <div className="card-body">
              {/* Monthly Attendance Chart */}
              <div className="mb-4">
                <h6 className="text-muted mb-3">Monthly Attendance Trend</h6>
                <div className="row text-center">
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '85px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>85%</div>
                      </div>
                    </div>
                    <small className="text-muted">Week 1</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '92px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>92%</div>
                      </div>
                    </div>
                    <small className="text-muted">Week 2</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: '88px', width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>88%</div>
                      </div>
                    </div>
                    <small className="text-muted">Week 3</small>
                  </div>
                  <div className="col-3">
                    <div className="mb-2">
                      <div style={{height: `${dashboardData.attendance.rate}px`, width: '100%', borderRadius: '8px', position: 'relative', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                        <div className="position-absolute bottom-0 start-50 translate-middle-x fw-bold pb-1 small" style={{ color: '#1a1a1a' }}>{dashboardData.attendance.rate}%</div>
                      </div>
                    </div>
                    <small className="text-muted">Week 4</small>
                  </div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div>
                <h6 className="text-muted mb-3">My Performance Indicators</h6>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Attendance Rate</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>{dashboardData.attendance.rate}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: `${dashboardData.attendance.rate}%`, background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Task Completion</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>{dashboardData.performance}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: `${dashboardData.performance}%`, background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Leave Balance</span>
                    <span className="fw-bold" style={{ color: '#d4af37' }}>{Math.round((dashboardData.leaves.available / 20) * 100)}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px', backgroundColor: '#e0e0e0' }}>
                    <div className="progress-bar" style={{width: `${(dashboardData.leaves.available / 20) * 100}%`, background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="col-lg-4">
          <div className="card mb-4" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-clock-history me-2"></i>Recent Activities</h5>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
        </div>
      </div>
    </Layout>
  );
}
