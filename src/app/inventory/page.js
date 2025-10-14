"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function InventoryList() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i._id !== id));
  };

  return (
    <Layout>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Inventory List</h2>
          <Link href="/inventory/create" className="btn btn-primary">
            Add New Item
          </Link>
        </div>

        <table className="table table-striped table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th>Asset ID</th>
              <th>Item Name</th>
              <th>Stock Keeping Unit</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price (₹)</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>{item.assetId}</td>
                  <td>{item.itemName}</td>
                  <td>{item.sku}</td>
                  <td>{item.category || "—"}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>{item.supplier || "—"}</td>
                  <td>{item.status}</td>
                  <td>{item.assignedTo?.name || "—"}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link
                      href={`/inventory/${item._id}/edit`}
                      className="btn btn-sm btn-warning me-2"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
