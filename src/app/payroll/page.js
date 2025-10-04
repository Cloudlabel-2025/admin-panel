// src/app/Pages/Payroll.jsx
"use client";
import { useState, useEffect } from "react";

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: "",
    bulk: false,
  });
  const [editPayroll, setEditPayroll] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch payrolls
  const fetchPayrolls = async () => {
    try {
      let url = "/api/payroll";
      if (form.employeeId) url += `?employeeId=${form.employeeId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setPayrolls([]);
    }
  };

  // Fetch employees for select dropdown
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/Employee/search");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  // Handle payroll generation
  const generatePayroll = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setLoading(false);
      if (res.status === 201) {
        alert(data.message);
        fetchPayrolls();
      } else {
        alert(data.error || "Failed to generate payroll");
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      alert("Error generating payroll");
    }
  };

  // Handle edit payroll update
  const updatePayroll = async () => {
    if (!editPayroll) return;
    try {
      const res = await fetch(`/api/payroll/${editPayroll.employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bonus: editPayroll.bonus,
          deductions: editPayroll.deductions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Payroll updated");
        setEditPayroll(null);
        fetchPayrolls();
      } else {
        alert(data.error || "Failed to update payroll");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating payroll");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Payroll Management</h2>

      {/* Payroll Form */}
      <div className="card p-3 mb-4">
        <h5>Generate Payroll</h5>
        <div className="mb-2">
          <label>Employee:</label>
          <select
            className="form-select"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            disabled={form.bulk}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.firstName} {emp.lastName} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label>Month:</label>
          <input
            type="number"
            className="form-control"
            value={form.month}
            min={1}
            max={12}
            onChange={(e) => setForm({ ...form, month: e.target.value })}
          />
        </div>
        <div className="mb-2">
          <label>Year:</label>
          <input
            type="number"
            className="form-control"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
          />
        </div>
        {!form.bulk && (
          <div className="mb-2">
            <label>Base Salary:</label>
            <input
              type="number"
              className="form-control"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
            />
          </div>
        )}
        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={form.bulk}
            onChange={(e) => setForm({ ...form, bulk: e.target.checked })}
          />
          <label className="form-check-label">Generate for all employees (bulk)</label>
        </div>
        <button className="btn btn-primary" onClick={generatePayroll} disabled={loading}>
          {loading ? "Processing..." : "Generate Payroll"}
        </button>
      </div>

      {/* Payroll List */}
      <div className="card p-3">
        <h5>Payroll Records</h5>
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month/Year</th>
              <th>Base Salary</th>
              <th>Present</th>
              <th>Half Days</th>
              <th>Absent</th>
              <th>Net Salary</th>
              <th>Bonus</th>
              <th>Deductions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((p) => (
              <tr key={p._id}>
                <td>{p.employeeId}</td>
                <td>
                  {p.month}/{p.year}
                </td>
                <td>{p.baseSalary}</td>
                <td>{p.presentDays}</td>
                <td>{p.halfDays}</td>
                <td>{p.absentDays}</td>
                <td>{p.netSalary?.toFixed(2) || 0}</td>
                <td>{p.bonus || 0}</td>
                <td>{p.deductions || 0}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() =>
                      setEditPayroll({
                        employeeId: p.employeeId,
                        bonus: p.bonus || 0,
                        deductions: p.deductions || 0,
                      })
                    }
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editPayroll && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h5>Edit Payroll</h5>
              <div className="mb-2">
                <label>Bonus:</label>
                <input
                  type="number"
                  className="form-control"
                  value={editPayroll.bonus}
                  onChange={(e) =>
                    setEditPayroll({ ...editPayroll, bonus: Number(e.target.value) })
                  }
                />
              </div>
              <div className="mb-2">
                <label>Deductions:</label>
                <input
                  type="number"
                  className="form-control"
                  value={editPayroll.deductions}
                  onChange={(e) =>
                    setEditPayroll({ ...editPayroll, deductions: Number(e.target.value) })
                  }
                />
              </div>
              <button className="btn btn-success me-2" onClick={updatePayroll}>
                Save
              </button>
              <button className="btn btn-secondary" onClick={() => setEditPayroll(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
