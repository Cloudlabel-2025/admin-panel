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
    adminId: "",
    adminName: "",
    adminEmail: "",
    amount: "",
    month: new Date().toISOString().slice(0, 7)
  });
  const [error, setError] = useState("");
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "in",
          category: "Budget Allocation",
          amount: parseFloat(formData.amount),
          description: `Budget allocated to ${formData.adminName} for ${formData.month}`,
          handledBy: formData.adminId,
          handledByName: formData.adminName,
          approvedBy: localStorage.getItem("employeeId"),
          month: formData.month,
          isAllocation: true,
          date: new Date()
        })
      });
      
      if (response.ok) {
        alert("Budget allocated successfully!");
        router.push("/accounting/petty-cash");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to allocate budget");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error allocating budget");
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
                  <i className="bi bi-plus-circle-fill me-2"></i>Allocate Budget
                </h1>
                <small style={{ color: '#f4e5c3' }}>Allocate budget to admin for expenses</small>
              </div>
              <button type="button" onClick={() => router.back()} className="btn" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                <i className="bi bi-arrow-left me-2"></i>Back
              </button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-info-circle-fill me-2"></i>Budget Allocation Details</h5>
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
                  <label className="form-label fw-semibold">Select Admin <span className="text-danger">*</span></label>
                  <select 
                    className="form-control" 
                    value={formData.adminId} 
                    onChange={(e) => {
                      const admin = admins.find(a => a.employeeId === e.target.value);
                      setFormData({
                        ...formData,
                        adminId: e.target.value,
                        adminName: admin ? `${admin.firstName} ${admin.lastName}` : "",
                        adminEmail: admin ? admin.email : ""
                      });
                    }} 
                    required
                  >
                    <option value="">Choose Admin...</option>
                    {admins.map(admin => (
                      <option key={admin.employeeId} value={admin.employeeId}>
                        {admin.firstName} {admin.lastName} ({admin.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Amount (₹) <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.amount} 
                    onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    required 
                    min="1"
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label fw-semibold">Month <span className="text-danger">*</span></label>
                  <input 
                    type="month" 
                    className="form-control" 
                    value={formData.month} 
                    onChange={(e) => setFormData({...formData, month: e.target.value})} 
                    required
                  />
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" onClick={() => router.back()} className="btn" style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent', fontWeight: '600' }}>
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button type="submit" className="btn px-4" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                  <i className="bi bi-save me-2"></i>Allocate Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}