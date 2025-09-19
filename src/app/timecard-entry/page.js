"use client";

import { useState, useEffect } from "react";

export default function TimecardPage() {
  const [timecards, setTimecards] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    date: "",
    logIn: "",
    logOut: "",
    lunchOut: "",
    lunchIn: "",
    permission: "",
    reason: "",
  });

  // Fetch all timecards
  useEffect(() => {
    fetch("/api/timecard")
      .then((res) => res.json())
      .then((data) => setTimecards(data));
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/timecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const newRecord = await res.json();
      setTimecards([newRecord.timecard, ...timecards]);
      setForm({
        employeeId: "",
        date: "",
        logIn: "",
        logOut: "",
        lunchOut: "",
        lunchIn: "",
        permission: "",
        reason: "",
      });
    } else {
      alert("Error saving timecard");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Employee Timecard</h1>

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        {Object.keys(form).map((field) => (
          <input
            key={field}
            type={field === "date" ? "date" : "text"}
            name={field}
            value={form[field]}
            onChange={handleChange}
            placeholder={field}
            className="border p-2 rounded"
          />
        ))}
        <button
          type="submit"
          className="col-span-2 bg-blue-600 text-white py-2 rounded"
        >
          Save
        </button>
      </form>

      {/* Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Employee ID</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Log In</th>
            <th className="border p-2">Log Out</th>
            <th className="border p-2">Lunch In</th>
            <th className="border p-2">Lunch Out</th>
            <th className="border p-2">Permission</th>
            <th className="border p-2">Reason</th>
            <th className="border p-2">Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {timecards.map((tc) => (
            <tr key={tc._id}>
              <td className="border p-2">{tc.employeeId}</td>
              <td className="border p-2">
                {new Date(tc.date).toLocaleDateString()}
              </td>
              <td className="border p-2">{tc.logIn}</td>
              <td className="border p-2">{tc.logOut}</td>
              <td className="border p-2">{tc.lunchIn}</td>
              <td className="border p-2">{tc.lunchOut}</td>
              <td className="border p-2">{tc.permission}</td>
              <td className="border p-2">{tc.reason}</td>
              <td className="border p-2">{tc.totalHours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
