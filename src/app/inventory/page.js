"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function InventoryList() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupCategories, setSetupCategories] = useState([]);
  const [setups, setSetups] = useState([]);
  const [showSetupsModal, setShowSetupsModal] = useState(false);
  const [selectedSetupUser, setSelectedSetupUser] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    fetch("/api/User")
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setUsers([]));
    
    fetch("/api/setup")
      .then((res) => res.json())
      .then(setSetups)
      .catch(() => setSetups([]));
    
    fetch("/api/inventory")
      .then((res) => res.json())
      .then((data) => {
        const itemsArray = Array.isArray(data) ? data : [];
        setItems(itemsArray);
        setFilteredItems(itemsArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setItems([]);
        setFilteredItems([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...items];
    
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.assetId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCategory) {
      filtered = filtered.filter(item => item.category === filterCategory);
    }
    
    if (filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    // Group by itemName and category
    const grouped = {};
    filtered.forEach(item => {
      const key = `${item.itemName}-${item.category}`;
      if (!grouped[key]) {
        grouped[key] = {
          itemName: item.itemName,
          category: item.category,
          price: item.price,
          items: []
        };
      }
      grouped[key].items.push(item);
    });
    
    setFilteredItems(Object.values(grouped));
  }, [searchTerm, items, filterCategory, filterStatus, sortBy, sortOrder]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i._id !== id));
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    const res = await fetch("/api/inventory/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assetId: selectedItem.assetId,
        userId: selectedUser,
        assignedBy: localStorage.getItem("userName") || "Admin"
      })
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map(i => i._id === updated._id ? updated : i));
      setShowAssignModal(false);
      setSelectedUser("");
      setShowDetailsModal(false);
    }
  };

  const handleUnassign = async (item) => {
    if (!confirm("Unassign this item?")) return;
    const res = await fetch("/api/inventory/unassign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId: item.assetId })
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map(i => i._id === updated._id ? updated : i));
    }
  };

  const handleCreateSetup = async () => {
    if (!setupName || setupCategories.length === 0) return;
    
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setupName, categories: setupCategories })
    });
    
    if (res.ok) {
      setShowSetupModal(false);
      setSetupName("");
      setSetupCategories([]);
      fetch("/api/setup").then(res => res.json()).then(setSetups);
    } else {
      const error = await res.json();
      alert(error.error);
    }
  };

  const handleAssignSetup = async (setupId) => {
    if (!selectedSetupUser) return;
    const res = await fetch("/api/setup/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupId,
        userId: selectedSetupUser,
        assignedBy: localStorage.getItem("userName") || "Admin"
      })
    });
    if (res.ok) {
      const result = await res.json();
      alert(`Setup assigned! Items: ${result.assignedItems.map(i => i.assetId).join(', ')}`);
      fetch("/api/inventory").then(res => res.json()).then(data => setItems(Array.isArray(data) ? data : []));
      setSelectedSetupUser("");
      setShowSetupsModal(false);
    } else {
      const error = await res.json();
      alert(error.error);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-4">
        {/* Header Section */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h2 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-box-seam-fill me-2"></i>Inventory Management
                </h2>
                <small style={{ color: '#f4e5c3' }}>Manage your assets and inventory items</small>
              </div>
              <div className="d-flex gap-2">
                <Link href="/inventory/create" className="btn btn-lg" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>
                  <i className="bi bi-plus-circle-fill me-2"></i>Add Item
                </Link>
                <button className="btn btn-lg" onClick={() => setShowSetupModal(true)} style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #5bc0de 100%)', border: 'none', color: 'white', fontWeight: '600' }}>
                  <i className="bi bi-boxes me-2"></i>Create Setup
                </button>
                <button className="btn btn-lg" onClick={() => setShowSetupsModal(true)} style={{ background: 'linear-gradient(135deg, #6c757d 0%, #adb5bd 100%)', border: 'none', color: 'white', fontWeight: '600' }}>
                  <i className="bi bi-list-ul me-2"></i>Setups ({setups.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters Section */}
        <div className="row mb-4">
          <div className="col-12 mb-3">
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-lg-6">
                    <div className="input-group input-group-lg">
                      <span className="input-group-text" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', border: 'none', color: '#d4af37' }}>
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by Asset ID, Item Name, Assigned To, Supplier, or Category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: '2px solid #d4af37', borderLeft: 'none' }}
                      />
                      {searchTerm && (
                        <button
                          className="btn"
                          onClick={() => setSearchTerm("")}
                          title="Clear search"
                          style={{ border: '2px solid #d4af37', borderLeft: 'none', color: '#d4af37' }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-lg-2 col-md-4">
                    <select className="form-select form-select-lg" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ border: '2px solid #d4af37' }}>
                      <option value="">All Categories</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Monitor">Monitor</option>
                      <option value="Printer">Printer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-4">
                    <select className="form-select form-select-lg" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ border: '2px solid #d4af37' }}>
                      <option value="">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                  <div className="col-lg-2 col-md-4">
                    <select className="form-select form-select-lg" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ border: '2px solid #d4af37' }}>
                      <option value="createdAt">Sort by Date</option>
                      <option value="itemName">Sort by Name</option>
                      <option value="price">Sort by Price</option>
                      <option value="quantity">Sort by Stock</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 mb-3">
            <div className="card shadow-sm text-center" style={{ border: '2px solid #d4af37', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
              <div className="card-body p-3">
                <h4 className="mb-1" style={{ color: '#d4af37' }}>{items.length}</h4>
                <small style={{ color: '#f4e5c3' }}>Total Units</small>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 mb-3">
            <div className="card shadow-sm text-center" style={{ border: '2px solid #28a745', background: 'linear-gradient(135deg, #1a5f1a 0%, #0d3d0d 100%)' }}>
              <div className="card-body p-3">
                <h4 className="mb-1" style={{ color: '#28a745' }}>{items.filter(i => i.status === 'Available').length}</h4>
                <small style={{ color: '#90ee90' }}>Available</small>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6 mb-3">
            <div className="card shadow-sm text-center" style={{ border: '2px solid #ffc107', background: 'linear-gradient(135deg, #8b7500 0%, #5c4d00 100%)' }}>
              <div className="card-body p-3">
                <h4 className="mb-1" style={{ color: '#ffc107' }}>{items.filter(i => i.status === 'Assigned').length}</h4>
                <small style={{ color: '#ffe066' }}>Assigned</small>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
                    <tr>
                      <th className="py-3" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}><i className="bi bi-box me-2"></i>Item Name</th>
                      <th className="py-3" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}><i className="bi bi-tag me-2"></i>Category</th>
                      <th className="py-3" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}><i className="bi bi-boxes me-2"></i>Available</th>
                      <th className="py-3" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}><i className="bi bi-boxes me-2"></i>Total Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5">
                          <div className="text-muted">
                            <i className="bi bi-box-seam" style={{fontSize: '3rem', color: '#d4af37', opacity: 0.3}}></i>
                            <h5 className="mt-3">{searchTerm ? `No items found` : "No inventory items"}</h5>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((group, idx) => {
                        const available = group.items?.filter(i => i.status === 'Available').length || 0;
                        const total = group.items?.length || 0;
                        return (
                          <tr key={idx} className="align-middle" style={{cursor: 'pointer'}} onClick={() => { setSelectedGroup(group); setShowDetailsModal(true); }}>
                            <td className="py-3">
                              <div className="fw-bold text-dark">{group.itemName}</div>
                            </td>
                            <td className="py-3">
                              <span className="badge bg-info text-white">{group.category}</span>
                            </td>
                            <td className="py-3">
                              <span className={`badge ${available > 0 ? 'bg-success' : 'bg-danger'}`}>{available}</span>
                            </td>
                            <td className="py-3">
                              <span className="badge bg-secondary">{total}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: '2px solid #d4af37' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="modal-title" style={{ color: '#d4af37' }}>
                    <i className="bi bi-person-plus-fill me-2"></i>Assign Item
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowAssignModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Asset ID</label>
                    <input type="text" className="form-control" value={selectedItem?.assetId} disabled />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Assign To *</label>
                    <select className="form-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                      <option value="">Select user...</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '2px solid #d4af37' }}>
                  <button className="btn" onClick={() => setShowAssignModal(false)} style={{ border: '2px solid #d4af37', color: '#d4af37' }}>Cancel</button>
                  <button className="btn" onClick={handleAssign} disabled={!selectedUser} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>Assign</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Setup Modal */}
        {showSetupModal && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ border: '2px solid #d4af37' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="modal-title" style={{ color: '#d4af37' }}>
                    <i className="bi bi-boxes me-2"></i>Create Setup Bundle
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => { setShowSetupModal(false); setSetupName(""); setSetupCategories([]); }}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Setup Name *</label>
                    <input type="text" className="form-control" placeholder="e.g., Welcome Kit" value={setupName} onChange={(e) => setSetupName(e.target.value)} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Categories (1 item per category will be assigned)</label>
                    <div className="row g-2">
                      {['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Printer', 'Chair', 'Desk'].map(cat => (
                        <div key={cat} className="col-md-4">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={setupCategories.includes(cat)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSetupCategories([...setupCategories, cat]);
                                } else {
                                  setSetupCategories(setupCategories.filter(c => c !== cat));
                                }
                              }}
                            />
                            <label className="form-check-label">{cat}</label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '2px solid #d4af37' }}>
                  <button className="btn" onClick={() => { setShowSetupModal(false); setSetupName(""); setSetupCategories([]); }} style={{ border: '2px solid #d4af37', color: '#d4af37' }}>Cancel</button>
                  <button className="btn" onClick={handleCreateSetup} disabled={!setupName || setupCategories.length === 0} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}>Create Setup</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Setups Modal */}
        {showSetupsModal && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content" style={{ border: '2px solid #d4af37' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="modal-title" style={{ color: '#d4af37' }}>
                    <i className="bi bi-list-ul me-2"></i>Setup Bundles
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowSetupsModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Setup ID</th>
                          <th>Setup Name</th>
                          <th>Items</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {setups.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-4">No setups created yet</td></tr>
                        ) : (
                          setups.map(setup => (
                            <tr key={setup._id}>
                              <td><span className="badge bg-light text-dark">{setup.setupId}</span></td>
                              <td>
                                <div className="fw-bold">{setup.setupName}</div>
                                <small className="text-muted">{setup.categories?.join(', ')}</small>
                              </td>
                              <td><span className="badge bg-info">{setup.categories?.length || 0} categories</span></td>
                              <td><span className="badge bg-success">Template</span></td>
                              <td>—</td>
                              <td>
                                <div className="d-flex gap-2">
                                  <select className="form-select form-select-sm" value={selectedSetupUser} onChange={(e) => setSelectedSetupUser(e.target.value)} style={{ width: '150px' }}>
                                    <option value="">Select user...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                  </select>
                                  <button className="btn btn-sm btn-success" onClick={() => handleAssignSetup(setup.setupId)} disabled={!selectedSetupUser}>
                                    <i className="bi bi-check"></i> Assign
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
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedGroup && (
          <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ border: '2px solid #d4af37' }}>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
                  <h5 className="modal-title" style={{ color: '#d4af37' }}>
                    <i className="bi bi-box-seam me-2"></i>{selectedGroup.itemName} - {selectedGroup.category}
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowDetailsModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Asset ID</th>
                          <th>Status</th>
                          <th>Assigned To</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGroup.items?.map(item => (
                          <tr key={item._id}>
                            <td><span className="badge bg-light text-dark">{item.assetId}</span></td>
                            <td><span className={`badge ${item.status === 'Available' ? 'bg-success' : 'bg-warning'}`}>{item.status}</span></td>
                            <td>{item.assignedTo?.length > 0 ? users.find(u => u._id === item.assignedTo[0].userId)?.name || 'Unknown' : '—'}</td>
                            <td>
                              {item.status === 'Available' && (
                                <button className="btn btn-sm btn-success me-1" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setShowAssignModal(true); }}>
                                  <i className="bi bi-person-plus"></i>
                                </button>
                              )}
                              {item.status === 'Assigned' && (
                                <button className="btn btn-sm btn-secondary me-1" onClick={(e) => { e.stopPropagation(); handleUnassign(item); }}>
                                  <i className="bi bi-person-dash"></i>
                                </button>
                              )}
                              {userRole === "developer" && (
                                <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(item._id); setShowDetailsModal(false); }}>
                                  <i className="bi bi-trash"></i>
                                </button>
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
          </div>
        )}
      </div>
    </Layout>
  );
}
