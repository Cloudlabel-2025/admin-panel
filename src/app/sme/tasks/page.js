"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SMELayout from "../../components/SMELayout";
import { apiFetch } from "../../utilis/apiFetch";

function SMETasksContent() {
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "SME") router.replace("/");
    fetchSession();
    fetchTasks();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await apiFetch("/api/sme/session?type=active");
      if (res.ok) { const d = await res.json(); setSession(d.session || null); }
    } catch {}
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const employeeId = localStorage.getItem("employeeId");
      const params = new URLSearchParams();
      if (employeeId) params.append("employeeId", employeeId);
      if (sessionId)  params.append("sessionId", sessionId);
      const res = await apiFetch(`/api/sme/tasks${params.toString() ? "?" + params : ""}`);
      if (res.ok) { const d = await res.json(); setTasks(d.tasks || []); }
    } catch {}
    finally { setLoading(false); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) { setError("Task title is required"); return; }
    try {
      const res = await apiFetch("/api/sme/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, employeeId: localStorage.getItem("employeeId"), date: new Date().toISOString().split("T")[0] }),
      });
      if (res.ok) {
        const d = await res.json();
        setTasks(p => [d.task, ...p]);
        setNewTask({ title: "", description: "" });
        setShowModal(false); setError("");
      } else { const d = await res.json(); setError(d.error); }
    } catch { setError("Failed to add task"); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await apiFetch(`/api/sme/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { const d = await res.json(); setTasks(p => p.map(t => t._id === id ? d.task : t)); }
      else { const d = await res.json(); setError(d.error || "Failed to update"); }
    } catch { setError("Network error"); }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await apiFetch(`/api/sme/tasks/${id}`, { method: "DELETE" });
      if (res.ok) setTasks(p => p.filter(t => t._id !== id));
      else { const d = await res.json(); setError(d.error || "Failed to delete"); }
    } catch { setError("Network error"); }
  };

  const fmtDT = (d) => d
    ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  const statusStyle = (s) => {
    const m = {
      completed:   { bg: "#f0fdf4", color: "#065f46" },
      "in-progress": { bg: "#ede9fe", color: "#4c1d95" },
      pending:     { bg: "#f9fafb", color: "#6b7280" },
    };
    return { ...(m[s] || m.pending), padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.4px" };
  };

  const canAdd = session?.status === "active";
  const total  = tasks.length;
  const done   = tasks.filter(t => t.status === "completed").length;
  const inProg = tasks.filter(t => t.status === "in-progress").length;
  const pend   = tasks.filter(t => t.status === "pending").length;

  if (loading) return (
    <SMELayout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div className="sme-spinner"></div>
      </div>
    </SMELayout>
  );

  return (
    <SMELayout>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="sme-page-title">
            <i className="bi bi-list-task me-2"></i>My Tasks
            {sessionId && <span style={{ fontSize: "14px", color: "#8b5cf6", fontWeight: "500", marginLeft: "10px" }}>— Session View</span>}
          </h1>
          <p style={{ color: "#8b5cf6", fontSize: "14px", margin: "4px 0 0" }}>Manage and track your work tasks</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {sessionId && (
            <button className="sme-btn sme-btn-ghost" onClick={() => router.push("/sme/tasks")}>
              <i className="bi bi-arrow-left"></i>All Tasks
            </button>
          )}
          <button
            className="sme-btn sme-btn-primary"
            onClick={() => setShowModal(true)}
            disabled={!canAdd}
            title={!canAdd ? "Only available during an active session" : ""}
          >
            <i className="bi bi-plus-lg"></i>Add Task
          </button>
        </div>
      </div>

      {/* ── Warning ── */}
      {!canAdd && !sessionId && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#92400e", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="bi bi-exclamation-triangle-fill"></i>
          Tasks can only be added during an active work session.
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", color: "#dc2626", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="bi bi-exclamation-triangle-fill"></i>{error}
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* ── Tasks table ── */}
      <div className="sme-panel" style={{ marginBottom: "16px" }}>
        <div className="sme-panel-header">
          <span style={{ fontWeight: "600", color: "#4c1d95", fontSize: "14px" }}>
            <i className="bi bi-table me-2" style={{ color: "#7c3aed" }}></i>Task List
          </span>
          <span style={{ fontSize: "13px", color: "#8b5cf6" }}>{total} task{total !== 1 ? "s" : ""}</span>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <i className="bi bi-inbox" style={{ fontSize: "40px", color: "#c4b5fd" }}></i>
            <p style={{ color: "#6d28d9", fontWeight: "600", marginTop: "12px", marginBottom: "4px" }}>No tasks yet</p>
            <p style={{ color: "#a78bfa", fontSize: "13px", marginBottom: "20px" }}>
              {sessionId ? "No tasks found for this session." : "Start a session and add your first task."}
            </p>
            {canAdd && (
              <button className="sme-btn sme-btn-primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-lg"></i>Add First Task
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sme-table">
              <thead>
                <tr>
                  <th>Task Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th style={{ width: "140px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: "600", color: "#1e1b4b", maxWidth: "260px" }}>
                      {task.title}
                      {task.description && (
                        <div style={{ fontWeight: "400", color: "#8b5cf6", fontSize: "12px", marginTop: "2px" }}>{task.description}</div>
                      )}
                    </td>
                    <td><span style={statusStyle(task.status)}>{task.status}</span></td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>{fmtDT(task.createdAt)}</td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>{fmtDT(task.startTime)}</td>
                    <td style={{ color: "#6b7280", fontSize: "13px" }}>{fmtDT(task.endTime)}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {task.status === "pending" && (
                          <button className="sme-btn sme-btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => updateStatus(task._id, "in-progress")}>
                            Start
                          </button>
                        )}
                        {task.status === "in-progress" && (
                          <button className="sme-btn sme-btn-teal" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => updateStatus(task._id, "completed")}>
                            Complete
                          </button>
                        )}
                        {task.status === "completed" && (
                          <button className="sme-btn sme-btn-amber" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => updateStatus(task._id, "in-progress")}>
                            Reopen
                          </button>
                        )}
                        <button className="sme-btn sme-btn-danger" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => deleteTask(task._id)}>
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

      {/* ── Inline stats row ── */}
      {tasks.length > 0 && (
        <div className="sme-stat-row">
          <div className="sme-stat-cell">
            <div className="sme-stat-label">Total Tasks</div>
            <div className="sme-stat-value" style={{ color: "#4c1d95" }}>{total}</div>
          </div>
          <div className="sme-stat-cell">
            <div className="sme-stat-label">Completed</div>
            <div className="sme-stat-value" style={{ color: "#065f46" }}>{done}</div>
          </div>
          <div className="sme-stat-cell">
            <div className="sme-stat-label">In Progress</div>
            <div className="sme-stat-value" style={{ color: "#4c1d95" }}>{inProg}</div>
          </div>
          <div className="sme-stat-cell">
            <div className="sme-stat-label">Pending</div>
            <div className="sme-stat-value" style={{ color: "#6b7280" }}>{pend}</div>
          </div>
        </div>
      )}

      {/* ── Add Task Modal ── */}
      {showModal && (
        <div className="sme-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sme-modal" onClick={e => e.stopPropagation()}>
            <div className="sme-modal-header">
              <span style={{ fontWeight: "700", color: "#4c1d95", fontSize: "15px" }}>
                <i className="bi bi-plus-circle me-2" style={{ color: "#7c3aed" }}></i>Add New Task
              </span>
              <button onClick={() => { setShowModal(false); setError(""); setNewTask({ title: "", description: "" }); }}
                style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={addTask}>
              <div className="sme-modal-body">
                {error && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>
                    {error}
                  </div>
                )}
                <div style={{ marginBottom: "16px" }}>
                  <label className="sme-label">Task Title <span style={{ color: "#dc2626" }}>*</span></label>
                  <input
                    className="sme-input"
                    type="text"
                    value={newTask.title}
                    onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                    placeholder="Enter task title"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="sme-label">Description <span style={{ color: "#a78bfa", fontWeight: "400" }}>(optional)</span></label>
                  <textarea
                    className="sme-input"
                    rows="3"
                    value={newTask.description}
                    onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of the task"
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>
              <div className="sme-modal-footer">
                <button type="button" className="sme-btn sme-btn-ghost"
                  onClick={() => { setShowModal(false); setError(""); setNewTask({ title: "", description: "" }); }}>
                  Cancel
                </button>
                <button type="submit" className="sme-btn sme-btn-primary">
                  <i className="bi bi-plus-lg"></i>Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SMELayout>
  );
}

export default function SMETasks() {
  return (
    <Suspense fallback={
      <SMELayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div className="sme-spinner"></div>
        </div>
      </SMELayout>
    }>
      <SMETasksContent />
    </Suspense>
  );
}
