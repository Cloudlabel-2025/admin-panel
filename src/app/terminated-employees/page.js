"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function TerminatedEmployees() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    
    if (role !== "super-admin" && role !== "Super-admin" && role !== "developer") {
      router.push("/admin-dashboard");
      return;
    }
    
    fetchTerminatedEmployees();
  }, []);

  const fetchTerminatedEmployees = async () => {
    try {
      const mongoose = await import('mongoose');
      const response = await fetch("/api/Employee");
      const allEmployees = await response.json();
      
      const res = await fetch("/api/Employee/terminated-list");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Error fetching terminated employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejoin = async (employeeId) => {
    if (!confirm("Are you sure you want to rejoin this employee?")) return;

    try {
      const response = await fetch("/api/Employee/rejoin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Employee rejoined successfully!");
        fetchTerminatedEmployees();
      } else {
        alert(data.error || "Failed to rejoin employee");
      }
    } catch (error) {
      console.error("Error rejoining employee:", error);
      alert("Error rejoining employee");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#d4af37' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid py-4">
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <h3 className="mb-0" style={{ color: '#ffffff' }}>
              <i className="bi bi-person-x-fill me-2" style={{ color: '#d4af37' }}></i>
              Terminated Employees
            </h3>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            {employees.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#999' }}></i>
                <p className="text-muted mt-3">No terminated employees found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Terminated Date</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.employeeId}>
                        <td>{emp.employeeId}</td>
                        <td>{emp.firstName} {emp.lastName}</td>
                        <td>{emp.department}</td>
                        <td>{emp.role}</td>
                        <td>{new Date(emp.terminatedDate).toLocaleDateString()}</td>
                        <td>{emp.terminationReason}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleRejoin(emp.employeeId)}
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                            Rejoin
                          </button>
                        </td>
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
