"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";

export default function DailyTaskComponent() {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timecard, setTimecard] = useState({
    logIn: "",
    logOut: "",
    lunchOut: "",
    lunchIn: "",
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch Timecard and DailyTask
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 1️⃣ Fetch today's Timecard
      const tcRes = await fetch(`/api/timecard?employeeId=${user.employeeId}`);
      const tcData = await tcRes.json();
      const todayTimecard = tcData.length ? tcData[0] : {};
      setTimecard({
        logIn: todayTimecard.logIn || "",
        logOut: todayTimecard.logOut || "",
        lunchOut: todayTimecard.lunchOut || "",
        lunchIn: todayTimecard.lunchIn || "",
      });

      // 2️⃣ Fetch today's DailyTask
      const today = new Date().toISOString().split("T")[0];
      const dtRes = await fetch(
        `/api/daily-task?employeeId=${user.employeeId}&date=${today}`
      );
      const dtData = await dtRes.json();
      if (dtData.length) {
        setDailyTasks(
          dtData[0].tasks.map((t, i) => ({
            ...t,
            Serialno: i + 1,
            _id: dtData[0]._id,
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
    const userRole = localStorage.getItem("userRole");
    const employeeId = localStorage.getItem("employeeId");
    
    // Allow all employee roles to access daily tasks, except super-admin
    if (!userRole || !employeeId || userRole === "super-admin" || userRole === "Super-admin") {
      router.push("/");
      return;
    }

    // Fetch employee data
    fetch(`/api/Employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            // Employee not found in department collections, use basic info
            setUser({
              employeeId: employeeId,
              name: "Employee",
              designation: "Employee"
            });
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser({
            employeeId: data.employeeId,
            name: `${data.firstName} ${data.lastName}`,
            designation: data.role || "Employee"
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch employee data:", err);
        // Fallback to basic user info instead of redirecting
        setUser({
          employeeId: employeeId,
          name: "Employee",
          designation: "Employee"
        });
      });
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Sync existing tasks with Timecard (only for existing tasks)
  useEffect(() => {
    setDailyTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        startTime: task.startTime || timecard.logIn,
        endTime: task.endTime || timecard.logOut,
        // Only update remarks if it already contains lunch info
        remarks: task.remarks.includes("Lunch")
          ? `Lunch Out: ${timecard.lunchOut || "--:--"}, Lunch In: ${
              timecard.lunchIn || "--:--"
            }`
          : task.remarks,
      }))
    );
  }, [timecard]);

  // Add new task
  const addTask = () => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Get previous task's end time or current time
    const lastTask = dailyTasks[dailyTasks.length - 1];
    const startTime = lastTask?.endTime || currentTime;
    
    const newTask = {
      Serialno: dailyTasks.length + 1,
      details: "",
      startTime: startTime,
      endTime: "",
      status: "In Progress",
      remarks: "",
      link: "",
      feedback: "",
      isNew: true,
      isSaved: false,
      createdAt: new Date().toISOString()
    };
    
    setDailyTasks([...dailyTasks, newTask]);
  };

  // Update task (push to database)
  const updateTask = async () => {
    if (!user || dailyTasks.length === 0) {
      alert('No tasks to update');
      return;
    }

    try {
      const payload = {
        employeeId: user.employeeId,
        employeeName: user.name,
        designation: user.designation,
        tasks: dailyTasks.map((t) => ({
          Serialno: t.Serialno,
          details: t.details || "",
          startTime: t.startTime,
          endTime: t.endTime,
          status: t.status,
          remarks: t.remarks || "",
          link: t.link || "",
          feedback: t.feedback || "",
          isSaved: t.isSaved || false
        }))
      };

      const response = await fetch("/api/daily-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        alert('Tasks updated successfully!');
      } else {
        const errorData = await response.json();
        alert('Update failed: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('Error updating tasks');
    }
  };

  // Handle input changes (local state only)
  const handleChange = (index, field, value) => {
    const updated = [...dailyTasks];
    const task = updated[index];
    
    // Prevent editing saved tasks except status
    if (task.isSaved && field !== 'status') {
      alert('Saved tasks can only have their status updated.');
      return;
    }
    
    // Prevent editing start time (system controlled)
    if (field === 'startTime') {
      alert('Start time is automatically set and cannot be edited.');
      return;
    }
    
    updated[index][field] = value;
    setDailyTasks(updated);
  };



  // Save tasks (mark as final)
  const saveTasks = async () => {
    try {
      if (!dailyTasks.length) return alert("No tasks to save");
      
      // Set end time for unsaved tasks
      const currentTime = new Date().toLocaleTimeString('en-GB', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const tasksToSave = dailyTasks.map(t => ({
        ...t,
        endTime: t.endTime || currentTime,
        isSaved: true
      }));

      const payload = {
        employeeId: user.employeeId,
        employeeName: user.name,
        designation: user.designation,
        tasks: tasksToSave.map((t) => ({
          Serialno: t.Serialno,
          details: t.details || "",
          startTime: t.startTime,
          endTime: t.endTime,
          status: t.status,
          remarks: t.remarks || "",
          link: t.link || "",
          feedback: t.feedback || "",
          isSaved: t.isSaved
        }))
      };

      const res = await fetch("/api/daily-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        alert("Tasks saved! You can now only update their status.");
        setDailyTasks(tasksToSave);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save tasks");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving tasks");
    }
  };

  // Generate Monthly Excel Report
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
          EmployeeId: user.employeeId,
          EmployeeName: user.name,
          Designation: user.designation,
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

  if (loading || !user) return (
    <Layout>
      <div className="d-flex justify-content-center align-items-center" style={{height: "50vh"}}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading daily tasks...</p>
        </div>
      </div>
    </Layout>
  );

  return (
   <Layout>
     <div className="container-fluid mt-4">
      <div className="row mb-3 align-items-center">
        <div className="col-12 col-md-6 mb-2">
          <h2 className="mb-0">Daily Task Management</h2>
        </div>
        <div className="col-12 col-md-6 text-md-end">
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </div>
          <div>
            <strong>ID:</strong> {user?.employeeId || 'Loading...'} &nbsp;&nbsp;
            <strong>Name:</strong> {user?.name || 'Loading...'} &nbsp;&nbsp;
            <strong>Designation:</strong> {user?.designation || 'Loading...'}
          </div>
        </div>
      </div>

      {/* Timecard Info */}
      <div className="row mb-3">
        <div className="col-12 d-flex flex-wrap gap-2">
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

      {/* Task Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark text-center">
            <tr>
              <th scope="col">Serial No</th>
              <th scope="col">Details</th>
              <th scope="col">Start Time</th>
              <th scope="col">End Time</th>
              <th scope="col">Status</th>
              <th scope="col">Remarks</th>
              <th scope="col">Link</th>
              <th scope="col">Feedback</th>
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
                    disabled={task.isSaved}
                    placeholder={task.isSaved ? "Task details locked" : "Enter task details"}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="form-control form-control-sm"
                    value={task.startTime}
                    disabled
                    title="Start time is automatically set"
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
                    disabled={task.isSaved}
                    title={task.isSaved ? "End time cannot be changed after saving" : ""}
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
                    disabled={task.isSaved}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.link}
                    onChange={(e) => handleChange(idx, "link", e.target.value)}
                    disabled={task.isSaved}
                  />
                </td>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={task.feedback}
                    onChange={(e) =>
                      handleChange(idx, "feedback", e.target.value)
                    }
                    disabled={task.isSaved}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          className="btn btn-primary"
          onClick={addTask}
        >
          + Add Task
        </button>
        <button
          className="btn btn-warning"
          onClick={updateTask}
        >
          Update
        </button>
        <button
          className="btn btn-success"
          onClick={saveTasks}
        >
          Save
        </button>
        <button
          className="btn btn-secondary"
          onClick={generateMonthlyReport}
        >
          Generate Report
        </button>
      </div>
    </div>
   </Layout>
  );
}
