"use client";

import { useState } from "react";

export default function DebugPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/Employee/search");
      const data = await res.json();
      console.log("All employees:", data);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Debug: Database Employees</h2>
      <button className="btn btn-primary mb-3" onClick={fetchAllEmployees}>
        {loading ? "Loading..." : "Fetch All Employees"}
      </button>
      
      {employees.length > 0 ? (
        <div>
          <p><strong>Found {employees.length} employees:</strong></p>
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr key={idx}>
                    <td>{emp.employeeId}</td>
                    <td>{emp.firstName} {emp.lastName}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p>No employees found or not loaded yet.</p>
      )}
    </div>
  );
}