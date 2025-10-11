"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditSalesOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    customer: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    status: "Draft"
  });

  useEffect(() => {
    fetchCustomers();
    fetchOrder();
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

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/sales/orders/${params.id}`);
      const data = await response.json();
      setFormData({
        customer: data.customer._id,
        items: data.items,
        status: data.status
      });
    } catch (error) {
      console.error("Error fetching order:", error);
    }
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
      const response = await fetch(`/api/sales/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, totalAmount })
      });
      if (response.ok) {
        router.push("/sales/orders");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>✏️ Edit Sales Order</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Customer</label>
          <select
            className="form-control"
            value={formData.customer}
            onChange={(e) => setFormData({...formData, customer: e.target.value})}
            required
          >
            <option value="">Select Customer</option>
            {customers.map(customer => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
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
            <option value="Confirmed">Confirmed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="mb-3">
          <strong>Total Amount: ${totalAmount}</strong>
        </div>

        <button type="submit" className="btn btn-primary">Update</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}