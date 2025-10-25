"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function DocumentPage() {
  const [docs, setDocs] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // 📥 Fetch documents
  async function fetchDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.documents || []);
    } catch (err) {
      setError("Failed to fetch documents");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  // 📤 Upload file
  async function uploadFile(e) {
    e.preventDefault();
    setError("");
    
    if (!docType) {
      setError("Please select a document type");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!file) {
      setError("Please choose a file");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!documentNumber) {
      setError("Please enter a document number");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!employeeId || !employeeName) {
      setError("Please select an employee");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "image/jpeg",
      "application/docx",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, ZIP, PNG, DOCX or JPEG files are allowed.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must not exceed 5MB.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", docType);
      formData.append("description", description);
      formData.append("file", file);
      formData.append("documentNumber", documentNumber);
      formData.append("employeeId", employeeId);
      formData.append("employeeName", employeeName);
      


      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setDescription("");
        setFile(null);
        setDocType("");
        setDocumentNumber("");
        setEmployeeId("");
        setEmployeeName("");
        fetchDocs();
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Upload failed. Please try again.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUploading(false);
    }
  }

  // 🗑️ Delete document
  async function deleteDoc(id) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      fetchDocs();
    } catch (err) {
      setError("Failed to delete document");
      setTimeout(() => setError(""), 3000);
    }
  }

  useEffect(() => {
    fetchDocs();
    fetchEmployees();
  }, []);

  // Fetch employees for selection
  async function fetchEmployees() {
    try {
      const res = await fetch("/api/Employee");
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }

  // 🛡️ Mask document number (letters + numbers)
  function maskNumber(num) {
    if (!num || typeof num !== "string") return "-";
    return num.replace(/.(?=.{4})/g, "x");
  }

  const handleView = (doc) => {
    window.open(doc.fileUrl, "_blank");
  };

  const filteredDocs = docs.filter(doc => 
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      {showSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-primary mb-0">
            <i className="bi bi-folder2-open me-2"></i>
            Document Manager
          </h1>
          <div className="badge bg-info fs-6">
            {docs.length} Documents
          </div>
        </div>

        {/* 📤 Upload Form */}
        <div className="row justify-content-center mb-5">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload New Document
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={uploadFile}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-file-earmark-text me-1"></i>
                      Document Type
                    </label>
                    <select
                      className="form-select"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      required
                      suppressHydrationWarning
                    >
                      <option value="">-- Select Document Type --</option>
                      <option value="Passport">📘 Passport</option>
                      <option value="Visa">🛂 Visa</option>
                      <option value="Driving License">🚗 Driving License</option>
                      <option value="Aadhaar Card">🆔 Aadhaar Card</option>
                      <option value="PAN Card">💳 PAN Card</option>
                      <option value="Education Certificate">🎓 Education Certificate</option>
                      <option value="Experience Letter">📋 Experience Letter</option>
                      <option value="Bank Details">🏦 Bank Details</option>
                      <option value="Offer Letter">📄 Offer Letter</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person me-1"></i>
                      Select Employee
                    </label>
                    <select
                      className="form-select"
                      value={employeeId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedEmployee = employees.find(emp => emp.employeeId === selectedId);
                        setEmployeeId(selectedId);
                        setEmployeeName(selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : "");
                      }}
                      required
                      suppressHydrationWarning
                    >
                      <option value="">-- Select Employee --</option>
                      {Array.isArray(employees) && employees.map(emp => (
                        <option key={emp._id} value={emp.employeeId}>
                          {emp.employeeId} - {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-hash me-1"></i>
                      Document Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Document Number"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      required
                      suppressHydrationWarning
                    />
                    <div className="form-text">
                      <i className="bi bi-shield-check me-1"></i>
                      Will be masked for security (e.g., Aadhaar No, PAN, Account No.)
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-chat-text me-1"></i>
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      suppressHydrationWarning
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-paperclip me-1"></i>
                      Upload File
                    </label>
                    <input
                      key={file ? file.name : 'file-input'}
                      type="file"
                      className="form-control"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Allowed: <span className="badge bg-secondary">PDF</span> <span className="badge bg-secondary">ZIP</span> <span className="badge bg-secondary">JPEG</span> <span className="badge bg-secondary">PNG</span> <span className="badge bg-secondary">DOCX</span> | Max: <strong>5MB</strong>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2" disabled={uploading} suppressHydrationWarning>
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-upload me-2"></i>
                        Upload Document
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* 📁 Documents Section */}
        <div className="card shadow-sm">
          <div className="card-header bg-secondary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-files me-2"></i>
                My Documents ({filteredDocs.length})
              </h5>
              <div className="d-flex align-items-center">
                {showSearch ? (
                  <div className="input-group" style={{width: '300px', transition: 'all 0.3s ease'}}>
                    <input
                      type="text"
                      className="form-control border-0"
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={() => !searchTerm && setShowSearch(false)}
                      autoFocus
                    />
                    <button 
                      className="btn btn-outline-light border-0" 
                      onClick={() => {
                        setSearchTerm('');
                        setShowSearch(false);
                      }}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn text-white" 
                    onClick={() => setShowSearch(true)}
                    style={{background: 'none', border: 'none'}}
                    suppressHydrationWarning
                  >
                    🔍
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading documents...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th><i className="bi bi-person me-1"></i>Employee</th>
                      <th><i className="bi bi-file-earmark me-1"></i>Document Type</th>
                      <th><i className="bi bi-hash me-1"></i>Document Number</th>
                      <th><i className="bi bi-filetype-pdf me-1"></i>File Type</th>
                      <th><i className="bi bi-calendar me-1"></i>Uploaded On</th>
                      <th><i className="bi bi-gear me-1"></i>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle text-primary me-2" style={{fontSize: '1.2rem'}}></i>
                            <div>
                              <div className="fw-semibold">{doc.employeeName || 'Unknown Employee'}</div>
                              <small className="text-muted">{doc.employeeId || 'N/A'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-file-earmark-pdf text-danger me-2" style={{fontSize: '1.2rem'}}></i>
                            <span className="fw-semibold">{doc.title}</span>
                          </div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded">{maskNumber(doc.documentNumber)}</code>
                        </td>
                        <td>
                          <span className="badge bg-info">{doc.fileType}</span>
                        </td>
                        <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <a
                              href={doc.fileUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              📥 Download
                            </a>
                            <button
                              onClick={() => handleView(doc)}
                              className="btn btn-sm btn-outline-success"
                            >
                              👁️ View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <i className="bi bi-folder2-open text-muted" style={{fontSize: '3rem'}}></i>
                          <p className="text-muted mt-2 mb-0">
                            {searchTerm ? `No documents found matching "${searchTerm}"` : 'No documents uploaded yet.'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes drawCircle {
          from { stroke-dasharray: 0 63; }
          to { stroke-dasharray: 63 63; }
        }
        @keyframes drawCheck {
          from { stroke-dasharray: 0 20; }
          to { stroke-dasharray: 20 20; }
        }
      `}</style>
    </Layout>
  );
}
