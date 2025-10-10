"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📈 Budgets</h1>
        <Link href="/budgeting/create" className="btn btn-primary">
          ➕ Create Budget
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Category</th>
              <th>Allocated Amount</th>
              <th>Spent Amount</th>
              <th>Variance</th>
              <th>Period</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgets.map((budget) => (
              <tr key={budget._id}>
                <td>{budget.category}</td>
                <td>${budget.allocatedAmout}</td>
                <td>${budget.spentAmount}</td>
                <td className={budget.variance >= 0 ? "text-success" : "text-danger"}>
                  ${budget.variance}
                </td>
                <td>{budget.period}</td>
                <td>
                  <Link href={`/budgeting/${budget._id}/edit`} className="btn btn-sm btn-warning me-2">
                    ✏️ Edit
                  </Link>
                  <button onClick={() => deleteBudget(budget._id)} className="btn btn-sm btn-danger">
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