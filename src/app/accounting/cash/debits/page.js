"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddDebitPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    fromAccount: "",
    amount: 0,
    description: ""
  });

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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: "Debit"
        })
      });
      if (response.ok) {
        router.push("/cash");
      }
    } catch (error) {
      console.error("Error creating debit:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>➖ Add Debit</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">From Account</label>
          <select
            className="form-control"
            value={formData.fromAccount}
            onChange={(e) => setFormData({...formData, fromAccount: e.target.value})}
            required
          >
            <option value="">Select Account</option>
            {accounts.map(account => (
              <option key={account._id} value={account._id}>
                {account.name} (${account.balance})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Amount</label>
          <input
            type="number"
            className="form-control"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Reason for debit..."
          />
        </div>
        <button type="submit" className="btn btn-danger">Add Debit</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}