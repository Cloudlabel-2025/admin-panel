"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function DocumentPage() {
  const [docs, setDocs] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  // 📥 Fetch documents
  async function fetchDocs() {
    const res = await fetch("/api/documents");
    const data = await res.json();
    console.log("📄 Documents:", data.documents); // Debug
    setDocs(data.documents || []);
  }

  // 📤 Upload file
  async function uploadFile(e) {
    e.preventDefault();
    if (!docType) return alert("Please select a document type");
    if (!file) return alert("Please choose a file");
    if (!documentNumber) return alert("Please enter a document number");

    const allowedTypes = [
      "application/pdf",
      "application/zip",
      "image/jpeg",
      "application/docx",
      "image/png",
    ];
    if (!allowedTypes.includes(file.type)) {
      return alert("Only PDF, ZIP, PNG, DOCX or JPEG files are allowed.");
    }

    if (file.size > 5 * 1024 * 1024) {
      return alert("File size must not exceed 5MB.");
    }

    const formData = new FormData();
    formData.append("title", docType);
    formData.append("description", description);
    formData.append("file", file);
    formData.append("documentNumber", documentNumber);

    await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    e.target.reset();
    setDescription("");
    setFile(null);
    setDocType("");
    setDocumentNumber("");
    fetchDocs();
  }

  // 🗑️ Delete document
  async function deleteDoc(id) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    fetchDocs();
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  // 🛡️ Mask document number (letters + numbers)
  function maskNumber(num) {
    if (!num || typeof num !== "string") return "-";
    return num.replace(/.(?=.{4})/g, "x");
  }

  const handleView = (doc) => {
    window.open(doc.fileUrl, "_blank");
  };

  return (
    <Layout>
      <div className="container py-4">
        <h1 className="mb-4 fw-bold fs-3 text-center">📂 Document Manager</h1>

        {/* 📤 Upload Form */}
        <div className="container d-flex justify-content-center">
          <div className="col-md-6 col-lg-5">
            <form
              onSubmit={uploadFile}
              className="bg-light p-4 rounded shadow-sm mb-5"
            >
              <div className="mb-3">
                <label className="form-label">Document Type</label>
                <select
                  className="form-select"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  required
                >
                  <option value="">-- Select Document Type --</option>
                  <option value="Passport">Passport</option>
                  <option value="Visa">Visa</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Education Certificate">Education Certificate</option>
                  <option value="Experience Letter">Experience Letter</option>
                  <option value="Bank Details">Bank Details</option>
                  <option value="Offer Letter">Offer Letter</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Document Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Document Number"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                />
                <div className="form-text">
                  e.g., Aadhaar No, PAN, Account No. - Will be masked later
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Enter description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Upload File</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
                <div className="form-text">
                  Allowed: <b>.pdf, .zip, .jpeg, .png, .docx </b> | Max: <b>5MB</b>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Upload
              </button>
            </form>
          </div>
        </div>

        {/* 📁 Documents Table */}
        <div className="table-responsive">
          <table className="table table-bordered align-middle text-center">
            <thead className="table-secondary">
              <tr>
                <th>Document Type</th>
                <th>Document Number</th>
                <th>File Type</th>
                <th>Uploaded On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc.title}</td>
                  <td>{maskNumber(doc.documentNumber)}</td>
                  <td>{doc.fileType}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td>
                    <a
                      href={doc.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary me-2"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleView(doc)}
                      className="btn btn-sm btn-outline-success me-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteDoc(doc._id)}
                      className="btn btn-sm btn-outline-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">
                    No documents uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
