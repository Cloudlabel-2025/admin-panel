"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditPurchaseInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    vendor: "",
    dueDate: "",
    status: "Pending",
    items: [{ description: "", quantity: 1, price: 0 }]
  });

  useEffect(() => {
    fetchVendors();
    fetchInvoice();
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

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/purchasing/purchase-invoices/${params.id}`);
      const data = await response.json();
      setFormData({
        invoiceNumber: data.invoiceNumber || "",
        vendor: data.vendor || "",
        dueDate: data.dueDate?.split('T')[0] || "",
        status: data.status || "Pending",
        items: data.items || [{ description: "", quantity: 1, price: 0 }]
      });
    } catch (error) {
      console.error("Error fetching purchase invoice:", error);
    }
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    setFormData({ ...formData, items });
  };

  const totalAmount = (formData.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/purchasing/purchase-invoices/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, totalAmount })
      });
      if (response.ok) {
        router.push("/accounting/purchasing/purchase-invoices");
      }
    } catch (error) {
      console.error("Error updating purchase invoice:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>✏️ Edit Purchase Invoice</h1>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Invoice Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.invoiceNumber || ""}
                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Vendor</label>
              <select
                className="form-control"
                value={formData.vendor || ""}
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
          <label className="form-label">Due Date</label>
          <input
            type="date"
            className="form-control"
            value={formData.dueDate || ""}
            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Items</label>
          {formData.items.map((item, index) => (
            <div key={index} className="row mb-2">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  value={item.description || ""}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Qty"
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="col-md-3">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Price"
                  value={item.price || ''}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div className="col-md-2">
                <span className="form-control-plaintext">₹{(item.quantity || 0) * (item.price || 0)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3">
          <label className="form-label">Status</label>
          <select
            className="form-control"
            value={formData.status || "Pending"}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="mb-3">
          <strong>Total Amount: ₹{totalAmount}</strong>
        </div>

        <button type="submit" className="btn btn-primary">Update</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}