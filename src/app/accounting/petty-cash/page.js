"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function PettyCashPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [filter, setFilter] = useState("monthly");
  const [myBudget, setMyBudget] = useState({ allocated: 0, spent: 0, balance: 0 });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseData, setExpenseData] = useState({
    category: "",
    amount: "",
    description: ""
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
    const userId = localStorage.getItem("employeeId");
    const userName = localStorage.getItem("userName") || "User";
    setUserRole(role);
    setCurrentUserId(userId);
    setCurrentUserName(userName);
    fetchEntries();
  }, [filter]);

  const fetchEntries = async () => {
    try {
      const role = localStorage.getItem("userRole");
      const userId = localStorage.getItem("employeeId");
      
      let url = `/api/petty-cash?filter=${filter}`;
      if (role === "admin") {
        url += `&adminId=${userId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      const entriesData = Array.isArray(data) ? data : [];
      setEntries(entriesData);
      
      // For admin: calculate their budget
      if (role === "admin") {
        const month = new Date().toISOString().slice(0, 7);
        const myEntries = entriesData.filter(e => e.handledBy === userId && e.month === month);
        const allocated = myEntries.filter(e => e.type === 'in').reduce((sum, e) => sum + (e.allocatedAmount || 0), 0);
        const spent = myEntries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
        setMyBudget({ allocated, spent, balance: allocated - spent });
      }
      
      // For super-admin/developer: calculate all
      const cashIn = entriesData.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
      const cashOut = entriesData.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
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

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const month = new Date().toISOString().slice(0, 7);
      const res = await fetch("/api/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "out",
          category: expenseData.category,
          amount: parseFloat(expenseData.amount),
          description: expenseData.description,
          handledBy: currentUserId,
          handledByName: currentUserName,
          month,
          date: new Date()
        })
      });
      
      if (res.ok) {
        alert("Expense recorded successfully!");
        setExpenseData({ category: "", amount: "", description: "" });
        setShowExpenseForm(false);
        fetchEntries();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to record expense");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error recording expense");
    } finally {
      setLoading(false);
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



  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">💰 {userRole === 'admin' ? 'My Budget & Expenses' : 'Petty Cash Management'}</h2>
            <small className="text-muted">{userRole === 'admin' ? 'Track your allocated budget and expenses' : 'Monitor all admin budgets and expenses'}</small>
          </div>
          {userRole === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowExpenseForm(!showExpenseForm)}>
              <i className="bi bi-plus-circle me-2"></i>Add Expense
            </button>
          )}
          {(userRole === 'super-admin' || userRole === 'developer') && (
            <Link href="/accounting/petty-cash/create" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Allocate Budget
            </Link>
          )}
        </div>

        {/* Summary Cards */}
        {userRole === 'admin' ? (
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3>₹{myBudget.allocated.toLocaleString()}</h3>
                  <p className="mb-0">💼 Allocated Budget</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-danger text-white">
                <div className="card-body text-center">
                  <h3>₹{myBudget.spent.toLocaleString()}</h3>
                  <p className="mb-0">💸 Total Spent</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3>₹{myBudget.balance.toLocaleString()}</h3>
                  <p className="mb-0">💰 Balance</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3>₹{summary.totalCashIn.toLocaleString()}</h3>
                  <p className="mb-0">💵 Total Allocated</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-danger text-white">
                <div className="card-body text-center">
                  <h3>₹{summary.totalCashOut.toLocaleString()}</h3>
                  <p className="mb-0">💸 Total Spent</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3>₹{summary.currentBalance.toLocaleString()}</h3>
                  <p className="mb-0">💰 Total Balance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expense Form for Admin */}
        {userRole === 'admin' && showExpenseForm && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Add Expense</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleExpenseSubmit}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={expenseData.category} onChange={(e) => setExpenseData({...expenseData, category: e.target.value})} required>
                      <option value="">Select...</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Travel">Travel</option>
                      <option value="Food">Food</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Amount (₹)</label>
                    <input type="number" className="form-control" value={expenseData.amount} onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})} required min="1" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Description</label>
                    <input type="text" className="form-control" value={expenseData.description} onChange={(e) => setExpenseData({...expenseData, description: e.target.value})} required />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn btn-success me-2" disabled={loading}>Submit</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseForm(false)}>Cancel</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="btn-group" role="group">
              <button className={`btn ${filter === 'weekly' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('weekly')}>Weekly</button>
              <button className={`btn ${filter === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('monthly')}>Monthly</button>
              <button className={`btn ${filter === '3months' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('3months')}>3 Months</button>
            </div>
          </div>
        </div>

        {/* Entries Table */}
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h5 className="mb-0">{userRole === 'admin' ? '📝 My Expenses' : '📊 All Transactions'}</h5>
          </div>
          <div className="card-body p-0">
            {entries.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No entries found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      {userRole !== 'admin' && <th>Admin</th>}
                      <th>Category</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Amount</th>
                      {userRole !== 'admin' && <th>Balance</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry._id}>
                        <td>{new Date(entry.date).toLocaleDateString()}</td>
                        {userRole !== 'admin' && <td><strong>{entry.handledByName || entry.handledBy}</strong></td>}
                        <td><span className="badge bg-secondary">{entry.category}</span></td>
                        <td>{entry.description}</td>
                        <td>
                          <span className={`badge ${entry.type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                            {entry.type === 'in' ? '⬆️ Allocated' : '⬇️ Expense'}
                          </span>
                        </td>
                        <td className={entry.type === 'in' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                          {entry.type === 'in' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                        </td>
                        {userRole !== 'admin' && <td className="text-primary fw-bold">₹{(entry.currentBalance || 0).toLocaleString()}</td>}
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
