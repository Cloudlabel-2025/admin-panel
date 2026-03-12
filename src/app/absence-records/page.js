"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function AbsenceRecordsPage() {
  const [absences, setAbsences] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    employeeId: "",
    department: "",
    status: ""
  });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [stats, setStats] = useState({
    totalLeaves: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    totalDays: 0
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role);
    fetchEmployees();
    fetchAbsences();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/Employee/search");
      if (res.ok) {
        const data = await res.json();
        const empList = data.employees || [];
        setEmployees(empList);
        
        // Extract unique departments
        const depts = [...new Set(empList.map(e => e.department).filter(Boolean))];
        setDepartments(depts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      let url = "/api/absence?";
      const params = new URLSearchParams();
      
      if (filters.employeeId) params.append("employeeId", filters.employeeId);
      if (filters.status) params.append("status", filters.status);
      
      url += params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Filter by month and department on client side
        let filtered = data;
        
        if (filters.month) {
          const [year, month] = filters.month.split("-");
          filtered = filtered.filter(absence => {
            const startDate = new Date(absence.startDate);
            const endDate = new Date(absence.endDate);
            const filterStart = new Date(year, month - 1, 1);
            const filterEnd = new Date(year, month, 0);
            
            // Check if absence overlaps with selected month
            return (startDate <= filterEnd && endDate >= filterStart);
          });
        }
        
        if (filters.department) {
          filtered = filtered.filter(absence => absence.department === filters.department);
        }
        
        setAbsences(filtered);
        calculateStats(filtered);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error fetching absence records");
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      totalLeaves: data.length,
      approved: data.filter(a => a.status === "Approved").length,
      pending: data.filter(a => a.status === "Pending").length,
      rejected: data.filter(a => a.status === "Rejected").length,
      cancelled: data.filter(a => a.status === "Cancelled").length,
      totalDays: data.reduce((sum, a) => sum + (a.totalDays || 0), 0)
    };
    setStats(stats);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchAbsences();
  };

  const handleClearFilters = () => {
    setFilters({
      month: new Date().toISOString().slice(0, 7),
      employeeId: "",
      department: "",
      status: ""
    });
    setTimeout(() => fetchAbsences(), 100);
  };

  const downloadExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = absences.map(absence => ({
        "Employee ID": absence.employeeId,
        "Employee Name": absence.employeeName,
        "Department": absence.department,
        "Leave Type": absence.absenceType,
        "Start Date": new Date(absence.startDate).toLocaleDateString(),
        "End Date": new Date(absence.endDate).toLocaleDateString(),
        "Total Days": absence.totalDays,
        "Reason": absence.reason,
        "Status": absence.status,
        "Applied On": new Date(absence.createdAt).toLocaleDateString(),
        "Approved By": absence.approvedBy || "-",
        "Approval Date": absence.approvalDate ? new Date(absence.approvalDate).toLocaleDateString() : "-",
        "Cancelled By": absence.cancelledBy || "-",
        "Cancellation Date": absence.cancellationDate ? new Date(absence.cancellationDate).toLocaleDateString() : "-"
      }));

      // Convert to CSV
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(","),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header] || "";
            // Escape commas and quotes
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `absence_records_${filters.month}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage("Report downloaded successfully");
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error downloading report");
      setShowSuccess(true);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger",
      Cancelled: "secondary"
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  const getEmployeeLeaveSummary = (empId) => {
    const empAbsences = absences.filter(a => a.employeeId === empId);
    const approvedDays = empAbsences
      .filter(a => a.status === "Approved")
      .reduce((sum, a) => sum + (a.totalDays || 0), 0);
    return approvedDays;
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
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Absence Records</h2>
          <button 
            className="btn btn-success"
            onClick={downloadExcel}
            disabled={absences.length === 0}
          >
            <i className="bi bi-download"></i> Download Excel Report
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Leaves</h6>
                <h3>{stats.totalLeaves}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center">
              <div className="card-body">
                <h6 className="text-muted">Total Days</h6>
                <h3>{stats.totalDays}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h6 className="text-warning">Pending</h6>
                <h3>{stats.pending}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-success">
              <div className="card-body">
                <h6 className="text-success">Approved</h6>
                <h3>{stats.approved}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-danger">
              <div className="card-body">
                <h6 className="text-danger">Rejected</h6>
                <h3>{stats.rejected}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card text-center border-secondary">
              <div className="card-body">
                <h6 className="text-secondary">Cancelled</h6>
                <h3>{stats.cancelled}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="mb-3">Filters</h5>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label className="form-label">Month</label>
                <input
                  type="month"
                  className="form-control"
                  value={filters.month}
                  onChange={(e) => handleFilterChange("month", e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={filters.employeeId}
                  onChange={(e) => handleFilterChange("employeeId", e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => handleFilterChange("department", e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2 mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="col-md-2 mb-3 d-flex align-items-end gap-2">
                <button 
                  className="btn btn-primary"
                  onClick={handleApplyFilters}
                  disabled={loading}
                >
                  Apply
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Absence Records Table */}
        <div className="card">
          <div className="card-body">
            <h5 className="mb-3">Absence Details</h5>
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied On</th>
                      <th>Action By</th>
                      <th>Action Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absences.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center text-muted">
                          No absence records found for the selected filters
                        </td>
                      </tr>
                    ) : (
                      absences.map(absence => (
                        <tr key={absence._id}>
                          <td>{absence.employeeId}</td>
                          <td>{absence.employeeName}</td>
                          <td>{absence.department}</td>
                          <td>{absence.absenceType}</td>
                          <td>{new Date(absence.startDate).toLocaleDateString()}</td>
                          <td>{new Date(absence.endDate).toLocaleDateString()}</td>
                          <td>{absence.totalDays}</td>
                          <td>
                            <span title={absence.reason}>
                              {absence.reason.length > 30 
                                ? absence.reason.substring(0, 30) + "..." 
                                : absence.reason}
                            </span>
                          </td>
                          <td>
                            <span className={getStatusBadge(absence.status)}>
                              {absence.status}
                            </span>
                          </td>
                          <td>{new Date(absence.createdAt).toLocaleDateString()}</td>
                          <td>
                            {absence.status === "Approved" && absence.approvedBy ? absence.approvedBy :
                             absence.status === "Rejected" && absence.rejectedBy ? absence.rejectedBy :
                             absence.status === "Cancelled" && absence.cancelledBy ? absence.cancelledBy :
                             "-"}
                          </td>
                          <td>
                            {absence.status === "Approved" && absence.approvalDate ? new Date(absence.approvalDate).toLocaleDateString() :
                             absence.status === "Rejected" && absence.rejectionDate ? new Date(absence.rejectionDate).toLocaleDateString() :
                             absence.status === "Cancelled" && absence.cancellationDate ? new Date(absence.cancellationDate).toLocaleDateString() :
                             "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Employee Leave Summary */}
        {filters.employeeId && (
          <div className="card mt-4">
            <div className="card-body">
              <h5>Leave Summary for Selected Employee</h5>
              <div className="row mt-3">
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Total Approved Leave Days</h6>
                      <h3 className="text-success">
                        {getEmployeeLeaveSummary(filters.employeeId)}
                      </h3>
                      <small className="text-muted">in selected month</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Total Leave Requests</h6>
                      <h3 className="text-primary">
                        {absences.filter(a => a.employeeId === filters.employeeId).length}
                      </h3>
                      <small className="text-muted">in selected month</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6>Pending Requests</h6>
                      <h3 className="text-warning">
                        {absences.filter(a => a.employeeId === filters.employeeId && a.status === "Pending").length}
                      </h3>
                      <small className="text-muted">awaiting approval</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
