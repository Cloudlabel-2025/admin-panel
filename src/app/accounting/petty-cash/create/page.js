"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";

export default function CreatePettyCashPage() {
  const router = useRouter();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      <div className="container mt-4">
        <h2>➕ Add Petty Cash Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-control"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                >
                  <option value="out">Cash Out</option>
                  <option value="in">Cash In</option>
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Office Supplies, Travel, etc."
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Handled By</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.handledBy}
                  onChange={(e) => setFormData({...formData, handledBy: e.target.value})}
                  placeholder="Person responsible"
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Approved By</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.approvedBy}
                  onChange={(e) => setFormData({...formData, approvedBy: e.target.value})}
                  placeholder="Approver name"
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the transaction"
              rows="3"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Receipt Upload (Optional)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setFormData({...formData, receipt: e.target.files[0]})}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          <button type="submit" className="btn btn-primary">Add Entry</button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
        </form>
      </div>
    </Layout>
  );
}