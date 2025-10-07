"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function ProjectPage() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "Planned",
    assignedBy: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  // Fetch Projects
  async function fetchProjects() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/project");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      if (!Array.isArray(data)) {
        setError(data.error || "Failed to load projects");
        setProjects([]);
      } else {
        setProjects(data);
      }
    } catch (err) {
      console.error("Project fetch error:", err);
      setError("Failed to fetch projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch Users
  async function fetchUsers() {
    try {
      const res = await fetch("/api/User");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  }

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function openModal(project = null) {
    setEditingProject(project);
    if (project) {
      setFormData({
        projectName: project.projectName,
        projectCode: project.projectCode,
        description: project.description || "",
        startDate: project.startDate?.slice(0, 10) || "",
        endDate: project.endDate?.slice(0, 10) || "",
        status: project.status,
        assignedBy: project.assignedBy?._id || "",
        assignedTo: project.assignedTo?._id || "",
      });
    } else {
      setFormData({
        projectName: "",
        projectCode: "",
        description: "",
        startDate: "",
        endDate: "",
        status: "Planned",
        assignedBy: "",
        assignedTo: "",
      });
    }
    setShowModal(true);
    setError("");
  }

  async function saveProject(e) {
    e.preventDefault();
    setError("");
    try {
      const method = editingProject ? "PUT" : "POST";
      const url = editingProject
        ? `/api/project/${editingProject._id}`
        : "/api/project";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) throw new Error(data.error || "Failed to save project");

      setShowModal(false);
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      console.error("Save Project Error:", err);
      setError(err.message);
    }
  }

  async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const res = await fetch(`/api/project/${id}`, { method: "DELETE" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Failed to delete project");
      fetchProjects();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  return (
    <Layout>
      <div className="container mt-5">
        <h1 className="mb-4 text-center">Projects</h1>
        <button className="btn btn-primary mb-3" onClick={() => openModal()}>
          + Add Project
        </button>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Assigned By</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td>{p.projectCode}</td>
                  <td>{p.projectName}</td>
                  <td>{p.status}</td>
                  <td>{p.startDate?.slice(0, 10)}</td>
                  <td>{p.endDate?.slice(0, 10)}</td>
                  <td>
                    {p.assignedBy?.name || "—"} <br />
                  </td>
                  <td>
                    {p.assignedTo?.name || "—"} <br />
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-info me-1"
                      onClick={() => openModal(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteProject(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={saveProject}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingProject ? "Edit Project" : "Add Project"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Project Name</label>
                      <input
                        className="form-control"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Project Code</label>
                      <input
                        className="form-control"
                        name="projectCode"
                        value={formData.projectCode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option>Planned</option>
                        <option>Ongoing</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Assigned By</label>
                      <select
                        className="form-select"
                        name="assignedBy"
                        value={formData.assignedBy}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Assigned By</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Assigned To</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Assigned To</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingProject ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
