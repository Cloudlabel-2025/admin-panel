"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../../components/Layout";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin" && userRole !== "developer") {
      router.push("/");
      return;
    }
    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/sales/customers");
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await fetch(`/api/sales/customers/${id}`, { method: "DELETE" });
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  if (loading) return (
    <Layout>
      <div className="d-flex justify-content-center align-items-center" style={{height: "50vh"}}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>👥 Customer Management</h2>
          <Link href="/accounting/sales/customers/create" className="btn btn-primary">
            ➕ Add Customer
          </Link>
        </div>

        <div className="card">
          <div className="card-body">
            {customers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No customers found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Customer Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer._id}>
                        <td><strong>{customer.name}</strong></td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.address}</td>
                        <td>
                          <Link href={`/accounting/sales/customers/${customer._id}/edit`} className="btn btn-sm btn-outline-primary me-1">
                            ✏️ Edit
                          </Link>
                          <button onClick={() => deleteCustomer(customer._id)} className="btn btn-sm btn-outline-danger">
                            🗑️ Delete
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