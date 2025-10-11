"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    orderNumber: "",
    vendor: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    status: "Draft"
  });

  useEffect(() => {
    fetchVendors();
    generateOrderNumber();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/purchasing/vendors");
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const generateOrderNumber = () => {
    const orderNumber = `PO-${Date.now()}`;
    setFormData(prev => ({ ...prev, orderNumber }));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    setFormData({ ...formData, items });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/purchasing/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, totalAmount })
      });
      if (response.ok) {
        router.push("/purchasing/purchase-orders");
      }
    } catch (error) {
      console.error("Error creating purchase order:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>➕ Create Purchase Order</h1>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Order Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.orderNumber}
                onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Vendor</label>
              <select
                className="form-control"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Items</label>
          {formData.items.map((item, index) => (
            <div key={index} className="row mb-2">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="col-md-2">
                <span className="form-control-plaintext">${item.quantity * item.price}</span>
              </div>
              <div className="col-md-1">
                <button type="button" onClick={() => {
                  const items = formData.items.filter((_, i) => i !== index);
                  setFormData({ ...formData, items });
                }} className="btn btn-sm btn-danger">×</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn btn-sm btn-secondary">+ Add Item</button>
        </div>

        <div className="mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="mb-3">
          <strong>Total Amount: ${totalAmount}</strong>
        </div>

        <button type="submit" className="btn btn-primary">Create</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}