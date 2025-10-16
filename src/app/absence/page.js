"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function AbsencePage() {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    absenceType: "",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [filter, setFilter] = useState({ status: "", employeeId: "" });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const empId = localStorage.getItem("employeeId") || "";
    setUserRole(role);
    
    // Admin roles can manage all employees, others manage themselves
    if (role === "super-admin" || role === "Super-admin" || role === "admin" || role === "Team-Lead" || role === "Team-admin") {
      fetchEmployees();
    } else if (empId) {
      fetchCurrentEmployee(empId);
    }
    fetchAbsences();
  }, []);

  const fetchCurrentEmployee = async (empId) => {
    try {
      const res = await fetch(`/api/Employee/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentEmployee(data);
        setForm(prev => ({
          ...prev,
          employeeId: data.employeeId,
          employeeName: `${data.firstName} ${data.lastName}`,
          department: data.department
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

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

  const fetchAbsences = async () => {
    try {
      let url = "/api/absence";
      const params = new URLSearchParams();
      
      // For personal absence page, always filter by current user's employeeId
      const currentEmployeeId = localStorage.getItem("employeeId");
      if (currentEmployeeId) {
        params.append("employeeId", currentEmployeeId);
      }
      
      if (filter.status) params.append("status", filter.status);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAbsences(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setForm({
        ...form,
        employeeId: empId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.absenceType || !form.startDate || !form.endDate || !form.reason) {
      setSuccessMessage("Please fill all required fields");
      setShowSuccess(true);
      return;
    }

    setLoading(true);
    try {
      // For personal requests, ensure we use current user's employeeId
      const submitForm = { ...form };
      if (userRole !== "super-admin" && userRole !== "Super-admin" && userRole !== "admin" && userRole !== "Team-Lead" && userRole !== "Team-admin") {
        submitForm.employeeId = localStorage.getItem("employeeId");
      }
      
      const res = await fetch("/api/absence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitForm)
      });

      if (res.ok) {
        setSuccessMessage("Absence request submitted successfully");
        setShowSuccess(true);
        setForm({
          employeeId: "",
          employeeName: "",
          department: "",
          absenceType: "",
          startDate: "",
          endDate: "",
          reason: ""
        });
        fetchAbsences();
      } else {
        const errorData = await res.json();
        setSuccessMessage(errorData.error || "Failed to submit absence request");
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error submitting request");
      setShowSuccess(true);
    }
    setLoading(false);
  };

  const handleApproval = async (id, action, comments = "") => {
    try {
      const res = await fetch("/api/absence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: id,
          action,
          approvedBy: localStorage.getItem("employeeId") || "Admin",
          comments
        })
      });

      if (res.ok) {
        setSuccessMessage(`Absence ${action}d successfully`);
        setShowSuccess(true);
        fetchAbsences();
      } else {
        setSuccessMessage(`Failed to ${action} absence`);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const viewAbsenceDetails = (absence) => {
    setSuccessMessage(`Employee: ${absence.employeeName}\nType: ${absence.absenceType}\nDates: ${new Date(absence.startDate).toLocaleDateString()} - ${new Date(absence.endDate).toLocaleDateString()}\nReason: ${absence.reason}`);
    setShowSuccess(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger"
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        {showSuccess && (
          <SuccessMessage 
            message={successMessage} 
            onClose={() => setShowSuccess(false)} 
          />
        )}
        <h2 className="mb-4">Absence Management</h2>

        {/* Submit Absence Request */}
        <div className="card mb-4">
          <div className="card-body">
            <h5>Submit Absence Request</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin") ? (
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Employee</label>
                    <select
                      className="form-select"
                      value={form.employeeId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Employee</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${form.employeeName} (${form.employeeId})`}
                      readOnly
                    />
                  </div>
                )}
                <div className="col-md-4 mb-3">
                  <label className="form-label">Absence Type</label>
                  <select
                    className="form-select"
                    value={form.absenceType}
                    onChange={(e) => setForm({...form, absenceType: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                  </select>
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-2 mb-3">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-8 mb-3">
                  <label className="form-label">Reason</label>
                  <textarea
                    className="form-control"
                    value={form.reason}
                    onChange={(e) => setForm({...form, reason: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3 d-flex align-items-end">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filter.status}
                  onChange={(e) => setFilter({...filter, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-outline-primary" onClick={fetchAbsences}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Absence Records */}
        <div className="card">
          <div className="card-body">
            <h5>Absence Records</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>

                    {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin") && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {absences.map(absence => (
                    <tr key={absence._id}>
                      <td>{absence.employeeName} ({absence.employeeId})</td>
                      <td>{absence.absenceType}</td>
                      <td>{new Date(absence.startDate).toLocaleDateString()}</td>
                      <td>{new Date(absence.endDate).toLocaleDateString()}</td>
                      <td>{absence.totalDays}</td>
                      <td>{absence.reason}</td>
                      <td><span className={getStatusBadge(absence.status)}>{absence.status}</span></td>

                      {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin") && (
                        <td>
                          {absence.status === "Pending" ? (
                            <>
                              <button
                                className="btn btn-success btn-sm me-1"
                                onClick={() => handleApproval(absence._id, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleApproval(absence._id, "reject")}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn btn-info btn-sm"
                              onClick={() => viewAbsenceDetails(absence)}
                            >
                              View
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}