"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function MonitorEmployees() {
  const router = useRouter();
  const [timecards, setTimecards] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "super-admin") {
      router.push("/");
      return;
    }
    fetchAllTimecards();
  }, [router]);

  const fetchAllTimecards = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/timecard?admin=true");
      const data = await res.json();
      if (res.ok) {
        setTimecards(data.timecards || []);
      } else {
        alert("Failed to fetch timecard data");
      }
    } catch (err) {
      console.error("Error fetching timecards:", err);
      alert("Error fetching timecard data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB");
  };

  return (
    <Layout>
      <h2>Employee Monitoring</h2>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p>Monitor all employee timecard activities</p>
        <button className="btn btn-primary" onClick={fetchAllTimecards} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {timecards.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>Employee ID</th>
                <th>Date</th>
                <th>Log In</th>
                <th>Log Out</th>
                <th>Lunch Out</th>
                <th>Lunch In</th>
                <th>Permission (hrs)</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {timecards.map((timecard, idx) => (
                <tr key={idx}>
                  <td>{timecard.employeeId}</td>
                  <td>{formatDate(timecard.date)}</td>
                  <td>{timecard.logIn || "-"}</td>
                  <td>{timecard.logOut || "-"}</td>
                  <td>{timecard.lunchOut || "-"}</td>
                  <td>{timecard.lunchIn || "-"}</td>
                  <td>{timecard.permission || "-"}</td>
                  <td>{timecard.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No timecard data available</p>
      )}
    </Layout>
  );
}