"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/purchasing/purchase-invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching purchase invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🧾 Purchase Invoices</h1>
        <Link href="/purchasing/purchase-invoices/create" className="btn btn-primary">
          ➕ Create Purchase Invoice
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Vendor</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.vendor?.name}</td>
                <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td>${invoice.totalAmount}</td>
                <td>
                  <span className={`badge ${invoice.status === 'Paid' ? 'bg-success' : invoice.status === 'Approved' ? 'bg-warning' : 'bg-secondary'}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>
                  <Link href={`/purchasing/purchase-invoices/${invoice._id}/edit`} className="btn btn-sm btn-warning">
                    ✏️ Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </Layout>
  );
}