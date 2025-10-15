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
    type: '',
    search: ''
  });
  const [stats, setStats] = useState({
    totalCredit: 0,
    totalDebit: 0,
    balance: 0,
    totalTransactions: 0
  });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      
      const data = await response.json();
      const transactionData = Array.isArray(data) ? data : [];
      setTransactions(transactionData);
      
      // Calculate stats
      const totalCredit = transactionData.filter(t => t.type === 'Credit').reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalDebit = transactionData.filter(t => t.type === 'Debit').reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats({
        totalCredit,
        totalDebit,
        balance: totalCredit - totalDebit,
        totalTransactions: transactionData.length
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
      setStats({ totalCredit: 0, totalDebit: 0, balance: 0, totalTransactions: 0 });
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  let filteredTransactions = transactions.filter(transaction => {
    let matchesTab = true;
    if (activeTab === 'petty-cash') matchesTab = transaction.source === 'petty-cash';
    else if (activeTab === 'external') matchesTab = transaction.source === 'external';
    else if (activeTab === 'sales') matchesTab = transaction.source === 'sales';
    else if (activeTab === 'purchases') matchesTab = transaction.source === 'purchases';
    
    let matchesFilters = true;
    if (filters.date) matchesFilters = matchesFilters && transaction.date.includes(filters.date);
    if (filters.type) matchesFilters = matchesFilters && transaction.type === filters.type;
    if (filters.account) matchesFilters = matchesFilters && (transaction.fromAccount?._id === filters.account || transaction.toAccount?._id === filters.account);
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      matchesFilters = matchesFilters && (
        transaction.description?.toLowerCase().includes(searchLower) ||
        transaction.fromAccount?.name?.toLowerCase().includes(searchLower) ||
        transaction.toAccount?.name?.toLowerCase().includes(searchLower) ||
        transaction.amount?.toString().includes(searchLower) ||
        transaction.source?.toLowerCase().includes(searchLower)
      );
    }
    
    return matchesTab && matchesFilters;
  });

  // Sort transactions
  filteredTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

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
            <h2 className="mb-1">💸 Transaction Management</h2>
            <p className="text-muted mb-0">Track and manage all financial transactions</p>
          </div>
          <div>
            <button className="btn btn-outline-success me-2" onClick={() => exportToCSV()}>
              <i className="bi bi-download"></i> Export CSV
            </button>
            <button className="btn btn-outline-danger me-2" onClick={() => exportToPDF()}>
              <i className="bi bi-file-pdf"></i> Export PDF
            </button>
            <Link href="/accounting/transactions/create" className="btn btn-primary">
              <i className="bi bi-plus-circle"></i> New Transaction
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-arrow-up-circle" style={{fontSize: '2rem'}}></i>
                </div>
                <h5 className="card-title text-success">Total Credit</h5>
                <h3 className="mb-0">₹{stats.totalCredit.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="text-danger mb-2">
                  <i className="bi bi-arrow-down-circle" style={{fontSize: '2rem'}}></i>
                </div>
                <h5 className="card-title text-danger">Total Debit</h5>
                <h3 className="mb-0">₹{stats.totalDebit.toLocaleString()}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className={`mb-2 ${stats.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  <i className="bi bi-wallet2" style={{fontSize: '2rem'}}></i>
                </div>
                <h5 className="card-title">Net Balance</h5>
                <h3 className={`mb-0 ${stats.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{Math.abs(stats.balance).toLocaleString()}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-receipt" style={{fontSize: '2rem'}}></i>
                </div>
                <h5 className="card-title text-primary">Total Transactions</h5>
                <h3 className="mb-0">{stats.totalTransactions}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-0">
            <ul className="nav nav-pills nav-fill">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  <i className="bi bi-list-ul me-2"></i>All Transactions
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'petty-cash' ? 'active' : ''}`} onClick={() => setActiveTab('petty-cash')}>
                  <i className="bi bi-cash-coin me-2"></i>Petty Cash
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'external' ? 'active' : ''}`} onClick={() => setActiveTab('external')}>
                  <i className="bi bi-arrow-left-right me-2"></i>External
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
                  <i className="bi bi-cart-check me-2"></i>Sales
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'purchases' ? 'active' : ''}`} onClick={() => setActiveTab('purchases')}>
                  <i className="bi bi-bag me-2"></i>Purchases
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0">
            <h6 className="mb-0"><i className="bi bi-funnel me-2"></i>Search & Filters</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Search Transactions</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by description, account, amount..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Filter by Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Filter by Type</label>
                <select
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Clear Filters</label>
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => setFilters({date: '', account: '', type: '', search: ''})}
                >
                  <i className="bi bi-x-circle"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <h6 className="mb-0"><i className="bi bi-table me-2"></i>Transactions ({filteredTransactions.length})</h6>
            <small className="text-muted">Showing {filteredTransactions.length} of {transactions.length} transactions</small>
          </div>
          <div className="card-body p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-receipt" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                </div>
                <h5 className="text-muted">No transactions found</h5>
                <p className="text-muted mb-3">Start by creating your first transaction</p>
                <Link href="/accounting/transactions/create" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Create Transaction
                </Link>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-search" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                </div>
                <h5 className="text-muted">No matching transactions</h5>
                <p className="text-muted mb-3">Try adjusting your search or filters</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => setFilters({date: '', account: '', type: '', search: ''})}
                >
                  <i className="bi bi-x-circle me-2"></i>Clear Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold" style={{cursor: 'pointer'}} onClick={() => handleSort('date')}>
                        <i className="bi bi-calendar3 me-2"></i>Date
                        {sortConfig.key === 'date' && (
                          <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th className="border-0 fw-semibold"><i className="bi bi-card-text me-2"></i>Description</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-building me-2"></i>Account</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-arrow-left-right me-2"></i>Type</th>
                      <th className="border-0 fw-semibold" style={{cursor: 'pointer'}} onClick={() => handleSort('amount')}>
                        <i className="bi bi-currency-rupee me-2"></i>Amount
                        {sortConfig.key === 'amount' && (
                          <i className={`bi bi-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`}></i>
                        )}
                      </th>
                      <th className="border-0 fw-semibold"><i className="bi bi-tag me-2"></i>Source</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-gear me-2"></i>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((transaction) => (
                      <tr key={transaction._id} className="align-middle">
                        <td>
                          <div className="fw-semibold">{new Date(transaction.date).toLocaleDateString('en-IN')}</div>
                          <small className="text-muted">{new Date(transaction.date).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</small>
                        </td>
                        <td>
                          <div className="fw-semibold">{transaction.description || 'No description'}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-building text-muted me-2"></i>
                            <span>{transaction.fromAccount?.name || transaction.toAccount?.name || "N/A"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${transaction.type === 'Credit' ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${transaction.type === 'Credit' ? 'success' : 'danger'} border border-${transaction.type === 'Credit' ? 'success' : 'danger'}`}>
                            <i className={`bi bi-arrow-${transaction.type === 'Credit' ? 'up' : 'down'}-circle me-1`}></i>
                            {transaction.type}
                          </span>
                        </td>
                        <td>
                          <div className={`fw-bold ${transaction.type === 'Credit' ? 'text-success' : 'text-danger'}`}>
                            {transaction.type === 'Credit' ? '+' : '-'}₹{parseFloat(transaction.amount || 0).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                            <i className="bi bi-tag me-1"></i>
                            {transaction.source || 'Manual'}
                          </span>
                        </td>
                        <td>
                          <Link 
                            href={`/accounting/transactions/${transaction._id}/edit`} 
                            className="btn btn-sm btn-outline-primary"
                            title="Edit Transaction"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                  </small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}