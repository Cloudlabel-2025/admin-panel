"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../components/Layout";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [invoiceItems, setInvoiceItems] = useState([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [invoicesRes, clientsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/clients")
      ]);
      const invoicesData = await invoicesRes.json();
      const clientsData = await clientsRes.json();
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateItemAmount = (index, field, value) => {
    const newItems = [...invoiceItems];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    setInvoiceItems(newItems);
  };

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const createInvoice = async () => {
    if (!selectedClient || invoiceItems.length === 0) return;

    // Validate items
    const validItems = invoiceItems.filter(item => 
      item.description && item.description.trim() && 
      item.quantity > 0 && 
      item.rate >= 0
    );

    if (validItems.length === 0) {
      alert("Please add at least one valid item with description, quantity, and rate.");
      return;
    }

    const subtotal = calculateTotal();
    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + tax;

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient,
          dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          items: validItems,
          subtotal,
          tax,
          total,
          notes,
          createdBy: localStorage.getItem("userEmail")
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        fetchData();
        // Reset form
        setSelectedClient("");
        setInvoiceItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
        setNotes("");
        setDueDate("");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const generatePDF = async (invoiceId) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (loading) return (
    <Layout>
      <div className="d-flex justify-content-center align-items-center" style={{height: "50vh"}}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1"><i className="bi bi-receipt me-2"></i>Invoice Management</h2>
            <p className="text-muted mb-0">Create and manage invoices for clients</p>
          </div>
          <div>
            <Link href="/invoices/company" className="btn btn-outline-secondary me-2">
              <i className="bi bi-building me-2"></i>Company Settings
            </Link>
            <Link href="/invoices/clients" className="btn btn-outline-primary me-2">
              <i className="bi bi-people me-2"></i>Manage Clients
            </Link>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <i className="bi bi-plus-circle me-2"></i>Create Invoice
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0">
            <h6 className="mb-0"><i className="bi bi-table me-2"></i>Invoices ({invoices.length})</h6>
          </div>
          <div className="card-body p-0">
            {invoices.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-receipt" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                <h5 className="text-muted mt-3">No invoices found</h5>
                <p className="text-muted">Create your first invoice to get started</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>Create Invoice
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold">Invoice #</th>
                      <th className="border-0 fw-semibold">Client</th>
                      <th className="border-0 fw-semibold">Amount</th>
                      <th className="border-0 fw-semibold">Status</th>
                      <th className="border-0 fw-semibold">Due Date</th>
                      <th className="border-0 fw-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice._id} className="align-middle">
                        <td><strong>{invoice.invoiceNumber}</strong></td>
                        <td>{invoice.clientId?.name || 'N/A'}</td>
                        <td><strong>₹{invoice.total.toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge bg-${invoice.status === 'Paid' ? 'success' : invoice.status === 'Sent' ? 'info' : invoice.status === 'Overdue' ? 'danger' : 'secondary'}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => generatePDF(invoice._id)}
                          >
                            <i className="bi bi-file-pdf"></i> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Invoice Modal */}
        {showCreateModal && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create New Invoice</h5>
                  <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Select Client</label>
                      <select 
                        className="form-select" 
                        value={selectedClient} 
                        onChange={(e) => setSelectedClient(e.target.value)}
                      >
                        <option value="">Choose client...</option>
                        {clients.map(client => (
                          <option key={client._id} value={client._id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Due Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <h6>Invoice Items</h6>
                  {invoiceItems.map((item, index) => (
                    <div key={index} className="row mb-2">
                      <div className="col-md-4">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Description *"
                          value={item.description}
                          onChange={(e) => updateItemAmount(index, 'description', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItemAmount(index, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-md-2">
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateItemAmount(index, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-md-2">
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="Amount"
                          value={item.amount}
                          readOnly
                        />
                      </div>
                      <div className="col-md-2">
                        <button className="btn btn-outline-danger btn-sm" onClick={() => removeItem(index)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button className="btn btn-outline-primary btn-sm mb-3" onClick={addItem}>
                    <i className="bi bi-plus"></i> Add Item
                  </button>

                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Notes</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between">
                            <span>Subtotal:</span>
                            <span>₹{calculateTotal().toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Tax (18%):</span>
                            <span>₹{(calculateTotal() * 0.18).toLocaleString()}</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>Total:</span>
                            <span>₹{(calculateTotal() * 1.18).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={createInvoice}>Create Invoice</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}