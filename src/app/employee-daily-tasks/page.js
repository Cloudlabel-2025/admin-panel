"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function EmployeeDailyTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [userRole, setUserRole] = useState("");

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

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/daily-task?admin=true&date=${selectedDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <h4 className="mb-0">
              <i className="bi bi-list-task me-2"></i>
              Employee Daily Tasks
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
        </div>
      </div>
    </Layout>
  );
}
