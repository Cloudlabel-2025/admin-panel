"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function CreateItem() {
  const router = useRouter();
  const [form, setForm] = useState({
    itemName: "",
    sku: "",
    category: "",
    quantity: "",
    price: "",
    supplier: "",
    assignedTo: "",
    status: "Available",
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users for "assignedTo"
    fetch("/api/User")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (response.ok) {
        router.push("/inventory");
      } else {
        const error = await response.json();
        alert(`Error: ${error.details || error.error}`);
      }
    } catch (error) {
      alert('Failed to create item. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex align-items-center">
                <div className="me-3">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                    <span className="text-white fs-4">➕</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-primary mb-1">Add New Inventory Item</h2>
                  <p className="text-muted mb-0">Create a new asset entry in your inventory system</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="row">
          <div className="col-12">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-2">📝 Basic Information</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Item Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter item name"
                        required
                        value={form.itemName}
                        onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Stock Keeping Unit (SKU) *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter SKU code"
                        required
                        value={form.sku}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Stock */}
                <div className="mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-2">📦 Category & Stock</h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Category *</label>
                      <select
                        className="form-select form-select-lg"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Choose category...</option>
                        <option value="hardware">💻 Hardware</option>
                        <option value="software">💿 Software</option>
                        <option value="cleaning equipments">🧹 Cleaning Equipment</option>
                        <option value="furniture">🪑 Furniture</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Quantity *</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        placeholder="0"
                        min="0"
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Price (₹) *</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supplier & Status */}
                <div className="mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-2">🏢 Supplier & Status</h5>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Supplier</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter supplier name"
                        value={form.supplier}
                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Status</label>
                      <select
                        className="form-select form-select-lg"
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                      >
                        <option value="Available">✅ Available</option>
                        <option value="Assigned">📄 Assigned</option>
                        <option value="Out of Stock">❌ Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assignment */}
                <div className="mb-4">
                  <h5 className="text-primary mb-3 border-bottom pb-2">👥 Assignment</h5>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-bold">Assign To</label>
                      <select
                        className="form-select form-select-lg"
                        value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      >
                        <option value="">Select user (optional)...</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-3 pt-3 border-top">
                  <button type="submit" className="btn btn-primary btn-lg px-4">
                    <i className="me-2">✅</i> Save Item
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-lg px-4"
                    onClick={() => router.push('/inventory')}
                  >
                    <i className="me-2">❌</i> Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
