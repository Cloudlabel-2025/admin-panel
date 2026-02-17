"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";
import * as XLSX from 'xlsx';

export default function AdminTaskPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDates, setReportDates] = useState({ startDate: '', endDate: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [reviewData, setReviewData] = useState({ reviewedBy: "", remarks: "", status: "" });
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (!userRole || !["admin", "super-admin", "Super-admin", "developer", "Team-Lead", "Team-admin"].includes(userRole)) {
      router.push("/");
      return;
    }
    fetchTasks();
    fetchEmployees();
  }, [router]);

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/task?admin=true");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tasks:", data);
        setTasks(data);
      } else {
        setError("Failed to fetch tasks");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTasks();
      await fetchEmployees();
    } finally {
      setRefreshing(false);
    }
  };

  const downloadReport = () => {
    if (!reportDates.startDate || !reportDates.endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const start = new Date(reportDates.startDate);
      const end = new Date(reportDates.endDate);
      return taskDate >= start && taskDate <= end;
    });

    const worksheet = XLSX.utils.json_to_sheet(filteredTasks.map(task => ({
      'Employee ID': task.employeeId,
      'Name': task.name || 'N/A',
      'Department': task.department,
      'Client': task.client,
      'Module': task.module || '-',
      'Topic': task.topic || '-',
      'Task Name': task.taskName,
      'Start Date': formatDate(task.startDate),
      'Expected End': formatDate(task.expectedendDate),
      'Actual End': formatDate(task.actualendDate),
      'Assigned By': task.assignedBy || '-',
      'Reviewed By': task.reviewedBy || '-',
      'Status': task.status,
      'Remarks': task.remarks || '-'
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks Report');
    XLSX.writeFile(workbook, `Tasks_Report_${reportDates.startDate}_to_${reportDates.endDate}.xlsx`);
    setShowReportModal(false);
    setReportDates({ startDate: '', endDate: '' });
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/Employee");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        return data;
      } else {
        setEmployees([]);
        return [];
      }
    } catch (err) {
      setEmployees([]);
      return [];
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadFile(file);
    
    // Ensure employees are loaded
    const currentEmployees = employees.length > 0 ? employees : await fetchEmployees();
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const mappedData = jsonData.map((row, index) => {
          const employeeId = row.employeeId || row.EmployeeID || row['Employee ID'] || "";
          const employee = currentEmployees.find(emp => emp.employeeId === employeeId);
          
          // Parse dates properly
          const parseDate = (dateStr) => {
            if (!dateStr) return null;
            
            try {
              // Handle Excel serial date numbers
              if (typeof dateStr === 'number') {
                const date = new Date((dateStr - 25569) * 86400 * 1000);
                return isNaN(date.getTime()) ? null : date;
              }
              
              // Handle DD.MM.YYYY format
              if (typeof dateStr === 'string' && dateStr.includes('.')) {
                const [day, month, year] = dateStr.split('.');
                const date = new Date(year, month - 1, day);
                return isNaN(date.getTime()) ? null : date;
              }
              
              // Handle DD/MM/YYYY format
              if (typeof dateStr === 'string' && dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY format
                  const date = new Date(parts[2], parts[1] - 1, parts[0]);
                  return isNaN(date.getTime()) ? null : date;
                }
              }
              
              // Handle other date formats
              const date = new Date(dateStr);
              return isNaN(date.getTime()) ? null : date;
            } catch (error) {
              return null;
            }
          };
          
          // Clean status value
          const cleanStatus = (status) => {
            if (!status) return "Yet to start";
            const cleaned = status.toString().trim().toLowerCase();
            if (cleaned.includes('progress')) return "In progress";
            if (cleaned.includes('review')) return "In-review";
            if (cleaned.includes('completed')) return "completed";
            if (cleaned.includes('hold')) return "On hold";
            if (cleaned.includes('yet') || cleaned.includes('start')) return "Yet to start";
            return "Yet to start";
          };
          
          return {
            employeeId: employeeId,
            name: employee ? `${employee.firstName} ${employee.lastName}` : "",
            department: employee?.department || row.department || row.Department || row.Dept || "",
            client: row.client || row.Client || row['Client Name'] || "",
            module: row.module || row.Module || row.Modules || "",
            topic: row.topic || row.Topic || row.Topics || "",
            taskName: row.taskName || row.TaskName || row['Task Name'] || row.Task || row.task || "",
            startDate: parseDate(row.startDate || row.StartDate || row['Start Date']),
            expectedendDate: parseDate(row.expectedEndDate || row.ExpectedEndDate || row['Expected End Date'] || row.expectedendDate || row.EndDate),
            actualendDate: parseDate(row.actualEndDate || row.ActualEndDate || row['Actual End Date'] || row.actualendDate),
            assignedBy: row.assignedBy || row.AssignedBy || row['Assigned By'] || localStorage.getItem("employeeId") || "Admin",
            reviewedBy: row.reviewedBy || row.ReviewedBy || row['Reviewed By'] || "",
            status: cleanStatus(row.status || row.Status),
            remarks: row.remarks || row.Remarks || row.Comments || row.Note || ""
          };
        });

        setPreviewData(mappedData);
        setShowPreview(true);
      } catch (err) {
        setError("Error reading Excel file. Please check the format.");
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const uploadTasks = async () => {
    if (previewData.length === 0) return;

    setLoading(true);
    try {
      const tasksToUpload = previewData.map(task => ({
        ...task,
        startDate: task.startDate,
        expectedendDate: task.expectedendDate,
        actualendDate: task.actualendDate
      }));
      console.log("Uploading tasks:", tasksToUpload);
      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToUpload })
      });

      const result = await response.json();
      console.log("Upload response:", result);

      if (response.ok) {
        if (result.failedRows && result.failedRows.length > 0) {
          console.log("Failed rows:", result.failedRows);
          setError(`Some tasks failed: ${result.failedRows.map(f => f.reason).join(', ')}`);
        } else {
          setSuccessMessage(`Tasks uploaded: ${result.insertedCount} inserted, ${result.skippedCount} skipped, ${result.duplicatesCount} duplicates`);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
        setShowPreview(false);
        setPreviewData([]);
        setUploadFile(null);
        fetchTasks();
        document.getElementById('fileInput').value = '';
      } else {
        setError(result.error || "Failed to upload tasks");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (task) => {
    setEditingTask(task);
    setReviewData({
      reviewedBy: task.reviewedBy || localStorage.getItem("employeeId") || "Admin",
      remarks: task.remarks || "",
      status: task.status || "In progress"
    });
  };

  const submitReview = async () => {
    if (!editingTask) return;

    try {
      const response = await fetch("/api/task", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: editingTask._id,
          reviewedBy: reviewData.reviewedBy,
          remarks: reviewData.remarks,
          status: reviewData.status
        })
      });

      if (response.ok) {
        const { task } = await response.json();
        setTasks(prev => prev.map(t => t._id === editingTask._id ? task : t));
        setSuccessMessage(`Task reviewed and marked as ${reviewData.status}`);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setEditingTask(null);
        setReviewData({ reviewedBy: "", remarks: "", status: "" });
      } else {
        setError("Failed to update task review");
      }
    } catch (err) {
      setError("Error updating task review");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <Layout>
      <div className="container-fluid mt-3">
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="mb-1"><i className="bi bi-upload me-2"></i>Task Management</h2>
                <p className="text-muted mb-0">Upload Excel files to assign tasks to employees</p>
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

        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0"><i className="bi bi-cloud-upload me-2"></i>Upload Tasks</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Select Excel File</label>
                      <input
                        type="file"
                        id="fileInput"
                        className="form-control"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                      />
                      <div className="form-text">
                        Upload Excel file with task data. Supported formats: .xlsx, .xls
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-eye me-2"></i>Preview Tasks ({previewData.length})</h5>
                  <div>
                    <button
                      className="btn btn-success me-2"
                      onClick={uploadTasks}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>Confirm Upload
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowPreview(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Employee ID</th>
                          <th>Name</th>
                          <th>Department</th>
                          <th>Client</th>
                          <th>Module</th>
                          <th>Topic</th>
                          <th>Task Name</th>
                          <th>Start Date</th>
                          <th>Expected End</th>
                          <th>Actual End</th>
                          <th>Assigned By</th>
                          <th>Reviewed By</th>
                          <th>Status</th>
                          <th>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((task, index) => (
                          <tr key={index}>
                            <td>{task.employeeId}</td>
                            <td>{task.name || '-'}</td>
                            <td>{task.department}</td>
                            <td>{task.client}</td>
                            <td>{task.module || '-'}</td>
                            <td>{task.topic || '-'}</td>
                            <td>{task.taskName}</td>
                            <td>{formatDate(task.startDate)}</td>
                            <td>{formatDate(task.expectedendDate)}</td>
                            <td>{formatDate(task.actualendDate)}</td>
                            <td>{task.assignedBy || '-'}</td>
                            <td>{task.reviewedBy || '-'}</td>
                            <td>
                              <span className={`badge bg-${
                                task.status === 'completed' ? 'success' :
                                task.status === 'In-review' ? 'info' :
                                task.status === 'In progress' ? 'primary' :
                                task.status === 'Re-work1' ? 'danger' :
                                task.status === 'Re-work2' ? 'warning' :
                                task.status === 'Re-work3' ? 'dark' :
                                task.status === 'On hold' ? 'secondary' : 'warning'
                              }`}>
                                {task.status}
                              </span>
                            </td>
                            <td>{task.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>All Tasks ({tasks.length})</h5>
                <div>
                  <button className="btn btn-sm btn-success" onClick={() => setShowReportModal(true)}>
                    <i className="bi bi-file-earmark-excel me-1"></i>Report
                  </button>
                  <button className="btn btn-sm btn-primary ms-2" onClick={handleRefresh} disabled={refreshing}>
                    <i className="bi bi-arrow-clockwise me-1"></i>{refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {tasks.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                    <h5 className="text-muted">No tasks found</h5>
                    <p className="text-muted">Upload an Excel file to create tasks.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Employee</th>
                          <th>Client</th>
                          <th>Module</th>
                          <th>Topic</th>
                          <th>Task Name</th>
                          <th>Start Date</th>
                          <th>Expected End</th>
                          <th>Actual End</th>
                          <th>Assigned By</th>
                          <th>Reviewed By</th>
                          <th>Status</th>
                          <th>Remarks</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task) => {
                          const displayName = task.name || (employees.find(emp => emp.employeeId === task.employeeId) ? `${employees.find(emp => emp.employeeId === task.employeeId).firstName} ${employees.find(emp => emp.employeeId === task.employeeId).lastName}` : 'Unknown');
                          
                          return (
                            <tr key={task._id}>
                              <td>
                                <div>{task.employeeId}</div>
                                <small className="text-muted">{displayName}</small>
                              </td>
                              <td>{task.client}</td>
                              <td>{task.module || "-"}</td>
                              <td>{task.topic || "-"}</td>
                              <td>{task.taskName}</td>
                              <td>{formatDate(task.startDate)}</td>
                              <td>{formatDate(task.expectedendDate)}</td>
                              <td>{formatDate(task.actualendDate)}</td>
                              <td>{task.assignedBy || '-'}</td>
                              <td>{task.reviewedBy || '-'}</td>
                              <td>
                                <span className={`badge bg-${
                                  task.status === 'completed' ? 'success' :
                                  task.status === 'In-review' ? 'info' :
                                  task.status === 'In progress' ? 'primary' :
                                  task.status === 'Re-work1' ? 'danger' :
                                  task.status === 'Re-work2' ? 'warning' :
                                  task.status === 'Re-work3' ? 'dark' :
                                  task.status === 'On hold' ? 'secondary' : 'warning'
                                }`}>
                                  {task.status}
                                </span>
                              </td>
                              <td>{task.remarks || '-'}</td>
                              <td>{formatDate(task.createdAt)}</td>
                              <td>
                                {task.status !== 'completed' ? (
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleReview(task)}
                                  >
                                    <i className="bi bi-pencil me-1"></i>Review
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleReview(task)}
                                  >
                                    <i className="bi bi-arrow-clockwise me-1"></i>Reopen
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
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

        {/* Review Modal */}
        {editingTask && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Review Task: {editingTask.taskName}</h5>
                  <button type="button" className="btn-close" onClick={() => setEditingTask(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Reviewed By</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reviewData.reviewedBy}
                      onChange={(e) => setReviewData({...reviewData, reviewedBy: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reviewData.remarks}
                      onChange={(e) => setReviewData({...reviewData, remarks: e.target.value})}
                      placeholder="Add your review comments..."
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={reviewData.status}
                      onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                    >
                      <option value="Re-work1">Re-work1</option>
                      <option value="Re-work2">Re-work2</option>
                      <option value="Re-work3">Re-work3</option>
                      <option value="On hold">On hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingTask(null)}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={submitReview}>
                    Save Review
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