"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";
import { makeAuthenticatedRequest } from "../../utilis/tokenManager";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "", gstin: "",
    address: { street: "", city: "", state: "", zipCode: "", country: "India" },
    placeOfSupply: "Telangana (36)"
  });
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
      router.push("/");
      return;
    }
    fetchClients();
  }, [router]);

  const fetchClients = async () => {
    try {
      const response = await makeAuthenticatedRequest("/api/clients");
      const data = await response.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await makeAuthenticatedRequest("/api/clients", {
        method: "POST",
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        fetchClients();
        setFormData({
          name: "", email: "", phone: "", company: "", gstin: "",
          address: { street: "", city: "", state: "", zipCode: "", country: "India" },
          placeOfSupply: "Telangana (36)"
        });
      }
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };

  if (loading) return (
    <Layout>
      <div className="d-flex justify-content-center align-items-center" style={{height: "50vh"}}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1"><i className="bi bi-people me-2"></i>Client Management</h2>
            <p className="text-muted mb-0">Manage your clients and their information</p>
          </div>
          <div>
            <Link href="/invoices" className="btn btn-outline-secondary me-2">
              <i className="bi bi-arrow-left me-2"></i>Back to Invoices
            </Link>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>Add Client
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0">
            <h6 className="mb-0"><i className="bi bi-table me-2"></i>Clients ({clients.length})</h6>
          </div>
          <div className="card-body p-0">
            {clients.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-people" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                <h5 className="text-muted mt-3">No clients found</h5>
                <p className="text-muted">Add your first client to get started</p>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>Add Client
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Name</th>
                      <th className="border-0 fw-semibold">Company</th>
                      <th className="border-0 fw-semibold">Email</th>
                      <th className="border-0 fw-semibold">Phone</th>
                      <th className="border-0 fw-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client._id} className="align-middle">
                        <td><strong>{client.name}</strong></td>
                        <td>{client.company || 'N/A'}</td>
                        <td>{client.email}</td>
                        <td>{client.phone || 'N/A'}</td>
                        <td>{client.address?.city || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Client Modal */}
        {showModal && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Client</h5>
                  <button className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Name *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email *</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input 
                          type="tel" 
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Company</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-12">
                        <label className="form-label">Street Address *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          required
                          value={formData.address.street}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-4">
                        <label className="form-label">City *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          required
                          value={formData.address.city}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">State *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          required
                          value={formData.address.state}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">ZIP Code *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          required
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">GSTIN</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.gstin}
                          onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Place of Supply</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.placeOfSupply}
                          onChange={(e) => setFormData({...formData, placeOfSupply: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add Client</button>
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