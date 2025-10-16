"use client";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
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
    const wsData = attendance.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      EmployeeID: a.employeeId,
      EmployeeName: a.employeeName,
      Status: a.status,
      TotalHours: a.totalHours?.toFixed(2) || 0,
      PermissionHours: a.permissionHours?.toFixed(2) || 0,
      LoginTime: a.loginTime || "-",
      LogoutTime: a.logoutTime || "-",
      Remarks: a.remarks || "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
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
        alert("Attendance generated from timecard data");
        fetchAttendance();
      } else {
        alert("Failed to generate attendance");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating attendance");
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
      const totalDays = employeeAttendance.length;
      const presentDays = employeeAttendance.filter(a => a.status === "Present").length;
      const absentDays = employeeAttendance.filter(a => a.status === "Absent").length;
      const halfDays = employeeAttendance.filter(a => a.status === "Half Day").length;
      const totalHours = employeeAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
      const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
      const attendancePercentage = totalDays > 0 ? (presentDays + halfDays * 0.5) / totalDays * 100 : 0;
      
      return {
        totalDays,
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
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="text-primary mb-1">
              {isAdmin ? "📊 Attendance Management" : "📅 My Attendance"}
            </h1>
            <small className="text-muted">
              {isAdmin ? "Monitor and manage employee attendance" : "Track your attendance records"}
            </small>
          </div>
          <div className="d-flex gap-2">
            {isAdmin ? (
              <>
                <button className="btn btn-success" onClick={exportToExcel}>
                  📊 Export Excel
                </button>
                <button className="btn btn-info" onClick={generateAttendance}>
                  🔄 Generate from Timecard
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={exportToExcel}>
                📊 Export My Attendance
              </button>
            )}
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
                    <div className="mb-2" style={{fontSize: '2rem'}}>✅</div>
                    <h4 className="mb-1">{stats.totalPresent}</h4>
                    <small>Present</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-primary text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>🏢</div>
                    <h4 className="mb-1">{stats.totalInOffice}</h4>
                    <small>In Office</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-warning text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>⏰</div>
                    <h4 className="mb-1">{stats.totalHalfDay}</h4>
                    <small>Half Day</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-danger text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>❌</div>
                    <h4 className="mb-1">{stats.totalAbsent}</h4>
                    <small>Absent</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-8 col-sm-12 mb-3">
                <div className="card bg-info text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>⏱️</div>
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
                    <div className="mb-2" style={{fontSize: '2rem'}}>📅</div>
                    <h4 className="mb-1">{employeeStats.totalDays}</h4>
                    <small>Total Days</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-success text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>✅</div>
                    <h4 className="mb-1">{employeeStats.presentDays}</h4>
                    <small>Present</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-danger text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>❌</div>
                    <h4 className="mb-1">{employeeStats.absentDays}</h4>
                    <small>Absent</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-warning text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>⏰</div>
                    <h4 className="mb-1">{employeeStats.halfDays}</h4>
                    <small>Half Day</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-info text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>⏱️</div>
                    <h4 className="mb-1">{employeeStats.totalHours}h</h4>
                    <small>Total Hours</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                <div className="card bg-secondary text-white shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <div className="mb-2" style={{fontSize: '2rem'}}>📊</div>
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
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">🔍 Filter Options</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-lg-2 col-md-4">
                  <label className="form-label fw-semibold">📅 Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-lg-2 col-md-4">
                  <label className="form-label fw-semibold">📅 End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-lg-3 col-md-4">
                  <label className="form-label fw-semibold">👥 Employee</label>
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
                  <label className="form-label fw-semibold">📊 Status</label>
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="Present">✅ Present</option>
                    <option value="Half Day">⏰ Half Day</option>
                    <option value="Absent">❌ Absent</option>
                  </select>
                </div>
                <div className="col-lg-3 col-md-4 d-flex align-items-end">
                  <button className="btn btn-primary w-100" onClick={fetchAttendance}>
                    🔍 Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Attendance Table */}
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📋 Attendance Records</h5>
              <div className="badge bg-light text-dark fs-6">
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
                  <thead className="table-light">
                    <tr>
                      <th>📅 Date</th>
                      <th>🆔 Employee ID</th>
                      <th>👤 Employee Name</th>
                      <th>🏢 Department</th>
                      <th>📊 Status</th>
                      <th>🕐 Login</th>
                      <th>🕕 Logout</th>
                      <th>⏱️ Total Hours</th>
                      <th>🚪 Permission</th>
                      <th>⏰ Overtime</th>
                      <th>📝 Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-5">
                          <div style={{fontSize: '3rem'}}>📋</div>
                          <p className="text-muted mt-2 mb-0">No attendance records found.</p>
                        </td>
                      </tr>
                    )}
                    {attendance.map((a, idx) => (
                      <tr key={idx}>
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
                            a.status === 'In Office' ? 'bg-primary' : 'bg-danger'
                          }`}>
                            {a.status === 'Present' ? '✅ Present' :
                             a.status === 'Half Day' ? '⏰ Half Day' :
                             a.status === 'In Office' ? '🏢 In Office' : '❌ Absent'}
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
    </Layout>
  );
}
