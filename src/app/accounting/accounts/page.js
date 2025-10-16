"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    overdrawnAccounts: 0,
    assetAccounts: 0,
    liabilityAccounts: 0
  });
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    if (role !== "super-admin" && role !== "admin" && role !== "developer") {
      router.push("/");
      return;
    }
    fetchAccounts();
  }, [router]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      const accountData = Array.isArray(data) ? data : [];
      setAccounts(accountData);
      
      // Calculate stats
      const totalBalance = accountData.reduce((sum, account) => sum + (parseFloat(account.balance) || 0), 0);
      const activeAccounts = accountData.filter(a => parseFloat(a.balance) > 0).length;
      const overdrawnAccounts = accountData.filter(a => parseFloat(a.balance) < 0).length;
      const assetAccounts = accountData.filter(a => a.type === 'Asset').length;
      const liabilityAccounts = accountData.filter(a => a.type === 'Liability').length;
      
      setStats({
        totalBalance,
        totalAccounts: accountData.length,
        activeAccounts,
        overdrawnAccounts,
        assetAccounts,
        liabilityAccounts
      });
      setTotalBalance(totalBalance);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id) => {
    if (confirm("Are you sure you want to delete this account?")) {
      try {
        await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        fetchAccounts();
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === '' || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const getAccountTypeIcon = (type) => {
    switch(type) {
      case 'Asset': return 'bi-wallet2';
      case 'Liability': return 'bi-credit-card';
      case 'Equity': return 'bi-pie-chart';
      case 'Income': return 'bi-arrow-up-circle';
      case 'Expense': return 'bi-arrow-down-circle';
      default: return 'bi-circle';
    }
  };

  const getAccountTypeColor = (type) => {
    switch(type) {
      case 'Asset': return 'success';
      case 'Liability': return 'danger';
      case 'Equity': return 'primary';
      case 'Income': return 'info';
      case 'Expense': return 'warning';
      default: return 'secondary';
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
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <h2 className="mb-1"><i className="bi bi-bank me-2"></i>Chart of Accounts</h2>
            <p className="text-muted mb-0">Manage your financial accounts and balances</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link href="/accounting/accounts/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Add Account
            </Link>
            <Link href="/accounting/transactions" className="btn btn-outline-info">
              <i className="bi bi-list-ul me-2"></i>Transactions
            </Link>
            <Link href="/accounting/accounts/transfer" className="btn btn-outline-success">
              <i className="bi bi-arrow-left-right me-2"></i>Transfer
            </Link>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-primary mb-2">
                  <i className="bi bi-wallet2" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-primary mb-1">Total Balance</h6>
                <h5 className="mb-0">₹{stats.totalBalance.toLocaleString()}</h5>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-success mb-2">
                  <i className="bi bi-collection" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-success mb-1">Total Accounts</h6>
                <h5 className="mb-0">{stats.totalAccounts}</h5>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-info mb-2">
                  <i className="bi bi-check-circle" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-info mb-1">Active</h6>
                <h5 className="mb-0">{stats.activeAccounts}</h5>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-warning mb-2">
                  <i className="bi bi-exclamation-triangle" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-warning mb-1">Overdrawn</h6>
                <h5 className="mb-0">{stats.overdrawnAccounts}</h5>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-success mb-2">
                  <i className="bi bi-arrow-up" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-success mb-1">Assets</h6>
                <h5 className="mb-0">{stats.assetAccounts}</h5>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-3">
                <div className="text-danger mb-2">
                  <i className="bi bi-arrow-down" style={{fontSize: '1.5rem'}}></i>
                </div>
                <h6 className="card-title text-danger mb-1">Liabilities</h6>
                <h5 className="mb-0">{stats.liabilityAccounts}</h5>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white border-0">
            <h6 className="mb-0"><i className="bi bi-funnel me-2"></i>Search & Filters</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Search Accounts</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Filter by Type</label>
                <select
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Clear</label>
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {setSearchTerm(''); setFilterType('');}}
                >
                  <i className="bi bi-x-circle"></i> Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <h6 className="mb-0">
              <i className="bi bi-table me-2"></i>Account Details 
              <span className="badge bg-primary ms-2">{filteredAccounts.length}</span>
            </h6>
            <small className="text-muted">Click row to view transactions</small>
          </div>
          <div className="card-body p-0">
            {accounts.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-bank" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                </div>
                <h5 className="text-muted">No accounts found</h5>
                <p className="text-muted mb-3">Create your first account to get started</p>
                <Link href="/accounting/accounts/create" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Create First Account
                </Link>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-search" style={{fontSize: '3rem', color: '#dee2e6'}}></i>
                </div>
                <h5 className="text-muted">No matching accounts</h5>
                <p className="text-muted mb-3">Try adjusting your search or filters</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {setSearchTerm(''); setFilterType('');}}
                >
                  <i className="bi bi-x-circle me-2"></i>Clear Filters
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0 fw-semibold"><i className="bi bi-bank me-2"></i>Account Name</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-tag me-2"></i>Type</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-currency-rupee me-2"></i>Balance</th>
                      <th className="border-0 fw-semibold d-none d-md-table-cell"><i className="bi bi-calendar me-2"></i>Last Updated</th>
                      <th className="border-0 fw-semibold"><i className="bi bi-gear me-2"></i>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => {
                      const balance = parseFloat(account.balance) || 0;
                      const balanceClass = balance > 0 ? 'text-success' : balance < 0 ? 'text-danger' : 'text-muted';
                      const typeColor = getAccountTypeColor(account.type);
                      const typeIcon = getAccountTypeIcon(account.type);
                      
                      return (
                        <tr 
                          key={account._id} 
                          className="align-middle" 
                          style={{cursor: 'pointer'}} 
                          onClick={() => router.push(`/accounting/transactions?account=${account._id}`)}
                        >
                          <td>
                            <div className="d-flex align-items-center">
                              <div className={`me-3 text-${typeColor}`}>
                                <i className={typeIcon} style={{fontSize: '1.2rem'}}></i>
                              </div>
                              <div>
                                <div className="fw-semibold">{account.name}</div>
                                <small className="text-muted d-md-none">{account.type}</small>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <span className={`badge bg-${typeColor} bg-opacity-10 text-${typeColor} border border-${typeColor}`}>
                              <i className={`${typeIcon} me-1`}></i>
                              {account.type}
                            </span>
                          </td>
                          <td>
                            <div className={`fw-bold ${balanceClass}`}>
                              ₹{balance.toLocaleString()}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <small className="text-muted">
                              {new Date(account.updatedAt).toLocaleDateString('en-IN')}
                            </small>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="d-flex gap-1">
                              <Link 
                                href={`/accounting/accounts/${account._id}/edit`} 
                                className="btn btn-sm btn-outline-primary"
                                title="Edit Account"
                              >
                                <i className="bi bi-pencil"></i>
                              </Link>
                              {userRole === "developer" && (
                                <button 
                                  onClick={() => deleteAccount(account._id)} 
                                  className="btn btn-sm btn-outline-danger"
                                  title="Delete Account"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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