"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function PettyCashPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
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
  const [transactions, setTransactions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
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

  const fetchTransactions = async (type) => {
    try {
      const response = await fetch(`/api/cash?type=${type}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
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
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-cash-coin me-2"></i>Petty Cash Management
                </h1>
                <small style={{ color: '#f4e5c3' }}>Track and manage daily cash transactions</small>
              </div>
              <Link href="/accounting/petty-cash/create" className="btn" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600', boxShadow: '0 2px 8px rgba(212, 175, 55, 0.3)' }}>
                <i className="bi bi-plus-circle-fill me-2"></i>Add Entry
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', backdropFilter: 'blur(10px)', border: '2px solid #d4af37' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-wallet2" style={{ fontSize: '2.5rem', color: '#d4af37', opacity: 0.8 }}></i>
                <h3 className="mt-3" style={{ color: '#d4af37' }}>₹{accountBalance.toFixed(2)}</h3>
                <p className="mb-0" style={{ color: '#f4e5c3' }}>Account Balance</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', backdropFilter: 'blur(10px)', border: '2px solid #28a745' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-arrow-down-circle" style={{ fontSize: '2.5rem', color: '#28a745', opacity: 0.8 }}></i>
                <h3 className="mt-3" style={{ color: '#28a745' }}>₹{summary.totalCashIn.toFixed(2)}</h3>
                <p className="mb-0" style={{ color: '#f4e5c3' }}>Total Cash In</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', backdropFilter: 'blur(10px)', border: '2px solid #dc3545' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-arrow-up-circle" style={{ fontSize: '2.5rem', color: '#dc3545', opacity: 0.8 }}></i>
                <h3 className="mt-3" style={{ color: '#dc3545' }}>₹{summary.totalCashOut.toFixed(2)}</h3>
                <p className="mb-0" style={{ color: '#f4e5c3' }}>Total Cash Out</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)', backdropFilter: 'blur(10px)', border: '2px solid #17a2b8' }}>
              <div className="card-body text-center p-4">
                <i className="bi bi-graph-up-arrow" style={{ fontSize: '2.5rem', color: '#17a2b8', opacity: 0.8 }}></i>
                <h3 className="mt-3" style={{ color: '#17a2b8' }}>₹{(summary.totalCashIn - summary.totalCashOut).toFixed(2)}</h3>
                <p className="mb-0" style={{ color: '#f4e5c3' }}>Net Cash Flow</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-funnel-fill me-2"></i>Filters</h5>
          </div>
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-calendar-fill me-2" style={{ color: '#d4af37' }}></i>Filter by Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                  style={{ border: '2px solid #d4af37' }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-tag-fill me-2" style={{ color: '#d4af37' }}></i>Filter by Category</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter category"
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  style={{ border: '2px solid #d4af37' }}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ color: '#6c757d' }}><i className="bi bi-person-fill me-2" style={{ color: '#d4af37' }}></i>Filter by Handler</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter handler name"
                  value={filters.handledBy}
                  onChange={(e) => setFilters({...filters, handledBy: e.target.value})}
                  style={{ border: '2px solid #d4af37' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0" style={{ color: '#d4af37' }}><i className="bi bi-list-ul me-2"></i>Daily Entries</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th><i className="bi bi-calendar-fill me-2"></i>Date</th>
                    <th><i className="bi bi-tag-fill me-2"></i>Category</th>
                    <th><i className="bi bi-file-text-fill me-2"></i>Description</th>
                    <th><i className="bi bi-arrow-left-right me-2"></i>Type</th>
                    <th><i className="bi bi-currency-rupee me-2"></i>Amount</th>
                    <th><i className="bi bi-person-fill me-2"></i>Handled By</th>
                    <th><i className="bi bi-check-circle-fill me-2"></i>Approved By</th>
                    <th><i className="bi bi-gear-fill me-2"></i>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id}>
                      <td>{new Date(entry.date).toLocaleDateString()}</td>
                      <td><span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#1a1a1a' }}>{entry.category}</span></td>
                      <td>{entry.description}</td>
                      <td>
                        <span className={`badge ${entry.type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                          {entry.type === 'in' ? '↓ Credit' : '↑ Debit'}
                        </span>
                      </td>
                      <td className={entry.type === 'in' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        ₹{entry.amount.toFixed(2)}
                      </td>
                      <td>{entry.handledBy}</td>
                      <td>{entry.approvedBy || <span className="text-muted">Pending</span>}</td>
                      <td>
                        <Link href={`/accounting/petty-cash/${entry._id}/edit`} className="btn btn-sm me-1" style={{ background: '#ffc107', color: '#000', border: 'none' }}>
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        {userRole === "developer" && (
                          <button onClick={() => deleteEntry(entry._id)} className="btn btn-sm" style={{ background: '#dc3545', color: '#fff', border: 'none' }}>
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        )}
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
