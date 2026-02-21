"use client";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";
import * as XLSX from "xlsx";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [userRole, setUserRole] = useState("");

  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalHalfDay: 0,
    totalInOffice: 0,
    avgHours: 0
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId") || "";
    
    setUserRole(role);
    // Only super-admin and admin get full admin access
    // Team roles get personal view by default
    setIsAdmin(role === "super-admin" || role === "Super-admin" || role === "admin");
    setEmployeeId(empId);
    
    // For team roles, show their personal attendance by default
    if (role === "Team-Lead" || role === "Team-admin") {
      setSelectedEmployee(empId);
    }
    
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const userRole = localStorage.getItem("userRole");
      const empId = localStorage.getItem("employeeId");
      
      let url = "/api/Employee/search";
      
      // For team roles, filter by department
      if ((userRole === "Team-Lead" || userRole === "Team-admin") && empId) {
        // Get current user's department first
        const userRes = await fetch(`/api/Employee/${empId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          url += `?department=${userData.department}`;
        }
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const currentUserRole = localStorage.getItem("userRole");
      const empId = localStorage.getItem("employeeId");
      
      // Add user role for API filtering
      if (currentUserRole) params.append("userRole", currentUserRole);
      
      if (!isAdmin && employeeId) {
        params.append("employeeId", employeeId);
      }
      
      if (isAdmin || currentUserRole === "Team-Lead" || currentUserRole === "Team-admin") {
        params.append("admin", "true");
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (selectedEmployee) params.append("employeeId", selectedEmployee);
        if (statusFilter) params.append("status", statusFilter);
        
        // Add department filter for team roles
        if ((currentUserRole === "Team-Lead" || currentUserRole === "Team-admin") && empId) {
          try {
            const userRes = await fetch(`/api/Employee/${empId}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              params.append("userDepartment", userData.department);
            }
          } catch (err) {
            console.error('Error getting user department:', err);
          }
        }
      }

      const res = await fetch("/api/attendance?" + params.toString());
      const data = await res.json();
      const attendanceData = Array.isArray(data) ? data : [];
      setAttendance(attendanceData);
      calculateStats(attendanceData);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalPresent = data.filter(a => a.status === "Present").length;
    const totalAbsent = data.filter(a => a.status === "Absent").length;
    const totalHalfDay = data.filter(a => a.status === "Half Day").length;
    const totalInOffice = data.filter(a => a.status === "In Office").length;
    const avgHours = data.length > 0 ? data.reduce((sum, a) => sum + (a.totalHours || 0), 0) / data.length : 0;
    
    setStats({ totalPresent, totalAbsent, totalHalfDay, totalInOffice, avgHours });
  };



  const exportToExcel = () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Group by employee for monthly summary
    const employeeMap = {};
    attendance.forEach(a => {
      if (!employeeMap[a.employeeId]) {
        employeeMap[a.employeeId] = {
          employeeId: a.employeeId,
          employeeName: a.employeeName,
          department: a.department,
          present: 0,
          absent: 0,
          halfDay: 0,
          logoutMissing: 0,
          lateLogins: 0,
          totalHours: 0,
          totalOvertime: 0
        };
      }
      const emp = employeeMap[a.employeeId];
      if (a.status === 'Present') emp.present++;
      if (a.status === 'Absent') emp.absent++;
      if (a.status === 'Half Day') emp.halfDay++;
      if (a.status === 'Logout Missing') emp.logoutMissing++;
      if (a.isLateLogin) emp.lateLogins++;
      emp.totalHours += a.totalHours || 0;
      emp.totalOvertime += a.overtimeHours || 0;
    });
    
    const summaryData = Object.values(employeeMap).map(emp => {
      const totalDays = new Date(currentYear, currentMonth, 0).getDate();
      const attendancePercentage = totalDays > 0 
        ? ((emp.present + emp.halfDay * 0.5) / totalDays * 100).toFixed(2)
        : 0;
      
      return {
        EmployeeID: emp.employeeId,
        EmployeeName: emp.employeeName,
        Department: emp.department,
        Present: emp.present,
        Absent: emp.absent,
        HalfDay: emp.halfDay,
        LogoutMissing: emp.logoutMissing,
        LateLogins: emp.lateLogins,
        TotalHours: emp.totalHours.toFixed(2),
        TotalOvertime: emp.totalOvertime.toFixed(2),
        AttendancePercentage: attendancePercentage + '%'
      };
    });
    
    const detailData = attendance.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      EmployeeID: a.employeeId,
      EmployeeName: a.employeeName,
      Department: a.department,
      Status: a.status,
      TotalHours: a.totalHours?.toFixed(2) || 0,
      PermissionHours: a.permissionHours?.toFixed(2) || 0,
      OvertimeHours: a.overtimeHours?.toFixed(2) || 0,
      LoginTime: a.loginTime || "-",
      LogoutTime: a.logoutTime || "-",
      Late: a.isLateLogin ? `${a.lateByMinutes}m` : 'On Time',
      Remarks: a.remarks || "-"
    }));
    
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsDetail = XLSX.utils.json_to_sheet(detailData);
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Monthly Summary");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detailed Records");
    
    XLSX.writeFile(wb, `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const generateAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, employeeId: selectedEmployee })
      });
      
      if (res.ok) {
        setSuccessMessage("Attendance generated from timecard data");
        setShowSuccess(true);
        fetchAttendance();
      } else {
        setSuccessMessage("Failed to generate attendance");
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error generating attendance");
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin !== null) {
      if (isAdmin || employeeId) {
        fetchAttendance();
      }
    }
  }, [isAdmin, employeeId]);

  // Employee-specific stats calculation
  const getEmployeeStats = () => {
    if (!isAdmin && employeeId) {
      const employeeAttendance = attendance.filter(a => a.employeeId === employeeId);
      
      // Calculate total days in current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const presentDays = employeeAttendance.filter(a => a.status === "Present").length;
      const absentDays = employeeAttendance.filter(a => a.status === "Absent").length;
      const halfDays = employeeAttendance.filter(a => a.status === "Half Day").length;
      const totalHours = employeeAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
      const avgHours = employeeAttendance.length > 0 ? totalHours / employeeAttendance.length : 0;
      const attendancePercentage = totalDaysInMonth > 0 ? (presentDays + halfDays * 0.5) / totalDaysInMonth * 100 : 0;
      
      return {
        actualDays: totalDaysInMonth,
        totalDays: presentDays + halfDays + absentDays,
        presentDays,
        absentDays,
        halfDays,
        totalHours: totalHours.toFixed(2),
        avgHours: avgHours.toFixed(2),
        attendancePercentage: attendancePercentage.toFixed(1)
      };
    }
    return null;
  };

  const employeeStats = getEmployeeStats();

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container-fluid p-4">
        <div className="row align-items-center mb-4">
          <div className="col-md-6 mb-3 mb-md-0">
            <h1 className="mb-0 d-flex align-items-center" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700'}}>
              <i className="bi bi-calendar-check me-2"></i>
              {isAdmin ? "Attendance Management" : "My Attendance"}
            </h1>
            <small style={{ color: '#d4af37' }}>
              {isAdmin ? "Monitor and manage employee attendance" : "Track your attendance records"}
            </small>
          </div>
          <div className="col-md-6 text-md-end">
          <div className="d-flex gap-2 justify-content-md-end">
            {isAdmin ? (
              <>
                <button className="btn export-btn" onClick={exportToExcel} style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600', border: 'none', transition: 'all 0.3s ease'}}>
                  <i className="bi bi-file-earmark-excel me-1"></i> Export Excel
                </button>
                <button className="btn generate-btn" onClick={generateAttendance} style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', color: '#d4af37', border: '2px solid #d4af37', transition: 'all 0.3s ease'}}>
                  <i className="bi bi-arrow-repeat me-1"></i> Generate from Timecard
                </button>
              </>
            ) : (
              <button className="btn export-btn" onClick={exportToExcel} style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600', border: 'none', transition: 'all 0.3s ease'}}>
                <i className="bi bi-file-earmark-excel me-1"></i> Export My Attendance
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          {isAdmin ? (
            // Admin view - overall stats
            <>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-success text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-check-circle-fill"></i></div>
                    <h4 className="mb-1">{stats.totalPresent}</h4>
                    <small>Present</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-primary text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-building-fill"></i></div>
                    <h4 className="mb-1">{stats.totalInOffice}</h4>
                    <small>In Office</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-warning text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-clock-fill"></i></div>
                    <h4 className="mb-1">{stats.totalHalfDay}</h4>
                    <small>Half Day</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-danger text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-x-circle-fill"></i></div>
                    <h4 className="mb-1">{stats.totalAbsent}</h4>
                    <small>Absent</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-8 col-sm-12 mb-3">
                <div className="card bg-info text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-stopwatch-fill"></i></div>
                    <h4 className="mb-1">{stats.avgHours.toFixed(1)}h</h4>
                    <small>Average Hours</small>
                  </div>
                </div>
              </div>
            </>
          ) : employeeStats ? (
            // Employee view - personal stats
            <>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-primary text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-calendar-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.totalDays}</h4>
                    <small>Total Days</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-success text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-check-circle-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.presentDays}</h4>
                    <small>Present</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-danger text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-x-circle-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.absentDays}</h4>
                    <small>Absent</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-warning text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-clock-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.halfDays}</h4>
                    <small>Half Day</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-info text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-stopwatch-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.totalHours}h</h4>
                    <small>Total Hours</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-secondary text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}><i className="bi bi-bar-chart-fill"></i></div>
                    <h4 className="mb-1">{employeeStats.attendancePercentage}%</h4>
                    <small>Attendance</small>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Filters */}
        {isAdmin && (
          <div className="card shadow-sm mb-4" style={{borderRadius: '12px', overflow: 'hidden', border: '2px solid #d4af37'}}>
            <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
              <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filter Options</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-2 col-md-4">
                  <label className="form-label fw-semibold"><i className="bi bi-calendar-event me-1"></i>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-lg-2 col-md-4">
                  <label className="form-label fw-semibold"><i className="bi bi-calendar-check me-1"></i>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-lg-3 col-md-4">
                  <label className="form-label fw-semibold"><i className="bi bi-people me-1"></i>Employee</label>
                  <select
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-2 col-md-4">
                  <label className="form-label fw-semibold"><i className="bi bi-bar-chart me-1"></i>Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <div className="col-lg-3 col-md-4 d-flex align-items-end">
                  <button className="btn filter-btn w-100" onClick={fetchAttendance} style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', color: '#d4af37', border: '2px solid #d4af37', transition: 'all 0.3s ease'}}>
                    <i className="bi bi-search me-1"></i> Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Attendance Table */}
        <div className="card shadow-sm" style={{borderRadius: '12px', overflow: 'hidden', border: '2px solid #d4af37'}}>
          <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
            <div className="d-flex justify-content-between align-items-center py-2">
              <h5 className="mb-0"><i className="bi bi-table me-2"></i>Attendance Records</h5>
              <div className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>
                {attendance.length} Records
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading attendance records...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', borderBottom: '2px solid #d4af37'}}>
                    <tr>
                      <th><i className="bi bi-calendar-event me-1"></i>Date</th>
                      <th><i className="bi bi-person-badge me-1"></i>Employee ID</th>
                      <th><i className="bi bi-person me-1"></i>Employee Name</th>
                      <th><i className="bi bi-building me-1"></i>Department</th>
                      <th><i className="bi bi-bar-chart me-1"></i>Status</th>
                      <th><i className="bi bi-box-arrow-in-right me-1"></i>Login</th>
                      <th><i className="bi bi-box-arrow-right me-1"></i>Logout</th>
                      <th><i className="bi bi-clock me-1"></i>Total Hours</th>
                      <th><i className="bi bi-door-open me-1"></i>Permission</th>
                      <th><i className="bi bi-clock-history me-1"></i>Overtime</th>
                      <th><i className="bi bi-alarm me-1"></i>Late</th>
                      <th><i className="bi bi-chat-text me-1"></i>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-5">
                          <div style={{fontSize: '3rem'}}><i className="bi bi-clipboard-x text-muted"></i></div>
                          <p className="text-muted mt-2 mb-0">No attendance records found.</p>
                        </td>
                      </tr>
                    )}
                    {attendance.map((a, idx) => (
                      <tr key={idx} style={{transition: 'all 0.2s ease'}}>
                        <td>
                          <div className="fw-semibold">{new Date(a.date).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">{a.employeeId}</code>
                        </td>
                        <td>
                          <div className="fw-semibold">{a.employeeName || "Unknown"}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{a.department || "Unknown"}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            a.status === 'Present' ? 'bg-success' : 
                            a.status === 'Half Day' ? 'bg-warning text-dark' : 
                            a.status === 'Logout Missing' ? 'bg-warning text-dark' :
                            a.status === 'In Office' ? 'bg-primary' : 
                            a.status === 'Weekend' ? 'bg-dark' : 'bg-danger'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td>
                          <span className="text-success fw-semibold">{a.loginTime || "—"}</span>
                        </td>
                        <td>
                          <span className="text-danger fw-semibold">{a.logoutTime || "—"}</span>
                        </td>
                        <td>
                          <span className="badge bg-info">{(a.totalHours || 0).toFixed(2)}h</span>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark">{(a.permissionHours || 0).toFixed(2)}h</span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{(a.overtimeHours || 0).toFixed(2)}h</span>
                        </td>
                        <td>
                          {a.isLateLogin ? (
                            <span className="badge bg-danger">{a.lateByMinutes}m</span>
                          ) : (
                            <span className="badge bg-success">On Time</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">{a.remarks || "—"}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .table-hover tbody tr:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%);
          transform: scale(1.01);
          border-left: 3px solid #d4af37;
        }
        .export-btn:hover, .generate-btn:hover, .filter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(212, 175, 55, 0.3);
        }
        .export-btn:hover {
          background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%) !important;
          color: #d4af37 !important;
          border: 2px solid #d4af37 !important;
        }
        .generate-btn:hover, .filter-btn:hover {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%) !important;
          color: #000 !important;
        }
      `}</style>
    </Layout>
  );
}
