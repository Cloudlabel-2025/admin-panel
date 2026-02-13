"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

import * as XLSX from 'xlsx';

const STATUS_OPTIONS = ["Yet to start", "In progress", "In-review", "completed", "On hold", "Re-work1", "Re-work2", "Re-work3"];
const STATUS_COLORS = {
  "Yet to start": "warning",
  "In progress": "info", 
  "In-review": "primary",
  "completed": "success",
  "On hold": "secondary",
  "Re-work1": "danger",
  "Re-work2": "warning",
  "Re-work3": "dark"
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDates, setReportDates] = useState({ startDate: '', endDate: '' });
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const employeeId = localStorage.getItem("employeeId");

    if (!userRole || !employeeId) {
      router.push("/");
      return;
    }

    fetchTasks(employeeId);
  }, [router]);

  const fetchTasks = async (employeeId) => {
    try {
      setLoading(true);
      console.log("Fetching tasks for employee:", employeeId);
      const response = await fetch(`/api/Employee/tasks?employeeId=${employeeId}`);
      const data = await response.json();
      console.log("Tasks response:", data);
      
      if (response.ok) {
        setTasks(data);
      } else {
        setError(data.error || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch tasks");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const updateData = { 
        _id: taskId, 
        status: newStatus
      };
      
      // Set actual end date when task is In-review
      if (newStatus === "In-review") {
        updateData.actualendDate = new Date();
      }
      
      const response = await fetch("/api/task", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const { task } = await response.json();
        setTasks(prev => prev.map(t => t._id === taskId ? task : t));
        setSuccessMessage("Task status updated successfully");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError("Failed to update task status");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Error updating task status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const downloadReport = () => {
    if (!reportDates.startDate || !reportDates.endDate) {
      setError('Please select both start and end dates');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const start = new Date(reportDates.startDate);
      const end = new Date(reportDates.endDate);
      return taskDate >= start && taskDate <= end;
    });

    const worksheet = XLSX.utils.json_to_sheet(filteredTasks.map(task => ({
      'Task Name': task.taskName,
      'Client': task.client,
      'Module': task.module || '-',
      'Topic': task.topic || '-',
      'Start Date': formatDate(task.startDate),
      'Expected End': formatDate(task.expectedendDate),
      'Actual End': formatDate(task.actualendDate),
      'Status': task.status,
      'Assigned By': task.assignedBy || '-',
      'Remarks': task.remarks || 'No remarks'
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Tasks Report');
    XLSX.writeFile(workbook, `My_Tasks_Report_${reportDates.startDate}_to_${reportDates.endDate}.xlsx`);
    setShowReportModal(false);
    setReportDates({ startDate: '', endDate: '' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid mt-3">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="mb-1"><i className="bi bi-check2-square me-2"></i>My Tasks</h2>
                <p className="text-muted mb-0">View and manage your assigned tasks</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>Task List ({tasks.length})</h5>
                <div>
                  <button className="btn btn-sm btn-success" onClick={() => setShowReportModal(true)}>
                    <i className="bi bi-file-earmark-excel me-1"></i>Report
                  </button>
                  <button className="btn btn-sm btn-primary ms-2" onClick={() => fetchTasks(localStorage.getItem("employeeId"))}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {tasks.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                    <h5 className="text-muted">No tasks assigned</h5>
                    <p className="text-muted">You don't have any tasks assigned yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Task Name</th>
                          <th>Client</th>
                          <th>Module</th>
                          <th>Topic</th>
                          <th>Start Date</th>
                          <th>Expected End</th>
                          <th>Actual End</th>
                          <th>Status</th>
                          <th>Assigned By</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => (
                          <tr key={task._id}>
                            <td>
                              <div className="fw-bold">{task.taskName}</div>
                            </td>
                            <td>{task.client}</td>
                            <td>{task.module || "-"}</td>
                            <td>{task.topic || "-"}</td>
                            <td>{formatDate(task.startDate)}</td>
                            <td>{formatDate(task.expectedendDate)}</td>
                            <td>{formatDate(task.actualendDate)}</td>
                            <td>
                              <span className={`badge bg-${STATUS_COLORS[task.status || 'warning']}`}>
                                {task.status === 'completed' ? (
                                  task.status
                                ) : (
                                  <select
                                    className="border-0 bg-transparent text-white status-dropdown"
                                    value={task.status}
                                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                                    style={{ outline: "none", cursor: "pointer" }}
                                    disabled={task.status === 'completed'}
                                  >
                                    {STATUS_OPTIONS.map(status => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                )}
                              </span>
                            </td>
                            <td>{task.assignedBy || "-"}</td>
                            <td>
                              <small className="text-muted">
                                {task.remarks || "No remarks"}
                              </small>
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
        </div>

        <SuccessMessage
          show={showSuccess}
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />

        {/* Report Modal */}
        {showReportModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Download Tasks Report</h5>
                  <button type="button" className="btn-close" onClick={() => setShowReportModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reportDates.startDate}
                      onChange={(e) => setReportDates({...reportDates, startDate: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reportDates.endDate}
                      onChange={(e) => setReportDates({...reportDates, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-success" onClick={downloadReport}>
                    <i className="bi bi-download me-1"></i>Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .status-dropdown option {
          background-color: #212529;
          color: white;
        }
        .status-dropdown option:hover {
          background-color: #495057;
        }
      `}</style>
    </Layout>
  );
}