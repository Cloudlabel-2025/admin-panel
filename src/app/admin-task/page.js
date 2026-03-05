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
  const [activeTab, setActiveTab] = useState("upload"); // "upload" or "manual"
  const [manualTask, setManualTask] = useState({
    employeeIds: [],
    taskName: "",
    client: "",
    module: "",
    topic: "",
    startDate: new Date().toISOString().split('T')[0],
    expectedendDate: "",
    remarks: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    limit: 10
  });
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

  const fetchTasks = async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`/api/task?admin=true&page=${page}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched tasks:", data);
        setTasks(data.tasks);
        setPagination(data.pagination);
      } else {
        setError("Failed to fetch tasks");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTasks(newPage, pagination.limit);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTasks(pagination.currentPage, pagination.limit);
      await fetchEmployees();
    } finally {
      setRefreshing(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'employeeId': 'CHC0001',
        'department': 'Technical',
        'client': 'Client Name',
        'module': 'Module Name',
        'topic': 'Task Topic',
        'taskName': 'Sample Task Description',
        'startDate': '20/03/2026',
        'expectedendDate': '25/03/2026',
        'status': 'Yet to start',
        'remarks': 'Any additional notes'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Task Template');
    XLSX.writeFile(workbook, 'Task_Assignment_Template.xlsx');
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

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualTask.employeeIds.length === 0) {
      setError("Please select at least one employee");
      return;
    }
    if (!manualTask.taskName || !manualTask.client) {
      setError("Task Name and Client are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          singleTask: manualTask,
          assignedBy: localStorage.getItem("employeeId") || "Admin",
          assignerRole: localStorage.getItem("userRole")
        })
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage(result.message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setManualTask({
          employeeIds: [],
          taskName: "",
          client: "",
          module: "",
          topic: "",
          startDate: new Date().toISOString().split('T')[0],
          expectedendDate: "",
          remarks: ""
        });
        fetchTasks();
      } else {
        setError(result.error || "Failed to assign tasks");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setManualTask(prev => {
      const isSelected = prev.employeeIds.includes(employeeId);
      if (isSelected) {
        return { ...prev, employeeIds: prev.employeeIds.filter(id => id !== employeeId) };
      } else {
        return { ...prev, employeeIds: [...prev.employeeIds, employeeId] };
      }
    });
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
              <div className="card-header bg-dark p-0">
                <ul className="nav nav-tabs border-bottom-0">
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'upload' ? 'bg-white shadow-none' : 'text-white opacity-75 bg-transparent'}`}
                      style={{
                        color: activeTab === 'upload' ? '#0061f2' : '#ffffff',
                        borderBottom: activeTab === 'upload' ? '3px solid #0061f2' : 'none',
                        borderRadius: '0'
                      }}
                      onClick={() => setActiveTab('upload')}
                    >
                      <i className={`bi bi-cloud-upload me-2 ${activeTab === 'upload' ? '' : 'text-white'}`}></i>Excel Upload
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'manual' ? 'bg-white shadow-none' : 'text-white opacity-75 bg-transparent'}`}
                      style={{
                        color: activeTab === 'manual' ? '#0061f2' : '#ffffff',
                        borderBottom: activeTab === 'manual' ? '3px solid #0061f2' : 'none',
                        borderRadius: '0'
                      }}
                      onClick={() => setActiveTab('manual')}
                    >
                      <i className={`bi bi-pencil-square me-2 ${activeTab === 'manual' ? '' : 'text-white'}`}></i>Manual Assignment
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                {activeTab === 'upload' ? (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-bold">Select Excel File</label>
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
                    <div className="col-md-6 d-flex align-items-center">
                      <div className="mb-3">
                        <label className="form-label d-block fw-bold opacity-0">Template</label>
                        <button
                          className="btn btn-outline-primary"
                          onClick={downloadTemplate}
                        >
                          <i className="bi bi-download me-2"></i>Download Excel Template
                        </button>
                        <div className="form-text">
                          Download a sample format for your reference.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleManualSubmit}>
                    <div className="row">
                      <div className="col-md-5">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Select Employees <span className="badge bg-primary ms-2">{manualTask.employeeIds.length} selected</span></label>
                          <div className="input-group mb-2">
                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                            <input
                              type="text"
                              className="form-control border-start-0"
                              placeholder="Search employees..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="border rounded p-2 overflow-auto" style={{ maxHeight: '300px' }}>
                            {employees
                              .filter(emp => (emp.firstName + " " + emp.lastName + " " + emp.employeeId).toLowerCase().includes(searchTerm.toLowerCase()))
                              .map(emp => (
                                <div key={emp.employeeId} className="form-check p-1 ms-4 hover-bg-light">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`emp-${emp.employeeId}`}
                                    checked={manualTask.employeeIds.includes(emp.employeeId)}
                                    onChange={() => toggleEmployeeSelection(emp.employeeId)}
                                  />
                                  <label className="form-check-label w-100 cursor-pointer" htmlFor={`emp-${emp.employeeId}`}>
                                    <span className="fw-medium">{emp.firstName} {emp.lastName}</span>
                                    <small className="text-muted d-block">{emp.employeeId} • {emp.department}</small>
                                  </label>
                                </div>
                              ))
                            }
                            {employees.length === 0 && <div className="text-center py-3 text-muted">No employees found</div>}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-7">
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Task Name</label>
                            <input
                              type="text"
                              className="form-control"
                              value={manualTask.taskName}
                              onChange={(e) => setManualTask({ ...manualTask, taskName: e.target.value })}
                              placeholder="Enter task title"
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Client</label>
                            <input
                              type="text"
                              className="form-control"
                              value={manualTask.client}
                              onChange={(e) => setManualTask({ ...manualTask, client: e.target.value })}
                              placeholder="Client name"
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Module</label>
                            <input
                              type="text"
                              className="form-control"
                              value={manualTask.module}
                              onChange={(e) => setManualTask({ ...manualTask, module: e.target.value })}
                              placeholder="Module name"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Topic</label>
                            <input
                              type="text"
                              className="form-control"
                              value={manualTask.topic}
                              onChange={(e) => setManualTask({ ...manualTask, topic: e.target.value })}
                              placeholder="Task topic"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Start Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={manualTask.startDate}
                              onChange={(e) => setManualTask({ ...manualTask, startDate: e.target.value })}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Expected End Date</label>
                            <input
                              type="date"
                              className="form-control"
                              value={manualTask.expectedendDate}
                              onChange={(e) => setManualTask({ ...manualTask, expectedendDate: e.target.value })}
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <label className="form-label fw-bold">Remarks</label>
                            <textarea
                              className="form-control"
                              rows="2"
                              value={manualTask.remarks}
                              onChange={(e) => setManualTask({ ...manualTask, remarks: e.target.value })}
                              placeholder="Additional instructions..."
                            ></textarea>
                          </div>
                        </div>
                        <div className="d-flex justify-content-end mt-2">
                          <button
                            type="submit"
                            className="btn px-4 shadow-sm fw-bold border-0"
                            style={{
                              backgroundColor: '#0061f2',
                              color: '#ffffff',
                              transition: 'all 0.2s ease'
                            }}
                            disabled={loading || manualTask.employeeIds.length === 0}
                          >
                            {loading ? (
                              <><span className="spinner-border spinner-border-sm me-2"></span>Assigning...</>
                            ) : (
                              <><i className="bi bi-person-plus me-2"></i>Assign Task</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
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
                      className="btn me-2 fw-bold border-0"
                      style={{
                        backgroundColor: '#00ac69',
                        color: '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
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
                              <span className={`badge bg-${task.status === 'completed' ? 'success' :
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
                <h5 className="mb-0"><i className="bi bi-list-task me-2"></i>All Tasks ({pagination.totalTasks})</h5>
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
                                <span className={`badge bg-${task.status === 'completed' ? 'success' :
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
              {pagination.totalPages > 1 && (
                <div className="card-footer bg-white border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalTasks)} of {pagination.totalTasks} tasks
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                          <button className="page-link shadow-none" onClick={() => handlePageChange(pagination.currentPage - 1)}>
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        {[...Array(pagination.totalPages)].map((_, i) => (
                          <li key={i + 1} className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}>
                            <button className="page-link shadow-none" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                          <button className="page-link shadow-none" onClick={() => handlePageChange(pagination.currentPage + 1)}>
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}
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
                      onChange={(e) => setReportDates({ ...reportDates, startDate: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={reportDates.endDate}
                      onChange={(e) => setReportDates({ ...reportDates, endDate: e.target.value })}
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
                      onChange={(e) => setReviewData({ ...reviewData, reviewedBy: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reviewData.remarks}
                      onChange={(e) => setReviewData({ ...reviewData, remarks: e.target.value })}
                      placeholder="Add your review comments..."
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={reviewData.status}
                      onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
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