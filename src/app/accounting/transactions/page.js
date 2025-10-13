"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    date: '',
    account: '',
    type: ''
  });
  const router = useRouter();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('account');
    if (accountId) {
      setFilters(prev => ({...prev, account: accountId}));
    }
  }, []);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
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

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,From Account,To Account,Type,Amount,Description\n" +
      filteredTransactions.map(t => 
        `${new Date(t.date).toLocaleDateString()},${t.fromAccount?.name || 'N/A'},${t.toAccount?.name || 'N/A'},${t.type},${t.amount},"${t.description}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  const filteredTransactions = transactions.filter(transaction => {
    let matchesTab = true;
    if (activeTab === 'petty-cash') matchesTab = transaction.source === 'petty-cash';
    else if (activeTab === 'external') matchesTab = transaction.source === 'external';
    else if (activeTab === 'sales') matchesTab = transaction.source === 'sales';
    else if (activeTab === 'purchases') matchesTab = transaction.source === 'purchases';
    
    let matchesFilters = true;
    if (filters.date) matchesFilters = matchesFilters && transaction.date.includes(filters.date);
    if (filters.type) matchesFilters = matchesFilters && transaction.type === filters.type;
    if (filters.account) matchesFilters = matchesFilters && (transaction.fromAccount?._id === filters.account || transaction.toAccount?._id === filters.account);
    
    return matchesTab && matchesFilters;
  });

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
          <h2>💸 All Transactions</h2>
          <div>
            <button className="btn btn-success me-2" onClick={() => exportToCSV()}>
              📊 Export CSV
            </button>
            <button className="btn btn-danger me-2" onClick={() => exportToPDF()}>
              📄 Export PDF
            </button>
            <Link href="/accounting/transactions/create" className="btn btn-primary">
              ➕ Create Transaction
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              All Transactions
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'petty-cash' ? 'active' : ''}`} onClick={() => setActiveTab('petty-cash')}>
              Petty Cash
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'external' ? 'active' : ''}`} onClick={() => setActiveTab('external')}>
              External
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
              Sales
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
              Purchases
            </button>
          </li>
        </ul>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Filter by Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Filter by Type</label>
                <select
                  className="form-control"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Export</label>
                <div>
                  <button className="btn btn-success me-2" onClick={() => exportToCSV()}>
                    📊 CSV
                  </button>
                  <button className="btn btn-danger" onClick={() => exportToPDF()}>
                    📄 PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                      <th>Description</th>
                      <th>Account</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Source</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>{new Date(transaction.date).toLocaleDateString('en-IN')}</td>
                        <td>{transaction.description}</td>
                        <td>{transaction.fromAccount?.name || transaction.toAccount?.name || "N/A"}</td>
                        <td><span className={`badge ${transaction.type === 'Credit' ? 'bg-success' : 'bg-danger'}`}>{transaction.type}</span></td>
                        <td><strong>₹{parseFloat(transaction.amount || 0).toFixed(2)}</strong></td>
                        <td><span className="badge bg-info">{transaction.source || 'Manual'}</span></td>
                        <td>
                          <Link href={`/accounting/transactions/${transaction._id}/edit`} className="btn btn-sm btn-outline-primary">
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