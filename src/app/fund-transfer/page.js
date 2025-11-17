"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function FundTransferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "Super-admin" && userRole !== "admin" && userRole !== "developer") {
      router.push("/");
      return;
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    setLoading(true);
    try {
      const response = await fetch("/api/fund-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMessage("✅ Fund transfer notification sent to admin successfully!");
        setShowSuccess(true);
        setFormData({ amount: "", description: "" });
      } else {
        setSuccessMessage("❌ Failed to send fund transfer notification");
        setShowSuccess(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setSuccessMessage("❌ Error occurred while processing transfer");
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container py-4">
        {/* Header */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <h2 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
              <i className="bi bi-arrow-left-right me-2"></i>Fund Transfer to Admin
            </h2>
            <p className="mb-0" style={{ color: '#f4e5c3' }}>Transfer funds to admin account and notify them</p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-cash-stack me-2"></i>Transfer Details</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-currency-rupee me-2"></i>Amount (₹) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      value={formData.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 8) {
                          setFormData({...formData, amount: value});
                        }
                      }}
                      placeholder="Enter amount"
                      required
                      min="1"
                      maxLength="8"
                      style={{ borderColor: '#d4af37' }}
                    />
                    <small className="text-muted">Enter the amount to transfer (max 8 digits)</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold"><i className="bi bi-file-text me-2"></i>Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Purpose of transfer (optional)"
                      style={{ borderColor: '#d4af37' }}
                    />
                    <small className="text-muted">Optional: Provide details about the transfer</small>
                  </div>

                  <div className="d-grid">
                    <button 
                      type="submit" 
                      className="btn btn-lg"
                      disabled={loading}
                      style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>Transfer Funds
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Info Card */}
            <div className="card shadow-sm mt-4" style={{ border: '2px solid #d4af37', background: 'rgba(212, 175, 55, 0.05)' }}>
              <div className="card-body p-3">
                <div className="d-flex align-items-start">
                  <i className="bi bi-info-circle me-3" style={{ fontSize: '1.5rem', color: '#d4af37' }}></i>
                  <div>
                    <h6 className="mb-2" style={{ color: '#1a1a1a' }}>Transfer Information</h6>
                    <ul className="mb-0 text-muted small">
                      <li>Admin will be notified immediately after transfer</li>
                      <li>Transaction will be recorded in the system</li>
                      <li>Ensure the amount is correct before submitting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}