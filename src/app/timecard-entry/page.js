"use client";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function DailyTaskComponent({ employeeId = "CHC001" }) {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [employee, setEmployee] = useState({ name: "", designation: "" });
  const [timecard, setTimecard] = useState({
    logIn: "",
    logOut: "",
    lunchOut: "",
    lunchIn: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Fetch employee info
      const empRes = await fetch(`/api/employee?employeeId=${employeeId}`);
      const empData = await empRes.json();
      if (!empData) return alert("Employee not found");
      setEmployee({ name: empData.name, designation: empData.designation });

      // 2️⃣ Fetch today's Timecard
      const tcRes = await fetch(`/api/timecard?employeeId=${employeeId}`);
      const tcData = await tcRes.json();
      const todayTimecard = tcData.length ? tcData[0] : {};
      setTimecard({
        logIn: todayTimecard.logIn || "",
        logOut: todayTimecard.logOut || "",
        lunchOut: todayTimecard.lunchOut || "",
        lunchIn: todayTimecard.lunchIn || "",
      });

      // 3️⃣ Fetch today's tasks
      const today = new Date().toISOString().split("T")[0];
      const dtRes = await fetch(
        `/api/daily-task?employeeId=${employeeId}&date=${today}`
      );
      const dtData = await dtRes.json();
      if (dtData.length) {
        // Map tasks and sync with Timecard
        setDailyTasks(
          dtData[0].tasks.map((t, i) => ({
            ...t,
            Serialno: i + 1,
            _id: dtData[0]._id,
            startTime: t.startTime || todayTimecard.logIn || "",
            endTime: t.endTime || todayTimecard.logOut || "",
            remarks: t.remarks || "", // Keep remarks empty if no manual input
          }))
        );
      } else {
        setDailyTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add new task
  const addTask = () => {
    setDailyTasks([
      ...dailyTasks,
      {
        Serialno: dailyTasks.length + 1,
        details: "",
        startTime: timecard.logIn || "",
        endTime: timecard.logOut || "",
        status: "In Progress",
        remarks: "", // Do not populate remarks automatically
        link: "",
        feedback: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...dailyTasks];
    updated[index][field] = value;
    setDailyTasks(updated);
  };

  const saveTasks = async () => {
    if (!dailyTasks.length) return alert("No tasks to save");
    const existing = dailyTasks[0]._id;
    const payload = {
      employeeId,
      tasks: dailyTasks,
      _id: existing,
    };

    const res = await fetch("/api/daily-task", {
      method: existing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) alert("Daily Tasks saved!");
    else alert(data.error || "Failed to save tasks");
    fetchData();
  };

  const generateMonthlyReport = async () => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const res = await fetch(`/api/daily-task?month=${month}&year=${year}`);
    const data = await res.json();

    const wsData = [];
    data.forEach((dt) => {
      dt.tasks.forEach((t) => {
        wsData.push({
          Date: new Date(dt.date).toLocaleDateString(),
          EmployeeId: dt.employee.employeeId,
          EmployeeName: dt.employee.name,
          Designation: dt.employee.designation,
          Serialno: t.Serialno,
          Details: t.details,
          StartTime: t.startTime,
          EndTime: t.endTime,
          LunchOut: timecard.lunchOut,
          LunchIn: timecard.lunchIn,
          Status: t.status,
          Remarks: t.remarks,
          Link: t.link,
          Feedback: t.feedback,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MonthlyTasks");
    XLSX.writeFile(wb, `MonthlyTasks_${month}_${year}.xlsx`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container-fluid mt-4">
      <div className="row mb-3">
        <div className="col-12 col-md-6">
          <h2>Daily Task Management</h2>
        </div>
        <div className="col-12 col-md-6 text-md-end">
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
          <div>
            <strong>Employee ID:</strong> {employeeId} &nbsp;
            <strong>Name:</strong> {employee.name} &nbsp;
            <strong>Designation:</strong> {employee.designation}
          </div>
        </div>
      </div>

      {/* Timecard Info */}
      <div className="row mb-3">
        <div className="col-12 d-flex flex-wrap gap-3">
          <span className="badge bg-primary">
            Log In: {timecard.logIn || "--:--"}
          </span>
          <span className="badge bg-success">
            Log Out: {timecard.logOut || "--:--"}
          </span>
          <span className="badge bg-warning text-dark">
            Lunch Out: {timecard.lunchOut || "--:--"}
          </span>
          <span className="badge bg-info text-dark">
            Lunch In: {timecard.lunchIn || "--:--"}
          </span>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark text-center">
            <tr>
              <th>Serial No</th>
              <th>Details</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Link</th>
              <th>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {dailyTasks.map((task, idx) => (
              <tr key={idx}>
                <td className="text-center">{task.Serialno}</td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.details}
                    onChange={(e) =>
                      handleChange(idx, "details", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={task.startTime}
                    onChange={(e) =>
                      handleChange(idx, "startTime", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={task.endTime}
                    onChange={(e) =>
                      handleChange(idx, "endTime", e.target.value)
                    }
                  />
                </td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={task.status}
                    onChange={(e) =>
                      handleChange(idx, "status", e.target.value)
                    }
                  >
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Pending</option>
                  </select>
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.remarks}
                    onChange={(e) =>
                      handleChange(idx, "remarks", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.link}
                    onChange={(e) => handleChange(idx, "link", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.feedback}
                    onChange={(e) =>
                      handleChange(idx, "feedback", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button className="btn btn-primary" onClick={addTask}>
          + Add Task
        </button>
        <button className="btn btn-success" onClick={saveTasks}>
          Save / Update
        </button>
        <button className="btn btn-secondary" onClick={generateMonthlyReport}>
          Generate Monthly Report
        </button>
      </div>
    </div>
  );
}
