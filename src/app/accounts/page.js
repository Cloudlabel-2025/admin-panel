"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/accounts");
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📊 Accounts</h1>
        <Link href="/accounts/create" className="btn btn-primary">
          ➕ Create Account
        </Link>
      </div>
      
      <div className="row mb-3">
        <div className="col-md-6">
          <Link href="/accounts/transfer" className="btn btn-success">
            🔄 Transfer Money
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account._id}>
                <td>{account.name}</td>
                <td>{account.type}</td>
                <td>${account.balance}</td>
                <td>{account.description}</td>
                <td>
                  <Link href={`/accounts/${account._id}/edit`} className="btn btn-sm btn-warning me-2">
                    ✏️ Edit
                  </Link>
                  <button onClick={() => deleteAccount(account._id)} className="btn btn-sm btn-danger">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}