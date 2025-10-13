"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function FundTransferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    amount: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "Super-admin") {
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
        alert("✅ Fund transfer notification sent to admin successfully!");
        setFormData({ amount: "", description: "" });
      } else {
        alert("❌ Failed to send fund transfer notification");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error occurred while processing transfer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2>💰 Fund Transfer to Admin</h2>
        <p className="text-muted">Transfer funds to admin account and notify them</p>

        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Amount (₹) <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="Enter amount"
                      required
                      min="1"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Purpose of transfer (optional)"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Transfer Funds"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}