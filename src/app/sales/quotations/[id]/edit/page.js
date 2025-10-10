"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const [formData, setFormData] = useState({
    quoteNumber: "",
    customerName: "",
    validUntil: "",
    status: "Draft",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: ""
  });

  useEffect(() => {
    // Since there's no quotations API yet, we'll use placeholder data
    setFormData({
      quoteNumber: "QUO-001",
      customerName: "Sample Customer",
      validUntil: "2024-12-31",
      status: "Draft",
      items: [{ description: "Sample Item", quantity: 1, price: 100 }],
      notes: "Sample notes"
    });
  }, []);

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    setFormData({ ...formData, items });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Since there's no quotations API yet, we'll just redirect
    alert("Quotation functionality will be available once the API is implemented");
    router.push("/sales/quotations");
  };

  return (
    <div className="container mt-4">
      <h1>✏️ Edit Quotation</h1>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Quote Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.quoteNumber}
                onChange={(e) => setFormData({...formData, quoteNumber: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Valid Until</label>
          <input
            type="date"
            className="form-control"
            value={formData.validUntil}
            onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
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
            </div>
          ))}
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
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="mb-3">
          <strong>Total Amount: ${totalAmount}</strong>
        </div>

        <div className="mb-3">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <button type="submit" className="btn btn-primary">Update</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}