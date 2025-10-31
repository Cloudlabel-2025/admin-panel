"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import { formatDate } from "../../utilis/dateFormat";

export default function EmployeeDetails({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [skills, setSkills] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    if (resolvedParams?.id) {
      fetchEmployeeData(resolvedParams.id);
    }
  }, [resolvedParams]);

  const fetchEmployeeData = async (employeeId) => {
    try {
      const [empRes, projRes, docsRes, attRes, skillsRes, perfRes] = await Promise.all([
        fetch("/api/Employee"),
        fetch("/api/project"),
        fetch("/api/documents"),
        fetch("/api/attendance"),
        fetch("/api/skills"),
        fetch("/api/performance")
      ]);

      const employees = await empRes.json();
      const emp = Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null;
      setEmployee(emp);

      const allProjects = await projRes.json();
      setProjects(Array.isArray(allProjects) ? allProjects.filter(p => p.assignedTo?.employeeId === employeeId) : []);

      const allDocs = await docsRes.json();
      setDocuments(Array.isArray(allDocs.documents) ? allDocs.documents.filter(d => d.employeeId === employeeId) : []);

      const allAtt = await attRes.json();
      setAttendance(Array.isArray(allAtt) ? allAtt.filter(a => a.employeeId === employeeId).slice(-10) : []);

      const allSkills = await skillsRes.json();
      setSkills(Array.isArray(allSkills) ? allSkills.filter(s => s.employeeId === employeeId) : []);

      const allPerf = await perfRes.json();
      const empPerf = Array.isArray(allPerf) ? allPerf.filter(p => p.employeeId === employeeId) : [];
      if (empPerf.length > 0) {
        const avgRating = empPerf.reduce((sum, p) => sum + (p.overallRating || 0), 0) / empPerf.length;
        setPerformance({ reviews: empPerf, averageRating: avgRating.toFixed(1) });
      }
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminationReason.trim()) {
      alert("Please provide a termination reason");
      return;
    }

    try {
      const terminatedBy = localStorage.getItem("employeeId");
      const response = await fetch("/api/Employee/terminate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          employeeId: resolvedParams.id, 
          terminatedBy,
          reason: terminationReason 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Employee terminated successfully!");
        router.push("/employees/employees-list");
      } else {
        alert(data.error || "Failed to terminate employee");
      }
    } catch (error) {
      console.error("Error terminating employee:", error);
      alert("Error terminating employee");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#d4af37' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!employee) {
    return (
      <Layout>
        <div className="text-center py-5">
          <h3>Employee not found</h3>
          <button className="btn btn-primary mt-3" onClick={() => router.back()}>Go Back</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-2"></i>Back
          </button>
          {(userRole === "super-admin" || userRole === "Super-admin") && (
            <button 
              className="btn btn-danger"
              onClick={() => setShowTerminateModal(true)}
            >
              <i className="bi bi-person-x me-2"></i>Terminate Employee
            </button>
          )}
        </div>

        {/* Header Card with Profile Picture */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-auto">
                {employee.profilePicture ? (
                  <img 
                    src={employee.profilePicture} 
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="rounded-circle"
                    style={{ width: '100px', height: '100px', objectFit: 'cover', border: '3px solid #d4af37' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '100px', height: '100px', backgroundColor: '#f0f0f0', border: '3px solid #d4af37' }}
                  >
                    <i className="bi bi-person-fill" style={{ fontSize: '50px', color: '#999' }}></i>
                  </div>
                )}
              </div>
              <div className="col">
                <h3 className="mb-1" style={{ color: '#ffffff' }}>{employee.firstName} {employee.lastName}</h3>
                <p className="mb-2" style={{ color: '#d4af37', fontSize: '1.1rem' }}>{employee.employeeId}</p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', padding: '6px 12px' }}>
                    <i className="bi bi-building me-1"></i>{employee.department}
                  </span>
                  <span className="badge bg-light text-dark" style={{ padding: '6px 12px' }}>
                    <i className="bi bi-briefcase me-1"></i>{employee.role}
                  </span>
                  <span className="badge bg-light text-dark" style={{ padding: '6px 12px' }}>
                    <i className="bi bi-envelope me-1"></i>{employee.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0"><i className="bi bi-person-vcard me-2"></i>Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-telephone me-2"></i>Phone:</strong> {employee.phone || 'N/A'}
              </div>
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-gender-ambiguous me-2"></i>Gender:</strong> {employee.gender || 'N/A'}
              </div>
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-cake me-2"></i>Date of Birth:</strong> {employee.dob ? formatDate(employee.dob) : 'N/A'}
              </div>
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-calendar-check me-2"></i>Joining Date:</strong> {employee.joiningDate ? formatDate(employee.joiningDate) : 'N/A'}
              </div>
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-geo-alt me-2"></i>Address:</strong> {employee.address?.city || 'N/A'}, {employee.address?.state || 'N/A'}
              </div>
              <div className="col-md-6 mb-3">
                <strong><i className="bi bi-person-badge me-2"></i>Status:</strong> <span className="badge bg-success">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0"><i className="bi bi-kanban me-2"></i>Projects ({projects.length})</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {projects.length === 0 ? (
                  <p className="text-muted text-center">No projects assigned</p>
                ) : (
                  projects.map(p => (
                    <div key={p._id} className="border-bottom pb-2 mb-2">
                      <strong>{p.projectName}</strong>
                      <div><small className="text-muted">Code: {p.projectCode}</small></div>
                      <div><small>Status: <span className={`badge ${p.status === 'Completed' ? 'bg-success' : p.status === 'Ongoing' ? 'bg-warning' : 'bg-secondary'}`}>{p.status}</span></small></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0"><i className="bi bi-star me-2"></i>Performance</h5>
              </div>
              <div className="card-body">
                {performance ? (
                  <>
                    <div className="text-center mb-3">
                      <h2 style={{ color: '#d4af37' }}>{performance.averageRating}/5</h2>
                      <p className="text-muted">Overall Rating</p>
                    </div>
                    <div><strong>Total Reviews:</strong> {performance.reviews.length}</div>
                  </>
                ) : (
                  <p className="text-muted text-center">No performance reviews yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0"><i className="bi bi-file-earmark me-2"></i>Documents ({documents.length})</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {documents.length === 0 ? (
                  <p className="text-muted text-center">No documents uploaded</p>
                ) : (
                  documents.map(doc => (
                    <div key={doc._id} className="border-bottom pb-2 mb-2">
                      <strong>{doc.title}</strong>
                      <div><small className="text-muted">Type: {doc.fileType}</small></div>
                      <div><small>Uploaded: {formatDate(doc.createdAt)}</small></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0"><i className="bi bi-calendar-check me-2"></i>Recent Attendance</h5>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {attendance.length === 0 ? (
                  <p className="text-muted text-center">No attendance records</p>
                ) : (
                  attendance.map((att, idx) => (
                    <div key={idx} className="d-flex justify-content-between border-bottom pb-2 mb-2">
                      <span>{formatDate(att.date)}</span>
                      <span className={`badge ${att.status === 'Present' ? 'bg-success' : att.status === 'Absent' ? 'bg-danger' : 'bg-warning'}`}>{att.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0"><i className="bi bi-trophy me-2"></i>Skills ({skills.length})</h5>
          </div>
          <div className="card-body">
            {skills.length === 0 ? (
              <p className="text-muted text-center">No skills added</p>
            ) : (
              <div className="row">
                {skills.map(skill => (
                  <div key={skill._id} className="col-md-6 mb-3">
                    <div className="border rounded p-3">
                      <strong>{skill.skillName}</strong>
                      <div className="progress mt-2" style={{ height: '8px' }}>
                        <div className="progress-bar" style={{ width: `${skill.proficiency}%`, background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)' }}></div>
                      </div>
                      <small className="text-muted">{skill.proficiency}% Proficiency</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showTerminateModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="modal-title text-white">
                    <i className="bi bi-exclamation-triangle me-2" style={{ color: '#d4af37' }}></i>
                    Terminate Employee
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowTerminateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to terminate <strong>{employee.firstName} {employee.lastName}</strong>?</p>
                  <div className="mb-3">
                    <label className="form-label">Termination Reason *</label>
                    <textarea 
                      className="form-control" 
                      rows="3"
                      value={terminationReason}
                      onChange={(e) => setTerminationReason(e.target.value)}
                      placeholder="Enter reason for termination"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowTerminateModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleTerminate}>
                    <i className="bi bi-person-x me-2"></i>Terminate
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
