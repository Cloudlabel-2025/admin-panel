"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
      router.push("/");
      return;
    }
    fetchAccounts();
  }, [router]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
      
      // Calculate total balance
      const total = data.reduce((sum, account) => sum + (parseFloat(account.balance) || 0), 0);
      setTotalBalance(total);
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
          <h2>📊 Chart of Accounts</h2>
          <div>
            <Link href="/accounting/accounts/create" className="btn btn-primary me-2">
              ➕ Add Account
            </Link>
            <Link href="/accounting/transactions" className="btn btn-info me-2">
              📊 View Transactions
            </Link>
            <Link href="/accounting/accounts/transfer" className="btn btn-success">
              🔄 Transfer
            </Link>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5>₹{totalBalance.toFixed(2)}</h5>
                <p>Total Balance</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5>{accounts.length}</h5>
                <p>Total Accounts</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5>{accounts.filter(a => parseFloat(a.balance) > 0).length}</h5>
                <p>Active Accounts</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h5>{accounts.filter(a => parseFloat(a.balance) < 0).length}</h5>
                <p>Overdrawn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Account Details</h5>
          </div>
          <div className="card-body">
            {accounts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No accounts found. Create your first account to get started.</p>
                <Link href="/accounting/accounts/create" className="btn btn-primary">
                  ➕ Create First Account
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Account Name</th>
                      <th>Type</th>
                      <th>Balance</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => {
                      const balance = parseFloat(account.balance) || 0;
                      const balanceClass = balance > 0 ? 'text-success' : balance < 0 ? 'text-danger' : 'text-muted';
                      
                      return (
                        <tr key={account._id} style={{cursor: 'pointer'}} onClick={() => router.push(`/accounting/transactions?account=${account._id}`)}>
                          <td><strong>{account.name}</strong></td>
                          <td>
                            <span className="badge bg-secondary">{account.type}</span>
                          </td>
                          <td className={balanceClass}>
                            <strong>₹{balance.toFixed(2)}</strong>
                          </td>
                          <td>{new Date(account.updatedAt).toLocaleDateString()}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <Link href={`/accounting/accounts/${account._id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                              ✏️ Edit
                            </Link>
                            <button onClick={() => deleteAccount(account._id)} className="btn btn-sm btn-outline-danger">
                              🗑️ Delete
                            </button>
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