"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin") {
      router.push("/");
      return;
    }
    fetchTransactions();
  }, [router]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>📜 Transaction History</h2>
          <Link href="/transactions/create" className="btn btn-primary">
            ➕ Create Transaction
          </Link>
        </div>

        <div className="card">
          <div className="card-body">
            {transactions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No transactions found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>From Account</th>
                      <th>To Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                        <td>{transaction.fromAccount?.name || "N/A"}</td>
                        <td>{transaction.toAccount?.name || "N/A"}</td>
                        <td><span className="badge bg-secondary">{transaction.type}</span></td>
                        <td><strong>₹{parseFloat(transaction.amount || 0).toFixed(2)}</strong></td>
                        <td>{transaction.description}</td>
                        <td>
                          <Link href={`/transactions/${transaction._id}/edit`} className="btn btn-sm btn-outline-primary">
                            ✏️ Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}