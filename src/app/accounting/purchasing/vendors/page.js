"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "@/app/components/Layout";

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/purchasing/vendors");
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVendor = async (id) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await fetch(`/api/purchasing/vendors/${id}`, { method: "DELETE" });
        fetchVendors();
      } catch (error) {
        console.error("Error deleting vendor:", error);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🏢 Vendors</h1>
        <Link href="/purchasing/vendors/create" className="btn btn-primary">
          ➕ Create Vendor
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor._id}>
                <td>{vendor.name}</td>
                <td>{vendor.email}</td>
                <td>{vendor.phone}</td>
                <td>{vendor.address}</td>
                <td>
                  <Link href={`/purchasing/vendors/${vendor._id}/edit`} className="btn btn-sm btn-warning me-2">
                    ✏️ Edit
                  </Link>
                  <button onClick={() => deleteVendor(vendor._id)} className="btn btn-sm btn-danger">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </Layout>
  );
}