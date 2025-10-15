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
          <h2>
            {isAdmin ? "Attendance Management" : "My Attendance"}
          </h2>
          {isAdmin ? (
            <div>
              <button className="btn btn-success me-2" onClick={exportToExcel}>
                Export Excel
              </button>
              <button className="btn btn-info" onClick={generateAttendance}>
                Generate from Timecard
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={exportToExcel}>
              Export My Attendance
            </button>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          {isAdmin ? (
            // Admin view - overall stats
            <>
              <div className="col-md-2">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h5>{stats.totalPresent}</h5>
                    <p>Present</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h5>{stats.totalInOffice}</h5>
                    <p>In Office</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h5>{stats.totalHalfDay}</h5>
                    <p>Half Day</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-danger text-white">
                  <div className="card-body text-center">
                    <h5>{stats.totalAbsent}</h5>
                    <p>Absent</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h5>{stats.avgHours.toFixed(1)}</h5>
                    <p>Average Hours</p>
                  </div>
                </div>
              </div>
            </>
          ) : employeeStats ? (
            // Employee view - personal stats
            <>
              <div className="col-md-2">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.totalDays}</h5>
                    <p>Total Days</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-success text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.presentDays}</h5>
                    <p>Present</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-danger text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.absentDays}</h5>
                    <p>Absent</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-warning text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.halfDays}</h5>
                    <p>Half Day</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.totalHours}</h5>
                    <p>Total Hours</p>
                  </div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="card bg-secondary text-white">
                  <div className="card-body text-center">
                    <h5>{employeeStats.attendancePercentage}%</h5>
                    <p>Attendance</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Filters */}
        {isAdmin && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-2">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Employee</label>
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
                <div className="col-md-2">
                  <label className="form-label">Status</label>
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
                <div className="col-md-3 d-flex align-items-end">
                  <button className="btn btn-primary w-100" onClick={fetchAttendance}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Attendance Table */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center mt-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Login</th>
                      <th>Logout</th>
                      <th>Total Hours</th>
                      <th>Permission</th>
                      <th>Overtime</th>

                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center text-muted">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                    {attendance.map((a, idx) => (
                      <tr key={idx}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
                        <td>{a.employeeId}</td>
                        <td>{a.employeeName || "Unknown"}</td>
                        <td>{a.department || "Unknown"}</td>
                        <td>
                          <span className={`badge ${
                            a.status === 'Present' ? 'bg-success' : 
                            a.status === 'Half Day' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td>{a.loginTime || "-"}</td>
                        <td>{a.logoutTime || "-"}</td>
                        <td>{(a.totalHours || 0).toFixed(2)}</td>
                        <td>{(a.permissionHours || 0).toFixed(2)}</td>
                        <td>{(a.overtimeHours || 0).toFixed(2)}</td>

                        <td>{a.remarks || "-"}</td>
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
