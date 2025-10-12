"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "Income",
    description: "",
    account: "",
    amount: "",
    paymentMethod: "Cash",
    document: null
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
          amount: parseFloat(formData.amount),
          fromAccount: formData.type === 'Expense' ? formData.account : null,
          toAccount: formData.type === 'Income' ? formData.account : null,
          type: formData.type === 'Income' ? 'Credit' : 'Debit',
          source: 'manual'
        })
      });
      if (response.ok) {
        router.push("/accounting/transactions");
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h1>➕ Create Transaction</h1>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Account</label>
              <select
                className="form-control"
                value={formData.account}
                onChange={(e) => setFormData({...formData, account: e.target.value})}
                required
              >
                <option value="">Select Account</option>
                {accounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Payment Method</label>
          <select
            className="form-control"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Card">Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows="3"
            required
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Attach Document (Optional)</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setFormData({...formData, document: e.target.files[0]})}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
        <button type="submit" className="btn btn-primary">Add Transaction</button>
        <button type="button" onClick={() => router.back()} className="btn btn-secondary ms-2">Cancel</button>
      </form>
    </div>
  );
}