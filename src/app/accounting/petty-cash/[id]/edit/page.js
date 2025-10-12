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
      <div className="container mt-4">
        <h2>✏️ Edit Petty Cash Entry</h2>
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

          <div className="mb-3">
            <label className="form-label">Handled By</label>
            <input
              type="text"
              className="form-control"
              value={formData.handledBy}
              onChange={(e) => setFormData({...formData, handledBy: e.target.value})}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>

          <button type="submit" className="btn btn-primary">Update Entry</button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
        </form>
      </div>
    </Layout>
  );
}