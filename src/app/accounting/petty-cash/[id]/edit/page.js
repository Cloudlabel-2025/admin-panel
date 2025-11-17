"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "../../../../components/Layout";

export default function EditPettyCashPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    type: "out",
    category: "",
    amount: "",
    description: "",
    handledBy: "",
    date: ""
  });

  useEffect(() => {
    fetchEntry();
  }, []);

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/petty-cash/${params.id}`);
      const data = await response.json();
      setFormData({
        ...data,
        date: new Date(data.date).toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error fetching entry:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/petty-cash/${params.id}`, {
        method: "PUT",
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
      console.error("Error updating entry:", error);
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
                  <i className="bi bi-pencil-square me-2"></i>Edit Petty Cash Entry
                </h1>
                <small style={{ color: '#f4e5c3' }}>Update petty cash transaction details</small>
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
                  <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required style={{ border: '2px solid #d4af37', padding: '12px' }} />
                </div>
              </div>
          
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-tag-fill me-2" style={{ color: '#d4af37' }}></i>Category <span className="text-danger">*</span></label>
                  <input type="text" className="form-control" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required style={{ border: '2px solid #d4af37', padding: '12px' }} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-currency-rupee me-2" style={{ color: '#d4af37' }}></i>Amount <span className="text-danger">*</span></label>
                  <input type="number" step="0.01" className="form-control" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required style={{ border: '2px solid #d4af37', padding: '12px' }} />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-person-fill me-2" style={{ color: '#d4af37' }}></i>Handled By <span className="text-danger">*</span></label>
                <input type="text" className="form-control" value={formData.handledBy} onChange={(e) => setFormData({...formData, handledBy: e.target.value})} required style={{ border: '2px solid #d4af37', padding: '12px' }} />
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-file-text-fill me-2" style={{ color: '#d4af37' }}></i>Description</label>
                <textarea className="form-control" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="4" style={{ border: '2px solid #d4af37', padding: '12px' }} />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" onClick={() => router.back()} className="btn" style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent', fontWeight: '600' }}>
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="submit" className="btn px-4" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                  <i className="bi bi-save me-2"></i>Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}