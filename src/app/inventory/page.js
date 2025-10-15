"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter((item) =>
        item.assetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    const updatedItems = items.filter((i) => i._id !== id);
    setItems(updatedItems);
    setFilteredItems(updatedItems.filter((item) =>
      !searchTerm || 
      item.assetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        {/* Header Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="bg-white rounded-3 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div>
                  <h2 className="text-primary mb-1">📦 Inventory Management</h2>
                  <p className="text-muted mb-0">Manage your assets and inventory items</p>
                </div>
                <Link href="/inventory/create" className="btn btn-primary btn-lg">
                  <i className="me-2">➕</i> Add New Item
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Stats Section */}
        <div className="row mb-4">
          <div className="col-lg-8">
            <div className="bg-white rounded-3 shadow-sm p-3">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-0">
                  <i className="text-primary">🔍</i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-light"
                  placeholder="Search by Asset ID, Item Name, Assigned To, Supplier, or Category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setSearchTerm("")}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bg-white rounded-3 shadow-sm p-3 text-center">
              <h5 className="text-primary mb-1">{filteredItems.length}</h5>
              <small className="text-muted">Total Items {searchTerm && `(filtered)`}</small>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="row">
          <div className="col-12">
            <div className="bg-white rounded-3 shadow-sm overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="border-0 py-3">Asset ID</th>
                      <th className="border-0 py-3">Item Details</th>
                      <th className="border-0 py-3">Category</th>
                      <th className="border-0 py-3">Stock</th>
                      <th className="border-0 py-3">Price</th>
                      <th className="border-0 py-3">Status</th>
                      <th className="border-0 py-3">Assignment</th>
                      <th className="border-0 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="text-muted">
                            <div className="mb-3" style={{fontSize: '3rem'}}>📦</div>
                            <h5>{searchTerm ? `No items found matching "${searchTerm}"` : "No inventory items found"}</h5>
                            <p>Start by adding your first inventory item</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item._id} className="align-middle">
                          <td className="py-3">
                            <span className="badge bg-light text-dark border">{item.assetId}</span>
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="fw-bold text-dark">{item.itemName}</div>
                              <small className="text-muted">SKU: {item.sku}</small>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-info text-white">{item.category || "—"}</span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${item.quantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                              {item.quantity} units
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="fw-bold text-success">₹{item.price?.toLocaleString()}</span>
                          </td>
                          <td className="py-3">
                            <span className={`badge ${
                              item.status === 'Available' ? 'bg-success' :
                              item.status === 'Assigned' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <div>
                              <div className="fw-bold text-dark">{item.assignedTo?.name || "Unassigned"}</div>
                              {item.supplier && <small className="text-muted">Supplier: {item.supplier}</small>}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="btn-group" role="group">
                              <Link
                                href={`/inventory/${item._id}/edit`}
                                className="btn btn-sm btn-outline-primary"
                                title="Edit"
                              >
                                ✏️
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(item._id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
