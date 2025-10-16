"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuccessMessage from "../../../../components/SuccessMessage";

export default function CreateQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    quoteNumber: "",
    customerName: "",
    validUntil: "",
    status: "Draft",
    items: [{ description: "", quantity: 1, price: 0 }],
    notes: ""
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchCustomers();
    generateQuoteNumber();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/sales/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const generateQuoteNumber = () => {
    const quoteNumber = `QUO-${Date.now()}`;
    setFormData(prev => ({ ...prev, quoteNumber }));
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
    // Since there's no quotations API yet, we'll just redirect
    setSuccessMessage("Quotation functionality will be available once the API is implemented");
    setShowSuccess(true);
    setTimeout(() => router.push("/sales/quotations"), 2000);
  };

  return (
    <>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container mt-4">
      <h1>➕ Create Quotation</h1>
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

        <button type="submit" className="btn btn-primary">Create</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
    </>
  );
}