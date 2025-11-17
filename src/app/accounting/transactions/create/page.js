"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";

export default function CreateTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Income",
    description: "",
    account: "",
    amount: "",
    paymentMethod: "Cash",
    document: null
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          fromAccount: formData.type === 'Income' ? formData.account : null,
          toAccount: formData.type === 'Expense' ? formData.account : null,
          type: formData.type === 'Income' ? 'Credit' : 'Debit',
          source: 'manual'
        })
      });
      if (response.ok) {
        router.push("/accounting/transactions");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  return (
    <Layout>
      <div className="container py-4">
      {/* Header */}
      <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                <i className="bi bi-plus-circle me-2"></i>Create Transaction
              </h2>
              <p className="mb-0" style={{ color: '#f4e5c3' }}>Add a new financial transaction to the system</p>
            </div>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="btn"
              style={{ background: 'transparent', border: '2px solid #d4af37', color: '#d4af37' }}
            >
              <i className="bi bi-arrow-left me-2"></i>Back
            </button>
          </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-file-earmark-text me-2"></i>Transaction Details</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold"><i className="bi bi-calendar3 me-2"></i>Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control form-control-lg"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold"><i className="bi bi-arrow-left-right me-2"></i>Type <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        required
                      >
                        <option value="Income">Income</option>
                        <option value="Expense">Expense</option>
                      </select>
                    </div>
                  </div>
                </div>
        
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold"><i className="bi bi-building me-2"></i>Account <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-lg"
                        value={formData.account}
                        onChange={(e) => setFormData({...formData, account: e.target.value})}
                        required
                      >
                        <option value="">Select Account</option>
                        {accounts.map(account => (
                          <option key={account._id} value={account._id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-4">
                      <label className="form-label fw-semibold"><i className="bi bi-currency-rupee me-2"></i>Amount <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control form-control-lg"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                  </div>
                </div>
        
                <div className="mb-4">
                  <label className="form-label fw-semibold"><i className="bi bi-credit-card me-2"></i>Payment Method</label>
                  <select
                    className="form-select form-select-lg"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
        
                <div className="mb-4">
                  <label className="form-label fw-semibold"><i className="bi bi-file-text me-2"></i>Description <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="4"
                    placeholder="Enter transaction description"
                    required
                  />
                </div>
        
                <div className="mb-4">
                  <label className="form-label fw-semibold"><i className="bi bi-paperclip me-2"></i>Attach Document (Optional)</label>
                  <input
                    type="file"
                    className="form-control form-control-lg"
                    onChange={(e) => setFormData({...formData, document: e.target.files[0]})}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <small className="text-muted">Accepted formats: PDF, JPG, JPEG, PNG</small>
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button 
                    type="button" 
                    onClick={() => router.back()} 
                    className="btn"
                    style={{ background: 'transparent', border: '2px solid #d4af37', color: '#d4af37' }}
                  >
                    <i className="bi bi-x-circle me-2"></i>Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    <i className="bi bi-check-circle me-2"></i>Add Transaction
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