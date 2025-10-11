"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/performance")
    .then((res) => res.json())
    .then((data) => {
      setReviews(Array.isArray(data) ? data : data.data || []);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setReviews([]);
      setLoading(false);
    });
}, []);

  async function handleDelete(id) {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/performance/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r._id !== id));
  }

  return (
    <Layout>
      <div className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="text-center flex-grow-1">Performance Reviews</h1>
          <Link href="/performance/create" className="btn btn-primary">
            + Add Review
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Reviewer</th>
                  <th>Overall</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id}>
                    <td>{r.employeeId?.name || "—"}</td>
                    <td>{r.reviewPeriod}</td>
                    <td>{r.reviewer || "—"}</td>
                    <td>{r.overall || "—"}</td>
                    <td className="d-flex gap-2">
                      <Link
                        href={`/performance/${r._id}/edit`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
                    </td>
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
