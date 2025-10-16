"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    status: ""
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets");
      const data = await response.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (id) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await fetch(`/api/assets/${id}`, { method: "DELETE" });
        fetchAssets();
      } catch (error) {
        console.error("Error deleting asset:", error);
      }
    }
  };

  const filteredAssets = assets.filter(asset => {
    return (!filters.category || asset.category.toLowerCase().includes(filters.category.toLowerCase())) &&
           (!filters.location || asset.location.toLowerCase().includes(filters.location.toLowerCase())) &&
           (!filters.status || asset.status === filters.status);
  });

  const totalOriginalValue = filteredAssets.reduce((sum, asset) => sum + (asset.originalValue || 0), 0);

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>🏢 Asset Register</h2>
          <div>
            <Link href="/accounting/assets/create" className="btn btn-primary">
              ➕ Add Asset
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4>₹{totalOriginalValue.toFixed(2)}</h4>
                <p>Total Asset Value</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h4>{filteredAssets.filter(a => a.status === 'active').length}</h4>
                <p>Active Assets</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h4>{filteredAssets.length}</h4>
                <p>Total Assets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Filter by location"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="disposed">Disposed</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setFilters({category: "", location: "", status: ""})}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="card">
          <div className="card-header">
            <h5>Asset Details</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Purchase Date</th>
                    <th>Original Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset._id}>
                      <td><strong>{asset.name}</strong></td>
                      <td><span className="badge bg-secondary">{asset.category}</span></td>
                      <td>{asset.location}</td>
                      <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                      <td>₹{asset.originalValue?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          asset.status === 'active' ? 'bg-success' : 
                          asset.status === 'disposed' ? 'bg-danger' : 'bg-warning'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td>
                        <Link href={`/accounting/assets/${asset._id}/edit`} className="btn btn-sm btn-outline-primary me-1">✏️ Edit</Link>
                        {userRole === "developer" && (
                          <button onClick={() => deleteAsset(asset._id)} className="btn btn-sm btn-outline-danger">🗑️ Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}