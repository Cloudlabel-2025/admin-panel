"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import { makeAuthenticatedRequest } from "@/app/utilis/tokenManager";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    deliveryDate: '',
    totalAmount: '',
    description: ''
  });

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
      router.push("/");
      return;
    }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await makeAuthenticatedRequest("/api/purchasing/purchase-orders");
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setOrders([]);
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
        return fetch('/api/purchasing/purchase-orders', {
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
          vendorName: '',
          vendorEmail: '',
          vendorPhone: '',
          deliveryDate: '',
          totalAmount: '',
          description: ''
        });
        fetchOrders();
        alert('Purchase Order uploaded successfully!');
      } else {
        alert('Error uploading purchase order');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading purchase order');
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
        <h1>📋 Purchase Orders - Document Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          ➕ Upload Purchase Order
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Vendor Name</th>
              <th>Upload Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.poNumber}</td>
                <td>{order.vendorName}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>₹{order.totalAmount || 'N/A'}</td>
                <td>
                  <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Approved' ? 'bg-warning' : 'bg-secondary'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-info"
                    onClick={() => downloadFile(order.fileUrl, order.fileName)}
                  >
                    📄 Download
                  </button>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteOrder(order._id)}>
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
                <h5 className="modal-title">Upload Purchase Order Document</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
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
                      <label className="form-label">Vendor Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        name="vendorPhone"
                        value={formData.vendorPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Delivery Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="deliveryDate"
                        value={formData.deliveryDate}
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
                      <label className="form-label">Upload PO Document *</label>
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
                    Upload Purchase Order
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

  async function deleteOrder(id) {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      try {
        const response = await makeAuthenticatedRequest(`/api/purchasing/purchase-orders/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchOrders();
          alert('Purchase order deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  }
}