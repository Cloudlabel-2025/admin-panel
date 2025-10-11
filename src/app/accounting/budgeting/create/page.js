"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateBudgetPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    category: "",
    allocatedAmout: 0,
    spentAmount: 0,
    period: "Monthly"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/budgeting/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        router.push("/budgeting");
      }
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>➕ Create Budget</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Category</label>
          <input
            type="text"
            className="form-control"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Allocated Amount</label>
          <input
            type="number"
            className="form-control"
            value={formData.allocatedAmout}
            onChange={(e) => setFormData({...formData, allocatedAmout: parseFloat(e.target.value)})}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Spent Amount</label>
          <input
            type="number"
            className="form-control"
            value={formData.spentAmount}
            onChange={(e) => setFormData({...formData, spentAmount: parseFloat(e.target.value)})}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Period</label>
          <select
            className="form-control"
            value={formData.period}
            onChange={(e) => setFormData({...formData, period: e.target.value})}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Create</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}