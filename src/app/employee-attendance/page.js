"use client";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import * as XLSX from "xlsx";

export default function EmployeeAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    halfDays: 0,
    totalHours: 0,
    avgHours: 0,
    attendancePercentage: 0
  });

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    if (empId) {
      setEmployeeId(empId);
      fetchEmployeeData(empId);
      fetchAttendance(empId);
    }
  }, []);

  const fetchEmployeeData = async (empId) => {
    try {
      const res = await fetch(`/api/Employee/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployeeData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async (empId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?employeeId=${empId}`);
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
    const totalDays = data.length;
    const presentDays = data.filter(a => a.status === "Present").length;
    const absentDays = data.filter(a => a.status === "Absent").length;
    const halfDays = data.filter(a => a.status === "Half Day").length;
    const totalHours = data.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const avgHours = totalDays > 0 ? totalHours / totalDays : 0;
    const attendancePercentage = totalDays > 0 ? (presentDays + halfDays * 0.5) / totalDays * 100 : 0;
    
    setStats({
      totalDays,
      presentDays,
      absentDays,
      halfDays,
      totalHours: totalHours.toFixed(2),
      avgHours: avgHours.toFixed(2),
      attendancePercentage: attendancePercentage.toFixed(1)
    });
  };

  const exportToExcel = () => {
    const wsData = attendance.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      Status: a.status,
      LoginTime: a.loginTime || "-",
      LogoutTime: a.logoutTime || "-",
      TotalHours: a.totalHours?.toFixed(2) || 0,
      PermissionHours: a.permissionHours?.toFixed(2) || 0,
      OvertimeHours: a.overtimeHours?.toFixed(2) || 0,
      Remarks: a.remarks || "-"
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Attendance");
    XLSX.writeFile(wb, `My_Attendance_${employeeId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!employeeId) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="alert alert-warning">
            Please login as an employee to view attendance.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>My Attendance</h2>
          <button className="btn btn-primary" onClick={exportToExcel}>
            Export My Attendance
          </button>
        </div>

        {/* Employee Info */}
        {employeeData && (
          <div className="card mb-4">
            <div className="card-body">
              <h5>Employee Information</h5>
              <div className="row">
                <div className="col-md-3">
                  <p><strong>Name:</strong> {employeeData.firstName} {employeeData.lastName}</p>
                </div>
                <div className="col-md-3">
                  <p><strong>Employee ID:</strong> {employeeData.employeeId}</p>
                </div>
                <div className="col-md-3">
                  <p><strong>Department:</strong> {employeeData.department}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5>{stats.totalDays}</h5>
                <p>Total Days</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5>{stats.presentDays}</h5>
                <p>Present</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <h5>{stats.absentDays}</h5>
                <p>Absent</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h5>{stats.halfDays}</h5>
                <p>Half Day</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5>{stats.totalHours}</h5>
                <p>Total Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="card">
          <div className="card-body">
            <h5>My Attendance Records</h5>
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
                      <th>Status</th>
                      <th>Login Time</th>
                      <th>Logout Time</th>
                      <th>Total Hours</th>
                      <th>Permission Hours</th>
                      <th>Overtime Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                    {attendance.map((a, idx) => (
                      <tr key={idx}>
                        <td>{new Date(a.date).toLocaleDateString()}</td>
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