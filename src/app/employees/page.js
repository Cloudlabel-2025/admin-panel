"use client";

import { useState } from "react";

export default function EmployeesPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Search employee by ID
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/Employee/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults([data.employee]);
      } else {
        alert(data.error || "Employee not found");
        setResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      alert("Error searching employee");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch all employees
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/Employee/search");
      const data = await res.json();
      if (res.ok) {
        setResults(data.employees);
      } else {
        alert(data.error || "Failed to fetch employees");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Employee Directory</h2>

      {/* Search Bar */}
      <form className="d-flex mb-3" onSubmit={handleSearch}>
        <input
          type="text"
          className="form-control me-2"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Get All Employees */}
      <div className="text-center mb-3">
        <button className="btn btn-success" onClick={fetchAll} disabled={loading}>
          {loading ? "Loading..." : "Get All Employees"}
        </button>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joining Date</th>
                <th>Department</th>
                <th>Role</th>
                <th>Emergency Contact</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {results.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.dob ? new Date(emp.dob).toLocaleDateString() : "-"}</td>
                  <td>{emp.gender}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone}</td>
                  <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "-"}</td>
                  <td>{emp.department}</td>
                  <td>{emp.role}</td>
                  <td>
                    {emp.emergencyContact?.contactPerson} (
                    {emp.emergencyContact?.contactNumber})
                  </td>
                  <td>
                    {emp.address?.street}, {emp.address?.city}, {emp.address?.state},{" "}
                    {emp.address?.zip}, {emp.address?.country}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
