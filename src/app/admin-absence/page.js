"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function AdminAbsencePage() {
  const [absences, setAbsences] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [isLOP, setIsLOP] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "super-admin" && role !== "Super-admin" && role !== "admin" && role !== "developer") {
      window.location.href = "/";
      return;
    }
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      let url = "/api/absence";
      if (filter) url += `?status=${filter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAbsences(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const res = await fetch("/api/absence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: id,
          action,
          approvedBy: localStorage.getItem("employeeId") || "Admin",
          comments: adminComments,
          isLOP: isLOP
        })
      });

      if (res.ok) {
        setSuccessMessage(`Leave request ${action}d successfully`);
        setShowSuccess(true);
        setSelectedAbsence(null);
        setAdminComments("");
        setIsLOP(false);
        fetchAbsences();
      } else {
        setSuccessMessage(`Failed to ${action} leave request`);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error processing request");
      setShowSuccess(true);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "warning",
      Approved: "success",
      Rejected: "danger"
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Leave Request Management</h2>
          <div>
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="">All Requests</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary mb-3" onClick={fetchAbsences}>
          Refresh
        </button>

        {/* Absence Requests Table */}
        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absences.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center text-muted">
                          No leave requests found.
                        </td>
                      </tr>
                    )}
                    {absences.map(absence => (
                      <tr key={absence._id}>
                        <td>
                          <strong>{absence.employeeName}</strong><br />
                          <small className="text-muted">{absence.employeeId}</small>
                        </td>
                        <td>{absence.department}</td>
                        <td>{absence.absenceType}</td>
                        <td>{formatDate(absence.startDate)}</td>
                        <td>{formatDate(absence.endDate)}</td>
                        <td>{absence.totalDays}</td>
                        <td>
                          <span title={absence.reason}>
                            {absence.reason.length > 30 ? 
                              absence.reason.substring(0, 30) + "..." : 
                              absence.reason
                            }
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadge(absence.status)}>
                            {absence.status}
                          </span>
                          {absence.isLOP && (
                            <><br /><small className="text-danger">LOP</small></>
                          )}
                        </td>
                        <td>{formatDate(absence.createdAt)}</td>
                        <td>
                          {absence.status === "Pending" ? (
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => setSelectedAbsence({...absence, action: "approve"})}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setSelectedAbsence({...absence, action: "reject"})}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <div>
                              <small className="text-muted">
                                By: {absence.approvedBy}<br />
                                {absence.approvalDate && formatDate(absence.approvalDate)}
                              </small>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Approval/Rejection Modal */}
        {selectedAbsence && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>
                    {selectedAbsence.action === "approve" ? "Approve" : "Reject"} Leave Request
                  </h5>
                  <button 
                    className="btn-close" 
                    onClick={() => {
                      setSelectedAbsence(null);
                      setAdminComments("");
                      setIsLOP(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Employee:</strong> {selectedAbsence.employeeName} ({selectedAbsence.employeeId})
                  </div>
                  <div className="mb-3">
                    <strong>Leave Type:</strong> {selectedAbsence.absenceType}
                  </div>
                  <div className="mb-3">
                    <strong>Duration:</strong> {formatDate(selectedAbsence.startDate)} to {formatDate(selectedAbsence.endDate)} ({selectedAbsence.totalDays} days)
                  </div>
                  <div className="mb-3">
                    <strong>Reason:</strong> {selectedAbsence.reason}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {selectedAbsence.action === "approve" ? "Approval" : "Rejection"} Comments:
                    </label>
                    <textarea
                      className="form-control"
                      value={adminComments}
                      onChange={(e) => setAdminComments(e.target.value)}
                      placeholder={`Enter ${selectedAbsence.action === "approve" ? "approval" : "rejection"} comments...`}
                      rows="3"
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="lopCheck"
                        checked={isLOP}
                        onChange={(e) => setIsLOP(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="lopCheck">
                        Mark as Loss of Pay (LOP)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setSelectedAbsence(null);
                      setAdminComments("");
                      setIsLOP(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn ${selectedAbsence.action === "approve" ? "btn-success" : "btn-danger"}`}
                    onClick={() => handleApproval(selectedAbsence._id, selectedAbsence.action)}
                  >
                    {selectedAbsence.action === "approve" ? "Approve" : "Reject"} Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}