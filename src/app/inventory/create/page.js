"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";
import SuccessMessage from "@/app/components/SuccessMessage";

export default function CreateItem() {
  const router = useRouter();
  const [form, setForm] = useState({
    itemName: "",
    category: "",
    quantity: "",
    price: "",
    supplier: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});



  const validateForm = () => {
    const newErrors = {};
    
    if (!form.itemName.trim()) newErrors.itemName = 'Item name is required';
    else if (form.itemName.length > 15) newErrors.itemName = 'Item name must be max 15 characters';
    else if ((form.itemName.match(/\d/g) || []).length > 6) newErrors.itemName = 'Max 6 numbers allowed';
    else if ((form.itemName.match(/[^a-zA-Z0-9\s]/g) || []).length > 3) newErrors.itemName = 'Max 3 special characters allowed';
    if (!form.category) newErrors.category = 'Category is required';
    if (!form.quantity || form.quantity < 0) newErrors.quantity = 'Valid quantity is required';
    if (!form.price || form.price <= 0) newErrors.price = 'Valid price is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSuccessMessage('Please fix the errors in the form');
      setShowSuccess(true);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(form.quantity),
          price: parseFloat(form.price)
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(`Successfully created ${result.count} items with unique asset IDs!`);
        setShowSuccess(true);
        setTimeout(() => router.push("/inventory"), 1500);
      } else {
        const error = await response.json();
        setSuccessMessage(`Error: ${error.details || error.error}`);
        setShowSuccess(true);
      }
    } catch (error) {
      setSuccessMessage('Failed to create item. Please try again.');
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '60px', height: '60px', background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)'}}>
                  <i className="bi bi-plus-circle-fill" style={{fontSize: '28px', color: '#1a1a1a'}}></i>
                </div>
              </div>
              <div>
                <h2 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-box-seam me-2"></i>Add New Inventory Item
                </h2>
                <small style={{ color: '#f4e5c3' }}>Create a new asset entry in your inventory system</small>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
              <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="mb-4">
                  <h5 className="mb-3 pb-2" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}>
                    <i className="bi bi-info-circle-fill me-2"></i>Basic Information
                  </h5>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-bold">Item Name *</label>
                      <input
                        type="text"
                        className={`form-control form-control-lg ${errors.itemName ? 'is-invalid' : ''}`}
                        placeholder="Enter item name (e.g., Dell Latitude 5520, HP LaserJet Pro)"
                        required
                        value={form.itemName}
                        onChange={(e) => {
                          setForm({ ...form, itemName: e.target.value });
                          if (errors.itemName) setErrors({...errors, itemName: ''});
                        }}
                      />
                      {errors.itemName && <div className="invalid-feedback">{errors.itemName}</div>}
                      <small className="text-muted">Unique asset IDs will be auto-generated for each quantity</small>
                    </div>
                  </div>
                </div>

                {/* Category & Stock */}
                <div className="mb-4">
                  <h5 className="mb-3 pb-2" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}>
                    <i className="bi bi-box-seam-fill me-2"></i>Category & Stock
                  </h5>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Category *</label>
                      <select
                        className={`form-select form-select-lg ${errors.category ? 'is-invalid' : ''}`}
                        value={form.category}
                        onChange={(e) => {
                          setForm({ ...form, category: e.target.value });
                          if (errors.category) setErrors({...errors, category: ''});
                        }}
                        required
                      >
                        <option value="">Choose category...</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Desktop">Desktop</option>
                        <option value="Monitor">Monitor</option>
                        <option value="Keyboard">Keyboard</option>
                        <option value="Mouse">Mouse</option>
                        <option value="Headset">Headset</option>
                        <option value="Webcam">Webcam</option>
                        <option value="Printer">Printer</option>
                        <option value="Scanner">Scanner</option>
                        <option value="Router">Router</option>
                        <option value="Switch">Switch</option>
                        <option value="Server">Server</option>
                        <option value="UPS">UPS</option>
                        <option value="Projector">Projector</option>
                        <option value="Chair">Chair</option>
                        <option value="Desk">Desk</option>
                        <option value="Cabinet">Cabinet</option>
                        <option value="Software License">Software License</option>
                        <option value="Mobile Device">Mobile Device</option>
                        <option value="Tablet">Tablet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Quantity *</label>
                      <input
                        type="number"
                        className={`form-control form-control-lg ${errors.quantity ? 'is-invalid' : ''}`}
                        placeholder="0"
                        min="0"
                        required
                        value={form.quantity}
                        onChange={(e) => {
                          setForm({ ...form, quantity: e.target.value });
                          if (errors.quantity) setErrors({...errors, quantity: ''});
                        }}
                      />
                      {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-bold">Price (₹) *</label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text">₹</span>
                        <input
                          type="number"
                          className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                          value={form.price}
                          onChange={(e) => {
                            setForm({ ...form, price: e.target.value });
                            if (errors.price) setErrors({...errors, price: ''});
                          }}
                        />
                      </div>
                      {errors.price && <div className="invalid-feedback d-block">{errors.price}</div>}
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="mb-4">
                  <h5 className="mb-3 pb-2" style={{ color: '#d4af37', borderBottom: '2px solid #d4af37' }}>
                    <i className="bi bi-building-fill me-2"></i>Supplier
                  </h5>
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label fw-bold">Supplier</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        placeholder="Enter supplier name"
                        value={form.supplier}
                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-flex gap-3 pt-3" style={{ borderTop: '2px solid #d4af37' }}>
                  <button type="submit" className="btn btn-lg px-4" disabled={loading} style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-2"></i>Save Item
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-lg px-4"
                    onClick={() => router.push('/inventory')}
                    style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent', fontWeight: '600' }}
                  >
                    <i className="bi bi-x-circle-fill me-2"></i>Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
