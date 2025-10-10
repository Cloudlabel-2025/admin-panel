"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function MyProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [responseReason, setResponseReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    setEmployeeId(empId);
    if (empId) {
      fetchMyProjects(empId);
    }
  }, []);

  const fetchMyProjects = async (empId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/project?employee=true&employeeId=${empId}`);
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action) => {
    try {
      const res = await fetch("/api/project", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: selectedProject._id,
          action,
          responseReason
        })
      });

      if (res.ok) {
        alert(`Project ${action}ed successfully`);
        setShowModal(false);
        setResponseReason("");
        fetchMyProjects(employeeId);
      } else {
        alert("Failed to respond to project");
      }
    } catch (err) {
      console.error("Error responding to project:", err);
      alert("Error responding to project");
    }
  };

  const openResponseModal = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      "Pending": "bg-warning",
      "Accepted": "bg-success", 
      "Declined": "bg-danger"
    };
    return badges[status] || "bg-secondary";
  };

  return (
    <Layout>
      <div className="container mt-4">
        <h2>My Assigned Projects</h2>
        
        {loading ? (
          <p>Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="alert alert-info">No projects assigned to you.</div>
        ) : (
          <div className="row">
            {projects.map((project) => (
              <div key={project._id} className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header d-flex justify-content-between">
                    <h5>{project.projectName}</h5>
                    <span className={`badge ${getStatusBadge(project.assignmentStatus)}`}>
                      {project.assignmentStatus}
                    </span>
                  </div>
                  <div className="card-body">
                    <p><strong>Code:</strong> {project.projectCode}</p>
                    <p><strong>Description:</strong> {project.description || "No description"}</p>
                    <p><strong>Assigned By:</strong> {project.assignedBy?.name}</p>
                    <p><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}</p>
                    <p><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Not set"}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                    
                    {project.assignmentStatus === "Pending" && (
                      <div className="mt-3">
                        <button 
                          className="btn btn-success me-2"
                          onClick={() => openResponseModal(project)}
                        >
                          Accept
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => openResponseModal(project)}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    
                    {project.assignmentStatus !== "Pending" && project.responseReason && (
                      <div className="mt-3">
                        <p><strong>Response:</strong> {project.responseReason}</p>
                        <p><small>Responded on: {new Date(project.respondedAt).toLocaleString()}</small></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response Modal */}
        {showModal && selectedProject && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Respond to Project: {selectedProject.projectName}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Reason (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={responseReason}
                      onChange={(e) => setResponseReason(e.target.value)}
                      placeholder="Enter reason for your response..."
                    />
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
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => handleResponse("accept")}
                  >
                    Accept Project
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => handleResponse("decline")}
                  >
                    Decline Project
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