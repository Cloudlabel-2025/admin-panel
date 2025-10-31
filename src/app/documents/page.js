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
  const [docNumberError, setDocNumberError] = useState("");

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

  async function uploadFile(e) {
    e.preventDefault();
    setError("");
    
    if (!docType || !file || !documentNumber || docNumberError || !employeeId || !employeeName) {
      setError("Please fill all required fields correctly");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const allowedTypes = ["application/pdf", "application/zip", "image/jpeg", "application/docx", "image/png"];
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

      const res = await fetch("/api/documents", { method: "POST", body: formData });

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

  useEffect(() => {
    fetchDocs();
    fetchEmployees();
  }, []);

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

  const validateDocumentNumber = (type, value) => {
    if (!value) {
      setDocNumberError("");
      return;
    }

    const validations = {
      "Passport": { regex: /^[A-Z][0-9]{7}$/, message: "Passport must be 1 letter + 7 digits" },
      "Aadhaar Card": { regex: /^[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}$/, message: "Aadhaar must be in format: 2XXX XXXX XXXX" },
      "PAN Card": { regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: "PAN must be 5 letters + 4 digits + 1 letter" },
      "Driving License": { regex: /^[A-Z]{2}[0-9]{13}$/, message: "Driving License must be 2 letters + 13 digits" },
      "Visa": { regex: /^[A-Z0-9]{8,12}$/, message: "Visa must be 8-12 alphanumeric characters" },
    };

    const validation = validations[type];
    if (validation) {
      setDocNumberError(!validation.regex.test(value) ? validation.message : "");
    } else {
      setDocNumberError("");
    }
  };

  const getPlaceholder = (type) => {
    const placeholders = {
      "Passport": "e.g., A1234567",
      "Aadhaar Card": "e.g., 2345 6789 0123",
      "PAN Card": "e.g., ABCDE1234F",
      "Driving License": "e.g., MH1234567890123",
      "Visa": "e.g., ABC12345",
    };
    return placeholders[type] || "Enter Document Number";
  };

  const getFormatHint = (type) => {
    const hints = {
      "Passport": "Format: 1 letter + 7 digits",
      "Aadhaar Card": "Format: 2XXX XXXX XXXX (with spaces, will be masked)",
      "PAN Card": "Format: 5 letters + 4 digits + 1 letter",
      "Driving License": "Format: 2 letters + 13 digits",
      "Visa": "Format: 8-12 alphanumeric characters",
    };
    return hints[type] || "Will be masked for security";
  };

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
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="row align-items-center mb-4">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <h1 className="mb-0 d-flex align-items-center" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700'}}>
              <i className="bi bi-folder2-open me-2"></i>
              <span className="d-none d-sm-inline">Document Manager</span>
              <span className="d-inline d-sm-none">Documents</span>
            </h1>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <div className="d-inline-flex align-items-center gap-2 flex-wrap">
              <div className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '1px solid #d4af37'}}>
                <i className="bi bi-files me-1"></i>
                {docs.length} Total
              </div>
              <div className="badge fs-6 px-3 py-2" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>
                <i className="bi bi-cloud-check me-1"></i>
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm" style={{borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4af37'}}>
              <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
                <div className="d-flex align-items-center justify-content-between py-2 flex-wrap gap-2">
                  <h5 className="mb-0">
                    <i className="bi bi-cloud-upload me-2"></i>
                    <span className="d-none d-sm-inline">Upload New Document</span>
                    <span className="d-inline d-sm-none">Upload</span>
                  </h5>
                  <span className="badge" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>Step by Step</span>
                </div>
              </div>
              <div className="card-body p-3 p-md-4">
                <form onSubmit={uploadFile}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-file-earmark-text me-1"></i>
                        Document Type
                      </label>
                      <select
                        className="form-select"
                        value={docType}
                        onChange={(e) => {
                          setDocType(e.target.value);
                          setDocumentNumber("");
                          setDocNumberError("");
                        }}
                        required
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

                    <div className="col-12 col-md-6">
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
                      >
                        <option value="">-- Select Employee --</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp.employeeId}>
                            {emp.employeeId} - {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-hash me-1"></i>
                        Document Number
                      </label>
                      <input
                        type="text"
                        className={`form-control ${docNumberError ? 'is-invalid' : documentNumber && !docNumberError && docType ? 'is-valid' : ''}`}
                        placeholder={docType ? getPlaceholder(docType) : "Select document type first"}
                        value={documentNumber}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (docType === "Aadhaar Card") {
                            value = value.replace(/\D/g, '');
                            if (value.length > 4 && value.length <= 8) {
                              value = value.slice(0, 4) + ' ' + value.slice(4);
                            } else if (value.length > 8) {
                              value = value.slice(0, 4) + ' ' + value.slice(4, 8) + ' ' + value.slice(8, 12);
                            }
                          } else {
                            value = value.toUpperCase();
                          }
                          setDocumentNumber(value);
                          validateDocumentNumber(docType, value);
                        }}
                        disabled={!docType}
                        required
                      />
                      {docNumberError && <div className="invalid-feedback"><i className="bi bi-x-circle me-1"></i>{docNumberError}</div>}
                      {!docNumberError && documentNumber && docType && <div className="valid-feedback"><i className="bi bi-check-circle me-1"></i>Valid format</div>}
                      <div className="form-text">
                        <i className="bi bi-shield-check me-1"></i>
                        <small>{docType ? getFormatHint(docType) : "Will be masked for security"}</small>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
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
                      ></textarea>
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-12">
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
                      {file && (
                        <div className="mt-2 p-2 bg-light rounded d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-file-earmark-check text-success me-2" style={{fontSize: '1.5rem'}}></i>
                            <div>
                              <div className="fw-semibold small">{file.name}</div>
                              <small className="text-muted">{(file.size / 1024).toFixed(2)} KB</small>
                            </div>
                          </div>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setFile(null)}>
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      )}
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        <small>Allowed: <span className="badge bg-secondary">PDF</span> <span className="badge bg-secondary">ZIP</span> <span className="badge bg-secondary">JPEG</span> <span className="badge bg-secondary">PNG</span> <span className="badge bg-secondary">DOCX</span> | Max: <strong>5MB</strong></small>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button type="submit" className="btn w-100 py-2 fw-semibold text-white" disabled={uploading || docNumberError} style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37', transition: 'all 0.3s ease'}}>
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{borderRadius: '12px', overflow: 'hidden', border: '1px solid #d4af37'}}>
          <div className="card-header text-white" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37'}}>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 py-2">
              <h5 className="mb-0">
                <i className="bi bi-files me-2"></i>
                <span className="d-none d-sm-inline">My Documents</span>
                <span className="d-inline d-sm-none">Docs</span>
                <span className="badge ms-2" style={{background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', fontWeight: '600'}}>{filteredDocs.length}</span>
              </h5>
              <div className="d-flex align-items-center">
                {showSearch ? (
                  <div className="input-group" style={{maxWidth: '300px', transition: 'all 0.3s ease'}}>
                    <input
                      type="text"
                      className="form-control form-control-sm border-0"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onBlur={() => !searchTerm && setShowSearch(false)}
                      autoFocus
                    />
                    <button className="btn btn-sm btn-outline-light border-0" onClick={() => { setSearchTerm(''); setShowSearch(false); }}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-sm text-white" onClick={() => setShowSearch(true)} style={{background: 'rgba(212, 175, 55, 0.3)', border: '1px solid rgba(212, 175, 55, 0.5)', borderRadius: '8px'}}>
                    <i className="bi bi-search"></i>
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
                  <thead style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)', borderBottom: '2px solid #d4af37'}}>
                    <tr>
                      <th className="d-none d-md-table-cell"><i className="bi bi-person me-1"></i>Employee</th>
                      <th><i className="bi bi-file-earmark me-1"></i><span className="d-none d-sm-inline">Document</span> Type</th>
                      <th className="d-none d-lg-table-cell"><i className="bi bi-hash me-1"></i>Doc Number</th>
                      <th className="d-none d-md-table-cell"><i className="bi bi-filetype-pdf me-1"></i>File Type</th>
                      <th className="d-none d-lg-table-cell"><i className="bi bi-calendar me-1"></i>Uploaded</th>
                      <th><i className="bi bi-gear me-1"></i>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={doc._id} style={{transition: 'all 0.2s ease'}}>
                        <td className="d-none d-md-table-cell">
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle p-2 me-2" style={{background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)'}}>
                              <i className="bi bi-person-fill text-white"></i>
                            </div>
                            <div>
                              <div className="fw-semibold small">{doc.employeeName || 'Unknown'}</div>
                              <small className="text-muted">{doc.employeeId || 'N/A'}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="rounded-circle bg-danger bg-opacity-10 p-2 me-2">
                              <i className="bi bi-file-earmark-pdf text-danger"></i>
                            </div>
                            <div>
                              <span className="fw-semibold small">{doc.title}</span>
                              <div className="d-md-none">
                                <small className="text-muted">{doc.employeeName}</small>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <code className="bg-light px-2 py-1 rounded small">{maskNumber(doc.documentNumber)}</code>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="badge bg-info bg-opacity-75">{doc.fileType}</span>
                        </td>
                        <td className="d-none d-lg-table-cell">
                          <small>{new Date(doc.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            <a href={doc.fileUrl} download target="_blank" rel="noopener noreferrer" className="btn" style={{border: '1px solid #1a1a1a', color: '#1a1a1a', fontSize: '0.875rem'}} title="Download">
                              <i className="bi bi-download"></i>
                              <span className="d-none d-xl-inline ms-1">Download</span>
                            </a>
                            <button onClick={() => handleView(doc)} className="btn" style={{border: '1px solid #d4af37', color: '#d4af37', fontSize: '0.875rem'}} title="View">
                              <i className="bi bi-eye"></i>
                              <span className="d-none d-xl-inline ms-1">View</span>
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
        .table-hover tbody tr:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(255, 255, 255, 0.05) 100%);
          transform: scale(1.01);
          border-left: 3px solid #d4af37;
        }
        .btn-group-sm .btn {
          border-radius: 6px;
        }
        .btn-group-sm .btn:hover {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%);
          color: #000;
          border-color: #d4af37;
        }
        @media (max-width: 768px) {
          .container-fluid {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
        }
      `}</style>
    </Layout>
  );
}
