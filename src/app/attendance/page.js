"use client";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    setIsAdmin(localStorage.getItem("userRole") === "super-admin");
    setEmployeeId(localStorage.getItem("employeeId") || "");
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (!isAdmin && employeeId) {
        params.append("employeeId", employeeId);
      }
      
      if (isAdmin) {
        params.append("admin", "true");
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      }

      const res = await fetch("/api/attendance?" + params.toString());
      const data = await res.json();
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      setAttendance([]);
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

  return (
    <Layout>
      <div className="container-fluid mt-4">
        <h2>Attendance Records</h2>

        {isAdmin && (
          <div className="row mb-3">
            <div className="col-md-3">
              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button className="btn btn-primary" onClick={fetchAttendance}>
                Filter
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-dark text-center">
                <tr>
                  <th>Date</th>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Status</th>
                  <th>Total Hours</th>
                  <th>Permission Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No records found.
                    </td>
                  </tr>
                )}
                {attendance.map((a, idx) => (
                  <tr key={idx} className="text-center">
                    <td>{new Date(a.date).toLocaleDateString()}</td>
                    <td>{a.employeeId}</td>
                    <td>{a.employeeName}</td>
                    <td>
                      <span className={`badge ${
                        a.status === 'Present' ? 'bg-success' : 
                        a.status === 'Half Day' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{(a.totalHours || 0).toFixed(2)}</td>
                    <td>{(a.permissionHours || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
