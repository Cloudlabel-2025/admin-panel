"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/sales/invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🧾 Sales Invoices</h1>
        <Link href="/sales/invoices/create" className="btn btn-primary">
          ➕ Create Invoice
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Payment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.customerName}</td>
                <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${invoice.status === 'Paid' ? 'bg-success' : invoice.status === 'Sent' ? 'bg-warning' : 'bg-secondary'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <span className={`badge ${invoice.paymentStatus === 'Paid' ? 'bg-success' : invoice.paymentStatus === 'Partial' ? 'bg-warning' : 'bg-danger'}`}>
                    {invoice.paymentStatus}
                  </span>
                </td>
                <td>
                  <Link href={`/sales/invoices/${invoice._id}/edit`} className="btn btn-sm btn-warning">
                    ✏️ Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}