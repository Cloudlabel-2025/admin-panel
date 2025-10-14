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
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/inventory");
  };

  return (
    <Layout>
      <div className="container mt-5">
        <h2 className="mb-4">Add New Inventory Item</h2>
        <form className="card p-4 shadow-sm" onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Stock Keeping Unit</label>
              <input
                type="text"
                className="form-control"
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">— Select Category —</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="cleaning equipments">Cleaning Equipments</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                className="form-control"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                className="form-control"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Supplier</label>
              <input
                type="text"
                className="form-control"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-12">
              <label className="form-label">Assign To</label>
              <select
                className="form-select"
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
              >
                <option value="">— Select User —</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-success mt-3">
            Save Item
          </button>
        </form>
      </div>
    </Layout>
  );
}
