"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SMELayout from "../../components/SMELayout";

function SMETasksContent() {
  const [tasks, setTasks] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" });
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  useEffect(() => {
    checkUserRole();
    fetchCurrentSession();
    fetchTasks();
  }, [sessionId]);

  const checkUserRole = () => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") {
      router.replace("/");
    }
  };

  const fetchCurrentSession = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/api/sme/session?type=active', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
      }
    } catch (error) {
      console.error('Error fetching current session:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      let url = '/api/sme/tasks';
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const employeeId = localStorage.getItem("employeeId");
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/sme/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          employeeId,
          date: today
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [data.task, ...prev]);
        setNewTask({ title: "", description: "", priority: "medium" });
        setShowAddTask(false);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      setError("Failed to add task");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sme/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(task => 
          task._id === taskId ? data.task : task
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update task");
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError("Network error. Please try again.");
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/sme/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task._id !== taskId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete task");
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setError("Network error. Please try again.");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'primary';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canAddTasks = currentSession && currentSession.status === 'active';

  if (loading) {
    return (
      <SMELayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </SMELayout>
    );
  }

  return (
    <SMELayout>

      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0" style={{ color: '#2c5530', fontWeight: '700' }}>
                <i className="bi bi-list-task me-2"></i>My Tasks
                {sessionId && <small className="text-muted ms-2">(Session View)</small>}
              </h2>
              <div className="d-flex gap-2">
                {sessionId && (
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => router.push('/sme/tasks')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    All Tasks
                  </button>
                )}
                <button 
                  className="btn btn-success"
                  onClick={() => setShowAddTask(true)}
                  disabled={!canAddTasks}
                  title={!canAddTasks ? "Can only add tasks during active work session" : ""}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Add Task
                </button>
              </div>
            </div>

            {!canAddTasks && !sessionId && (
              <div className="alert alert-warning" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                You can only add tasks during an active work session. Tasks cannot be added during breaks or lunch.
              </div>
            )}

            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* Add Task Modal */}
            {showAddTask && (
              <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Add New Task</h5>
                      <button 
                        type="button" 
                        className="btn-close"
                        onClick={() => {
                          setShowAddTask(false);
                          setError("");
                          setNewTask({ title: "", description: "", priority: "medium" });
                        }}
                      ></button>
                    </div>
                    <form onSubmit={addTask}>
                      <div className="modal-body">
                        <div className="mb-3">
                          <label className="form-label">Task Title *</label>
                          <input
                            type="text"
                            className="form-control"
                            value={newTask.title}
                            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter task title"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={newTask.description}
                            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter task description (optional)"
                          ></textarea>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Priority</label>
                          <select
                            className="form-select"
                            value={newTask.priority}
                            onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowAddTask(false);
                            setError("");
                            setNewTask({ title: "", description: "", priority: "medium" });
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-success">
                          <i className="bi bi-plus-circle me-2"></i>
                          Add Task
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Table */}
            <div className="card border-0 shadow-sm">
              {tasks.length === 0 ? (
                <div className="card-body text-center p-5">
                  <i className="bi bi-list-task" style={{ fontSize: '4rem', color: '#4CAF50', opacity: 0.3 }}></i>
                  <h4 className="mt-3 mb-2">No Tasks Found</h4>
                  <p className="text-muted">
                    {sessionId ? 'No tasks found for this session.' : "You haven't added any tasks yet."}
                  </p>
                  {canAddTasks && (
                    <button className="btn btn-success" onClick={() => setShowAddTask(true)}>
                      <i className="bi bi-plus-circle me-2"></i>Add Your First Task
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Started</th>
                        <th>Completed</th>
                        <th style={{ width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => (
                        <tr key={task._id}>
                          <td>
                            <div className="fw-semibold">Task {index + 1} - {task.title}</div>
                            {task.description && (
                              <small className="text-muted">{task.description}</small>
                            )}
                          </td>
                          <td>
                            <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td><small className="text-muted">{formatDateTime(task.createdAt)}</small></td>
                          <td><small className="text-muted">{task.startTime ? formatDateTime(task.startTime) : '-'}</small></td>
                          <td><small className="text-muted">{task.endTime ? formatDateTime(task.endTime) : '-'}</small></td>
                          <td>
                            <div className="d-flex gap-1">
                              {task.status === 'pending' && (
                                <button className="btn btn-sm btn-outline-primary" onClick={() => updateTaskStatus(task._id, 'in-progress')}>Start</button>
                              )}
                              {task.status === 'in-progress' && (
                                <button className="btn btn-sm btn-outline-success" onClick={() => updateTaskStatus(task._id, 'completed')}>Complete</button>
                              )}
                              {task.status === 'completed' && (
                                <button className="btn btn-sm btn-outline-warning" onClick={() => updateTaskStatus(task._id, 'in-progress')}>Reopen</button>
                              )}
                              <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTask(task._id)}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Task Statistics */}
            {tasks.length > 0 && (
              <div className="card border-0 shadow-sm mt-3">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-graph-up me-2"></i>
                    Task Statistics
                  </h5>
                  <div className="row text-center">
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-primary mb-1">{tasks.length}</h4>
                        <small className="text-muted">Total Tasks</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-success mb-1">
                          {tasks.filter(t => t.status === 'completed').length}
                        </h4>
                        <small className="text-muted">Completed</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-warning mb-1">
                          {tasks.filter(t => t.status === 'in-progress').length}
                        </h4>
                        <small className="text-muted">In Progress</small>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="p-3">
                        <h4 className="text-secondary mb-1">
                          {tasks.filter(t => t.status === 'pending').length}
                        </h4>
                        <small className="text-muted">Pending</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SMELayout>
  );
}

export default function SMETasks() {
  return (
    <Suspense fallback={
      <SMELayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </SMELayout>
    }>
      <SMETasksContent />
    </Suspense>
  );
}