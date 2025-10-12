"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function PettyCashPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState(0);
  const [filters, setFilters] = useState({
    date: "",
    category: "",
    handledBy: ""
  });

  const [summary, setSummary] = useState({
    totalCashIn: 0,
    totalCashOut: 0,
    currentBalance: 0
  });

  useEffect(() => {
    fetchEntries();
    fetchAccountBalance();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/petty-cash");
      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
      
      // Calculate summary
      const cashIn = data.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
      const cashOut = data.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
      setSummary({
        totalCashIn: cashIn,
        totalCashOut: cashOut,
        currentBalance: cashIn - cashOut
      });
    } catch (error) {
      console.error("Error fetching petty cash entries:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountBalance = async () => {
    try {
      const response = await fetch("/api/accounts");
      const accounts = await response.json();
      const pettyCashAccount = accounts.find(acc => acc.name === "Petty Cash");
      if (pettyCashAccount) {
        setAccountBalance(pettyCashAccount.balance);
      }
    } catch (error) {
      console.error("Error fetching account balance:", error);
    }
  };

  const deleteEntry = async (id) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      try {
        await fetch(`/api/petty-cash/${id}`, { method: "DELETE" });
        fetchEntries();
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    return (!filters.date || entry.date.includes(filters.date)) &&
           (!filters.category || entry.category.toLowerCase().includes(filters.category.toLowerCase())) &&
           (!filters.handledBy || entry.handledBy.toLowerCase().includes(filters.handledBy.toLowerCase()));
  });

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>💵 Petty Cash Management</h2>
          <Link href="/accounting/petty-cash/create" className="btn btn-primary">
            ➕ Add Entry
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4>₹{accountBalance.toFixed(2)}</h4>
                <p>Account Balance</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h4>₹{summary.totalCashIn.toFixed(2)}</h4>
                <p>Total Cash In</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body text-center">
                <h4>₹{summary.totalCashOut.toFixed(2)}</h4>
                <p>Total Cash Out</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h4>{entries.filter(e => new Date(e.date).toDateString() === new Date().toDateString()).length}</h4>
                <p>Today&apos;s Entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Filter by Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Filter by Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Filter by Handler</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter handler name"
                  value={filters.handledBy}
                  onChange={(e) => setFilters({...filters, handledBy: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card">
          <div className="card-header">
            <h5>Daily Entries</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Handled By</th>
                    <th>Approved By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td>{entry.category}</td>
                      <td>{entry.description}</td>
                      <td>
                        <span className={`badge ${entry.type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                          {entry.type === 'in' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td className={entry.type === 'in' ? 'text-success' : 'text-danger'}>
                        ₹{entry.amount.toFixed(2)}
                      </td>
                      <td>{entry.handledBy}</td>
                      <td>{entry.approvedBy || 'Pending'}</td>
                      <td>
                        <Link href={`/accounting/petty-cash/${entry._id}/edit`} className="btn btn-sm btn-outline-primary me-1">✏️ Edit</Link>
                        <button onClick={() => deleteEntry(entry._id)} className="btn btn-sm btn-outline-danger">🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}