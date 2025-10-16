"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "../../../../components/Layout";

export default function EditBudgetPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    category: "",
    allocatedAmout: 0,
    spentAmount: 0,
    period: "Monthly"
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await fetch(`/api/budgeting/budgets/${params.id}`);
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error("Error fetching budget:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/budgeting/budgets/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        router.push("/accounting/budgeting");
      }
    } catch (error) {
      console.error("Error updating budget:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: "400px"}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-gradient-warning text-white">
                <div className="d-flex align-items-center">
                  <i className="fas fa-edit me-2"></i>
                  <div>
                    <h4 className="mb-0">Edit Budget</h4>
                    <small className="opacity-75">Update budget information</small>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        <i className="fas fa-tag me-1 text-primary"></i>
                        Category *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="e.g., Marketing, Operations"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        <i className="fas fa-calendar me-1 text-primary"></i>
                        Period *
                      </label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.period}
                        onChange={(e) => setFormData({...formData, period: e.target.value})}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        <i className="fas fa-wallet me-1 text-success"></i>
                        Allocated Amount *
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={formData.allocatedAmout}
                          onChange={(e) => setFormData({...formData, allocatedAmout: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        <i className="fas fa-credit-card me-1 text-warning"></i>
                        Spent Amount
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={formData.spentAmount}
                          onChange={(e) => setFormData({...formData, spentAmount: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>

                  {formData.allocatedAmout > 0 && (
                    <div className="alert alert-info border-0 bg-info bg-opacity-10">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle me-2"></i>
                        <div>
                          <strong>Budget Summary:</strong><br/>
                          Remaining: ₹{(formData.allocatedAmout - formData.spentAmount).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-flex gap-2 pt-3">
                    <button 
                      type="submit" 
                      className="btn btn-warning btn-lg px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-1"></i>
                          Update Budget
                        </>
                      )}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => router.back()} 
                      className="btn btn-outline-secondary btn-lg px-4"
                      disabled={loading}
                    >
                      <i className="fas fa-times me-1"></i>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}