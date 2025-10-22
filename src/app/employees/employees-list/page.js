"use client";
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";

export default function EmployeeList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/Employee");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <Layout>
      <div className="container mt-4">
        <h2 className="text-center mb-4">Employee List</h2>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="alert alert-warning text-center">No users found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-primary">
                <tr className="text-center">
                  <th>S.no</th>
                  <th>Employee ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Department</th> 
                  <th>Role</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id} className="text-center">
                    <td>{index + 1}</td>
                    <td>{user.employeeId}</td>
                    <td className="text-lowercase">{user.firstName}</td>
                    <td className="text-lowercase">{user.lastName}</td>
                    <td>{user.department} </td>
                    <td>{user.role}</td>
                    <td>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
