"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateSalesInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    salesOrderId: "",
    customerName: "",
    dueDate: "",
    status: "Draft",
    paymentStatus: "Unpaid",
    items: [{ description: "", quantity: 1, total: 0 }],
    notes: ""
  });

  useEffect(() => {
    fetchCustomers();
    fetchOrders();
    generateInvoiceNumber();
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

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/sales/orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const generateInvoiceNumber = () => {
    const invoiceNumber = `INV-${Date.now()}`;
    setFormData(prev => ({ ...prev, invoiceNumber }));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, total: 0 }]
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/sales/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        router.push("/sales/invoices");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>➕ Create Sales Invoice</h1>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Invoice Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
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

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Sales Order (Optional)</label>
              <select
                className="form-control"
                value={formData.salesOrderId}
                onChange={(e) => setFormData({...formData, salesOrderId: e.target.value})}
              >
                <option value="">Select Order</option>
                {orders.map(order => (
                  <option key={order._id} value={order._id}>
                    {order.customer?.name} - ${order.totalAmount}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                required
              />
            </div>
          </div>
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
                  placeholder="Total"
                  value={item.total}
                  onChange={(e) => updateItem(index, 'total', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="col-md-2">
                <button type="button" onClick={() => {
                  const items = formData.items.filter((_, i) => i !== index);
                  setFormData({ ...formData, items });
                }} className="btn btn-sm btn-danger">×</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="btn btn-sm btn-secondary">+ Add Item</button>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Payment Status</label>
              <select
                className="form-control"
                value={formData.paymentStatus}
                onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
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
  );
}