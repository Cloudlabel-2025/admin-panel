"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function EmployeeDailyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userRole, setUserRole] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    limit: 10
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/");
      return;
    }
    const roleLower = role.toLowerCase();
    if (roleLower !== 'super-admin' && roleLower !== 'admin' && roleLower !== 'developer') {
      router.push('/admin-dashboard');
      return;
    }
    setUserRole(role);
    fetchTasks();
  }, [router, selectedDate]);

  const fetchTasks = async (page = 1, limit = 10) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/daily-task?admin=true&date=${selectedDate}&page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTasks(newPage, pagination.limit);
    }
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Employee Daily Tasks ({pagination.totalTasks})
            </h4>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label fw-bold">Select Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">No tasks found for selected date</td>
                    </tr>
                  ) : (
                    tasks.map((task, index) => (
                      <tr key={index}>
                        <td>{new Date(task.date).toLocaleDateString()}</td>
                        <td>{task.employeeId}</td>
                        <td>{task.employeeName || 'N/A'}</td>
                        <td>{task.task}</td>
                        <td>
                          <span className={`badge ${task.status === 'Completed' ? 'bg-success' : 'bg-warning'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td>{new Date(task.createdAt).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
    </Layout>
  );
}
