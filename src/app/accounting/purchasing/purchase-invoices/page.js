"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

import SuccessMessage from "@/app/components/SuccessMessage";

export default function PurchaseInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    poNumber: '',
    vendorName: '',
    vendorEmail: '',
    invoiceDate: '',
    dueDate: '',
    totalAmount: '',
    paidAmount: '',
    description: ''
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin" && userRole !== "developer") {
      router.push("/");
      return;
    }
    fetchInvoices();
  }, [router]);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("/api/purchasing/purchase-invoices", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchase invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    Object.keys(formData).forEach(key => {
      uploadData.append(key, formData[key]);
    });

    try {
      let token = localStorage.getItem('token');
      
      const makeRequest = async (authToken) => {
        return fetch('/api/purchasing/purchase-invoices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: uploadData
        });
      };
      
      let response = await makeRequest(token);
      
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        const refreshResponse = await fetch('/api/User/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('token', data.token);
          token = data.token;
          response = await makeRequest(token);
        }
      }

      if (response.ok) {
        setShowModal(false);
        setSelectedFile(null);
        setFormData({
          poNumber: '',
          vendorName: '',
          vendorEmail: '',
          invoiceDate: '',
          dueDate: '',
          totalAmount: '',
          paidAmount: '',
          description: ''
        });
        fetchInvoices();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Error uploading purchase invoice');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading purchase invoice');
    }
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🧾 Purchase Invoices - Document Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Upload Purchase Invoice
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>PO Number</th>
              <th>Vendor Name</th>
              <th>Upload Date</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Status</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.poNumber || 'N/A'}</td>
                <td>{invoice.vendorName}</td>
                <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td>₹{invoice.totalAmount || 'N/A'}</td>
                <td>₹{invoice.paidAmount || '0'}</td>
                <td>
                  <span className={`badge ${invoice.status === 'Paid' ? 'bg-success' : invoice.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={() => downloadFile(invoice.fileUrl, invoice.fileName)}
                  >
                    📄 Download
                  </button>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteInvoice(invoice._id)}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Purchase Invoice Document</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">PO Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="poNumber"
                        value={formData.poNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Vendor Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="vendorName"
                        value={formData.vendorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Vendor Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="vendorEmail"
                        value={formData.vendorEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Invoice Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="invoiceDate"
                        value={formData.invoiceDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Total Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Paid Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                      ></textarea>
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Upload Invoice Document *</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        required
                      />
                      <small className="text-muted">Supported formats: PDF, DOC, DOCX, JPG, PNG</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Upload Purchase Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <SuccessMessage 
        show={showSuccess} 
        message="Operation completed successfully!" 
        onClose={() => setShowSuccess(false)} 
      />
    </div>
    </Layout>
  );

  async function deleteInvoice(id) {
    if (confirm('Are you sure you want to delete this purchase invoice?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/purchasing/purchase-invoices/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchInvoices();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  }
}