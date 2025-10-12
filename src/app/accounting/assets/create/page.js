"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";

export default function CreateAssetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    location: "",
    originalValue: "",
    purchaseDate: "",
    usefulLife: "5",
    salvageValue: "",
    description: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          originalValue: parseFloat(formData.originalValue),
          usefulLife: parseInt(formData.usefulLife),
          salvageValue: parseFloat(formData.salvageValue) || 0
        })
      });
      if (response.ok) {
        router.push("/accounting/assets");
      }
    } catch (error) {
      console.error("Error creating asset:", error);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <h2>➕ Add Asset</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Asset Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Equipment, Furniture, Vehicle"
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Purchase Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Original Value</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.originalValue}
                  onChange={(e) => setFormData({...formData, originalValue: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Useful Life (Years)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.usefulLife}
                  onChange={(e) => setFormData({...formData, usefulLife: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Salvage Value</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.salvageValue}
                  onChange={(e) => setFormData({...formData, salvageValue: e.target.value})}
                  placeholder="0"
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
              rows="3"
            />
          </div>

          <button type="submit" className="btn btn-primary">Add Asset</button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
        </form>
      </div>
    </Layout>
  );
}