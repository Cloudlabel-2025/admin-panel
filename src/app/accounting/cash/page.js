"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function CashPage() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin") {
      router.push("/");
      return;
    }
  }, [router]);
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cash?type=${type}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCredits = transactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);

  return (
    <Layout>
      <div className="container-fluid">
        <h2>💵 Cash Management</h2>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <Link href="/cash/credits" className="btn btn-success me-2">
            ➕ Add Credit
          </Link>
          <Link href="/cash/debits" className="btn btn-danger">
            ➖ Add Debit
          </Link>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">&nbsp;</label>
          <div>
            <button onClick={() => fetchTransactions('Credit')} className="btn btn-success me-2">
              View Credits
            </button>
            <button onClick={() => fetchTransactions('Debit')} className="btn btn-danger">
              View Debits
            </button>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5>Total Credits</h5>
              <h3>₹{totalCredits.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h5>Total Debits</h5>
              <h3>₹{totalDebits.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5>Net Cash Flow</h5>
              <h3>₹{(totalCredits - totalDebits).toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>From Account</th>
                <th>To Account</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                  <td>{transaction.fromAccount?.name || "N/A"}</td>
                  <td>{transaction.toAccount?.name || "N/A"}</td>
                  <td>
                    <span className={`badge ${transaction.type === 'Credit' ? 'bg-success' : 'bg-danger'}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td><strong>₹{parseFloat(transaction.amount || 0).toFixed(2)}</strong></td>
                  <td>{transaction.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </Layout>
  );
}