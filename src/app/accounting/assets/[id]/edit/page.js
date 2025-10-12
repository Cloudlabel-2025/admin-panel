"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "../../../../components/Layout";

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    location: "",
    originalValue: "",
    purchaseDate: "",
    usefulLife: "5",
    salvageValue: "",
    description: "",
    status: "active"
  });

  useEffect(() => {
    fetchAsset();
  }, []);

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${params.id}`);
      const data = await response.json();
      setFormData({
        ...data,
        purchaseDate: new Date(data.purchaseDate).toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error fetching asset:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        method: "PUT",
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
      console.error("Error updating asset:", error);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <h2>✏️ Edit Asset</h2>
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
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="active">Active</option>
              <option value="disposed">Disposed</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
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

          <button type="submit" className="btn btn-primary">Update Asset</button>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
        </form>
      </div>
    </Layout>
  );
}