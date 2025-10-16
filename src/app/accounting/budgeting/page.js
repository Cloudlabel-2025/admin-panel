"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/budgeting/budgets");
      const data = await response.json();
      setBudgets(data);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      try {
        await fetch(`/api/budgeting/budgets/${id}`, { method: "DELETE" });
        fetchBudgets();
      } catch (error) {
        console.error("Error deleting budget:", error);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: "400px"}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate summary statistics
  const totalAllocated = budgets.reduce((sum, budget) => sum + (budget.allocatedAmout || 0), 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spentAmount || 0), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const overBudgetCount = budgets.filter(budget => budget.spentAmount > budget.allocatedAmout).length;

  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">📊 Budget Management</h2>
                <p className="text-muted mb-0">Manage your financial budgets and track spending</p>
              </div>
              <Link href="/accounting/budgeting/create" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i> Create Budget
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {budgets.length > 0 && (
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                        <i className="fas fa-wallet text-primary fa-lg"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="text-muted mb-1">Total Allocated</h6>
                      <h4 className="mb-0">₹{totalAllocated.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-warning bg-opacity-10 rounded-3 p-3">
                        <i className="fas fa-credit-card text-warning fa-lg"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="text-muted mb-1">Total Spent</h6>
                      <h4 className="mb-0">₹{totalSpent.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className={`bg-opacity-10 rounded-3 p-3 ${
                        totalRemaining >= 0 ? 'bg-success' : 'bg-danger'
                      }`}>
                        <i className={`fas fa-chart-line fa-lg ${
                          totalRemaining >= 0 ? 'text-success' : 'text-danger'
                        }`}></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="text-muted mb-1">Remaining</h6>
                      <h4 className={`mb-0 ${
                        totalRemaining >= 0 ? 'text-success' : 'text-danger'
                      }`}>₹{totalRemaining.toLocaleString()}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-shrink-0">
                      <div className="bg-info bg-opacity-10 rounded-3 p-3">
                        <i className="fas fa-exclamation-triangle text-info fa-lg"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h6 className="text-muted mb-1">Over Budget</h6>
                      <h4 className="mb-0">{overBudgetCount} of {budgets.length}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Budget Table */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Budget Details</h5>
                  <span className="badge bg-primary">{budgets.length} Budgets</span>
                </div>
              </div>
              <div className="card-body p-0">
                {budgets.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <div className="bg-light rounded-circle d-inline-flex p-4 mb-3">
                        <i className="fas fa-chart-pie fa-3x text-muted"></i>
                      </div>
                      <h4 className="text-muted mb-2">No budgets found</h4>
                      <p className="text-muted mb-4">Create your first budget to start tracking your finances</p>
                      <Link href="/accounting/budgeting/create" className="btn btn-primary btn-lg">
                        <i className="fas fa-plus me-2"></i> Create Your First Budget
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0 fw-semibold">Category</th>
                          <th className="border-0 fw-semibold">Allocated Amount</th>
                          <th className="border-0 fw-semibold">Spent Amount</th>
                          <th className="border-0 fw-semibold">Variance</th>
                          <th className="border-0 fw-semibold">Period</th>
                          <th className="border-0 fw-semibold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgets.map((budget) => {
                          const utilizationPercent = budget.allocatedAmout > 0 
                            ? Math.round((budget.spentAmount / budget.allocatedAmout) * 100) 
                            : 0;
                          const isOverBudget = budget.spentAmount > budget.allocatedAmout;
                          
                          return (
                            <tr key={budget._id} className="align-middle">
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="bg-primary bg-opacity-10 rounded-3 p-2 me-3">
                                    <i className="fas fa-tag text-primary"></i>
                                  </div>
                                  <div>
                                    <div className="fw-semibold">{budget.category}</div>
                                    <small className="text-muted">{utilizationPercent}% utilized</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className="fw-semibold">₹{budget.allocatedAmout?.toLocaleString()}</span>
                                </div>
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className={`fw-semibold ${
                                    isOverBudget ? 'text-danger' : 'text-warning'
                                  }`}>₹{budget.spentAmount?.toLocaleString()}</span>
                                  {isOverBudget && <i className="fas fa-exclamation-triangle text-danger ms-2"></i>}
                                </div>
                              </td>
                              <td>
                                <span className={`badge px-3 py-2 ${
                                  budget.variance >= 0 
                                    ? 'bg-success bg-opacity-10 text-success' 
                                    : 'bg-danger bg-opacity-10 text-danger'
                                }`}>
                                  ₹{budget.variance?.toLocaleString()}
                                </span>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark px-3 py-2 border">
                                  {budget.period}
                                </span>
                              </td>
                              <td className="text-center">
                                <div className="btn-group" role="group">
                                  <Link 
                                    href={`/accounting/budgeting/${budget._id}/edit`} 
                                    className="btn btn-outline-primary btn-sm"
                                    title="Edit Budget"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </Link>
                                  {userRole === "developer" && (
                                    <button 
                                      onClick={() => deleteBudget(budget._id)} 
                                      className="btn btn-outline-danger btn-sm"
                                      title="Delete Budget"
                                    >
                                      <i className="fas fa-trash"></i>
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
        </div>
      </div>
    </Layout>
  );
}