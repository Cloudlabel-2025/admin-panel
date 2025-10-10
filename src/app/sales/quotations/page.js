"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Since there's no quotations API yet, we'll use a placeholder
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📋 Quotations</h1>
        <Link href="/sales/quotations/create" className="btn btn-primary">
          ➕ Create Quotation
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No quotations found</td>
              </tr>
            ) : (
              quotations.map((quotation) => (
                <tr key={quotation._id}>
                  <td>{quotation.quoteNumber}</td>
                  <td>{quotation.customerName}</td>
                  <td>{new Date(quotation.quoteDate).toLocaleDateString()}</td>
                  <td>{new Date(quotation.validUntil).toLocaleDateString()}</td>
                  <td>${quotation.totalAmount}</td>
                  <td>
                    <span className={`badge ${quotation.status === 'Accepted' ? 'bg-success' : quotation.status === 'Sent' ? 'bg-warning' : 'bg-secondary'}`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td>
                    <Link href={`/sales/quotations/${quotation._id}/edit`} className="btn btn-sm btn-warning">
                      ✏️ Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}