"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function CalendarPage() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "Public",
    description: "",
    isRecurring: false
  });
  const [editingId, setEditingId] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setIsAdmin(role === "super-admin" || role === "Super-admin" || role === "admin");
    fetchHolidays();
  }, [currentYear]);

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/holiday?year=${currentYear}`);
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId 
        ? { _id: editingId, ...form }
        : { ...form, createdBy: localStorage.getItem("employeeId") };

      const res = await fetch("/api/holiday", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setForm({ name: "", date: "", type: "Public", description: "", isRecurring: false });
        setEditingId(null);
        fetchHolidays();
      }
    } catch (error) {
      console.error("Error saving holiday:", error);
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0],
      type: holiday.type,
      description: holiday.description || "",
      isRecurring: holiday.isRecurring
    });
    setEditingId(holiday._id);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this holiday?")) {
      try {
        const res = await fetch(`/api/holiday?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchHolidays();
      } catch (error) {
        console.error("Error deleting holiday:", error);
      }
    }
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Holiday Calendar</h2>
          <div>
            <select 
              className="form-select d-inline-block w-auto me-2"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="card mb-4">
            <div className="card-body">
              <h5>{editingId ? "Edit Holiday" : "Add Holiday"}</h5>
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Holiday Name"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                    >
                      <option value="Public">Public</option>
                      <option value="Company">Company</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Description"
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-primary w-100">
                      {editingId ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <h5>Holidays {currentYear}</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Holiday Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((holiday) => (
                    <tr key={holiday._id}>
                      <td>{new Date(holiday.date).toLocaleDateString()}</td>
                      <td>{holiday.name}</td>
                      <td>
                        <span className={`badge ${
                          holiday.type === 'Public' ? 'bg-success' :
                          holiday.type === 'Company' ? 'bg-primary' : 'bg-warning'
                        }`}>
                          {holiday.type}
                        </span>
                      </td>
                      <td>{holiday.description || "-"}</td>
                      {isAdmin && (
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleEdit(holiday)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(holiday._id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}