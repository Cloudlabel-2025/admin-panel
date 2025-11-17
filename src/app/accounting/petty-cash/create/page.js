"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";

export default function CreatePettyCashPage() {
  const router = useRouter();

  useState(() => {
    fetch('/api/Employee')
      .then(res => res.json())
      .then(data => {
        const adminList = data.filter(emp => emp.role === 'admin' || emp.role === 'Admin');
        const superAdminList = data.filter(emp => emp.role === 'super-admin' || emp.role === 'Super-admin');
        setAdmins(adminList);
        setSuperAdmins(superAdminList);
      })
      .catch(console.error);
  }, []);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: "",
    category: "",
    type: "out",
    amount: "",
    handledBy: "",
    approvedBy: "",
    receipt: null
  });
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.date > today) {
      setError("Date cannot be in the future");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(formData.category)) {
      setError("Category must contain only letters and spaces");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (formData.amount < 1 || formData.amount > 999999) {
      setError("Amount must be between 1 and 999999");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    try {
      const response = await fetch("/api/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      if (response.ok) {
        router.push("/accounting/petty-cash");
      }
    } catch (error) {
      console.error("Error creating petty cash entry:", error);
    }
  };

  return (
    <Layout>
      <div className="container py-4">
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>Add Petty Cash Entry
                </h1>
                <small style={{ color: '#f4e5c3' }}>Create a new petty cash transaction record</small>
              </div>
              <button type="button" onClick={() => router.back()} className="btn" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                <i className="bi bi-arrow-left me-2"></i>Back
              </button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-info-circle-fill me-2"></i>Transaction Details</h5>
          </div>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-arrow-left-right me-2" style={{ color: '#d4af37' }}></i>Type <span className="text-danger">*</span></label>
                  <select className="form-control" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required style={{ border: '2px solid #d4af37', padding: '12px' }}>
                    <option value="out">Cash Out (Debit)</option>
                    <option value="in">Cash In (Credit)</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-calendar-fill me-2" style={{ color: '#d4af37' }}></i>Date <span className="text-danger">*</span></label>
                  <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} max={today} required style={{ border: '2px solid #d4af37', padding: '12px' }} />
                  <small className="text-muted">Cannot select future dates</small>
                </div>
              </div>
          
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-tag-fill me-2" style={{ color: '#d4af37' }}></i>Category <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.category} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
                      setFormData({...formData, category: value});
                    }} 
                    placeholder="e.g., Office Supplies, Travel" 
                    maxLength={25}
                    required 
                    style={{ border: '2px solid #d4af37', padding: '12px' }} 
                  />
                  <small className="text-muted">Only letters and spaces, max 25 characters</small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-currency-rupee me-2" style={{ color: '#d4af37' }}></i>Amount <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    placeholder="0.00" 
                    min="1"
                    max="999999"
                    required 
                    style={{ border: '2px solid #d4af37', padding: '12px' }} 
                  />
                  <small className="text-muted">Min: 1, Max: 999999</small>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-person-fill me-2" style={{ color: '#d4af37' }}></i>Handled By (Admin) <span className="text-danger">*</span></label>
                  <select 
                    className="form-control" 
                    value={formData.handledBy} 
                    onChange={(e) => setFormData({...formData, handledBy: e.target.value})} 
                    required 
                    style={{ border: '2px solid #d4af37', padding: '12px' }}
                  >
                    <option value="">Select Admin</option>
                    {admins.map(admin => (
                      <option key={admin._id} value={`${admin.firstName} ${admin.lastName}`}>
                        {admin.firstName} {admin.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-check-circle-fill me-2" style={{ color: '#d4af37' }}></i>Approved By (Super Admin) <span className="text-danger">*</span></label>
                  <select 
                    className="form-control" 
                    value={formData.approvedBy} 
                    onChange={(e) => setFormData({...formData, approvedBy: e.target.value})} 
                    required 
                    style={{ border: '2px solid #d4af37', padding: '12px' }}
                  >
                    <option value="">Select Super Admin</option>
                    {superAdmins.map(sa => (
                      <option key={sa._id} value={`${sa.firstName} ${sa.lastName}`}>
                        {sa.firstName} {sa.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-file-text-fill me-2" style={{ color: '#d4af37' }}></i>Description</label>
                <textarea 
                  className="form-control" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Brief description of the transaction (optional)" 
                  rows="4" 
                  maxLength={200}
                  style={{ border: '2px solid #d4af37', padding: '12px' }} 
                />
                <small className="text-muted">{formData.description.length}/200 characters</small>
              </div>
              
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-paperclip me-2" style={{ color: '#d4af37' }}></i>Receipt Upload (Optional)</label>
                <input type="file" className="form-control" onChange={(e) => setFormData({...formData, receipt: e.target.files[0]})} accept=".pdf,.jpg,.jpeg,.png" style={{ border: '2px solid #d4af37', padding: '12px' }} />
                <small className="text-muted">Accepted formats: PDF, JPG, JPEG, PNG</small>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" onClick={() => router.back()} className="btn" style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent', fontWeight: '600' }}>
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="submit" className="btn px-4" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                  <i className="bi bi-save me-2"></i>Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}