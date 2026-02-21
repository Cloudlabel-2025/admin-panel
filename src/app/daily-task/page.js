"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

const STATUS_OPTIONS = ["In Progress", "Completed", "Pending", "On Hold", "Blocked"];
const STATUS_COLORS = {
  "In Progress": "primary",
  "Completed": "success",
  "Pending": "warning",
  "On Hold": "secondary",
  "Blocked": "danger"
};

const STATUS_ICONS = {
  "In Progress": "hourglass-split",
  "Completed": "check-circle-fill",
  "Pending": "clock",
  "On Hold": "pause-circle",
  "Blocked": "x-circle-fill"
};

export default function DailyTaskComponent() {
  const [dailyTasks, setDailyTasks] = useState([]);
  const [timecard, setTimecard] = useState({
    logIn: "",
    logOut: "",
    lunchOut: "",
    lunchIn: "",
    permissionMinutes: 0,
    permissionLocked: false
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
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
        breaks: todayTimecard.breaks || [],
        permissionMinutes: todayTimecard.permissionMinutes || 0,
        permissionLocked: todayTimecard.permissionLocked || false
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
      setError("Failed to load tasks. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const employeeId = localStorage.getItem("employeeId");

    if (!userRole || !employeeId) {
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
          ? `Lunch Out: ${timecard.lunchOut || "--:--"}, Lunch In: ${timecard.lunchIn || "--:--"
          }`
          : task.remarks,
      }))
    );
  }, [timecard]);

  // Validate task before saving
  const validateTask = (task, index) => {
    const errors = {};
    if (!task.details || task.details.trim() === "") {
      errors[`details_${index}`] = "Task details are required";
    } else if (task.details.trim().length < 25) {
      errors[`details_${index}`] = "Task details must be at least 25 characters";
    }
    if (!task.startTime) {
      errors[`startTime_${index}`] = "Start time is required";
    }
    if (!task.endTime) {
      errors[`endTime_${index}`] = "End time is required";
    }
    // Skip time validation for login/logout entries
    const isLoginLogout = task.details?.includes('Logged in at') || task.details?.includes('Logged out at') || task.isLogout;
    if (!isLoginLogout && task.startTime && task.endTime && task.startTime >= task.endTime) {
      errors[`endTime_${index}`] = "End time must be after start time";
    }
    return errors;
  };

  // Add new task
  const addTask = () => {
    // Check if last task has task name entered with minimum 25 characters
    if (dailyTasks.length > 0) {
      const lastTask = dailyTasks[dailyTasks.length - 1];
      if (!lastTask.details || lastTask.details.trim() === '') {
        setError('Please enter task name for the current task before adding a new one.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      if (lastTask.details.trim().length < 25) {
        setError('Task name must be at least 25 characters. Current task has only ' + lastTask.details.trim().length + ' characters.');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    // Prevent adding tasks during active permission
    if (timecard.permissionMinutes > 0 && !timecard.permissionLocked) {
      setError('Cannot add tasks during active permission. Please lock or cancel the permission first.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    const updatedTasks = [...dailyTasks];
    let newTaskStartTime = currentTime;

    // Update previous task's end time if it's empty
    if (updatedTasks.length > 0) {
      const lastIndex = updatedTasks.length - 1;
      const lastTask = updatedTasks[lastIndex];
      
      if (!lastTask.endTime && !lastTask.isSaved) {
        // Only update if current time is different from start time
        if (lastTask.startTime !== currentTime) {
          lastTask.endTime = currentTime;
          lastTask.status = 'Completed';
          newTaskStartTime = currentTime;
        } else {
          // If same time, don't allow adding new task
          setError('Cannot add new task at the same time as previous task. Please wait.');
          setTimeout(() => setError(''), 3000);
          return;
        }
      } else if (lastTask.endTime) {
        // Use last task's end time as new task's start time
        newTaskStartTime = lastTask.endTime;
      }
    }

    const newTask = {
      Serialno: updatedTasks.length + 1,
      details: "",
      startTime: "",
      endTime: "",
      status: "In Progress",
      remarks: "",
      link: "",
      feedback: "",
      isNewTask: true,
      isSaved: false,
      createdAt: new Date().toISOString()
    };

    setDailyTasks([...updatedTasks, newTask]);
    setValidationErrors({});
  };

  // Update task (push to database)
  const updateTask = async () => {
    if (!user || dailyTasks.length === 0) {
      setError('No tasks to update');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check if all tasks have task names with minimum 25 characters
    const invalidTasks = dailyTasks.filter(t => !t.details || t.details.trim() === '' || t.details.trim().length < 25);
    if (invalidTasks.length > 0) {
      setError('Cannot update. All tasks must have task names with at least 25 characters.');
      setTimeout(() => setError(''), 3000);
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
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setError('');
      } else {
        const errorData = await response.json();
        setError('Update failed: ' + (errorData.error || 'Unknown error'));
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Update failed:', err);
      setError('Error updating tasks');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Handle input changes (local state only)
  const handleChange = (index, field, value) => {
    const updated = [...dailyTasks];
    const task = updated[index];

    // Prevent editing saved tasks except status
    if (task.isSaved && field !== 'status') {
      setError('Saved tasks can only have their status updated.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Prevent editing start time and end time (system controlled)
    if (field === 'startTime' || field === 'endTime') {
      setError('Start and end times are automatically tracked and cannot be edited.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Set start time when task name is first entered
    if (field === 'details' && value.trim() !== '' && !task.startTime) {
      const currentTime = new Date().toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Use previous task's end time or current time
      if (index > 0 && updated[index - 1].endTime) {
        updated[index].startTime = updated[index - 1].endTime;
      } else {
        updated[index].startTime = currentTime;
      }
    }

    updated[index][field] = value;
    setDailyTasks(updated);

    // Clear validation error for this field
    const errorKey = `${field}_${index}`;
    if (validationErrors[errorKey]) {
      const newErrors = { ...validationErrors };
      delete newErrors[errorKey];
      setValidationErrors(newErrors);
    }
  };



  // Delete task
  const deleteTask = (index) => {
    const task = dailyTasks[index];
    if (task.isSaved) {
      setError('Cannot delete saved tasks');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updated = [...dailyTasks];
    // If deleting a task that has a next task, update next task's start time
    if (index < updated.length - 1 && !updated[index + 1].isSaved) {
      const prevTask = index > 0 ? updated[index - 1] : null;
      updated[index + 1].startTime = prevTask?.endTime || updated[index].startTime;
    }

    // Remove the task
    const filtered = updated.filter((_, i) => i !== index);
    // Renumber tasks
    const renumbered = filtered.map((t, i) => ({ ...t, Serialno: i + 1 }));
    setDailyTasks(renumbered);
  };

  // Save tasks (mark as final)
  const saveTasks = async () => {
    try {
      if (!dailyTasks.length) {
        setError("No tasks to save");
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Check if all tasks have task names with minimum 25 characters
      const invalidTasks = dailyTasks.filter(t => !t.details || t.details.trim() === '' || t.details.trim().length < 25);
      if (invalidTasks.length > 0) {
        setError('Cannot save. All tasks must have task names with at least 25 characters.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Validate all tasks
      let allErrors = {};
      dailyTasks.forEach((task, index) => {
        const errors = validateTask(task, index);
        allErrors = { ...allErrors, ...errors };
      });

      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors);
        setError('Please fix validation errors before saving');
        setTimeout(() => setError(''), 3000);
        return;
      }

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
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setDailyTasks(tasksToSave);
        setValidationErrors({});
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save tasks");
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error saving tasks");
      setTimeout(() => setError(''), 3000);
    }
  };

  // Calculate task duration
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "--";
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diff = endMinutes - startMinutes;
    if (diff < 0) return "Invalid";
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  // Generate Monthly Excel Report
  const generateMonthlyReport = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const res = await fetch(`/api/daily-task?employeeId=${user.employeeId}&month=${month}&year=${year}`);

      if (!res.ok) {
        setError('Failed to generate report');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const data = await res.json();

      if (!data.length) {
        setError('No tasks found for this month');
        setTimeout(() => setError(''), 3000);
        return;
      }

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
            Duration: calculateDuration(t.startTime, t.endTime),
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
      XLSX.writeFile(wb, `MonthlyTasks_${user.employeeId}_${month}_${year}.xlsx`);
    } catch (err) {
      console.error(err);
      setError('Error generating report');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Calculate time gaps between tasks (potential idle time)
  const calculateTimeGaps = () => {
    const gaps = [];
    for (let i = 0; i < dailyTasks.length - 1; i++) {
      const currentTask = dailyTasks[i];
      const nextTask = dailyTasks[i + 1];

      if (currentTask.endTime && nextTask.startTime) {
        const [endHour, endMin] = currentTask.endTime.split(':').map(Number);
        const [startHour, startMin] = nextTask.startTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMin;
        const startMinutes = startHour * 60 + startMin;
        const gapMinutes = startMinutes - endMinutes;

        if (gapMinutes > 0) {
          gaps.push({
            afterTask: i + 1,
            beforeTask: i + 2,
            gapMinutes: gapMinutes,
            gapTime: `${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60}m`
          });
        }
      }
    }
    return gaps;
  };

  // Calculate productivity metrics
  const calculateProductivityMetrics = () => {
    if (!timecard.logIn || dailyTasks.length === 0) return null;

    const [loginHour, loginMin] = timecard.logIn.split(':').map(Number);
    const loginMinutes = loginHour * 60 + loginMin;

    const currentTime = new Date();
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    const logoutMinutes = timecard.logOut ?
      (() => {
        const [h, m] = timecard.logOut.split(':').map(Number);
        return h * 60 + m;
      })() : currentMinutes;

    const totalWorkMinutes = logoutMinutes - loginMinutes;

    // Calculate lunch duration
    let lunchMinutes = 0;
    let unaccountedLunchTime = 0;
    if (timecard.lunchOut && timecard.lunchIn) {
      const [lunchOutH, lunchOutM] = timecard.lunchOut.split(':').map(Number);
      const [lunchInH, lunchInM] = timecard.lunchIn.split(':').map(Number);
      lunchMinutes = (lunchInH * 60 + lunchInM) - (lunchOutH * 60 + lunchOutM);
      unaccountedLunchTime = lunchMinutes > 60 ? lunchMinutes - 60 : 0;
    }

    // Calculate break duration
    let totalBreakMinutes = 0;
    let unaccountedBreakTime = 0;
    if (timecard.breaks && Array.isArray(timecard.breaks)) {
      timecard.breaks.forEach(b => {
        if (b.breakOut && b.breakIn) {
          const breakDuration = ((b.breakIn.split(':').map(Number)[0] * 60 + b.breakIn.split(':').map(Number)[1]) - 
                                (b.breakOut.split(':').map(Number)[0] * 60 + b.breakOut.split(':').map(Number)[1]));
          totalBreakMinutes += breakDuration;
          if (breakDuration > 30) {
            unaccountedBreakTime += breakDuration - 30;
          }
        }
      });
    }

    // Permission handling - exclude from work time, only excess goes to unaccounted
    const permissionMinutes = timecard.permissionMinutes || 0;
    const PERMISSION_LIMIT = 120; // 2 hours
    const excessPermissionTime = permissionMinutes > PERMISSION_LIMIT ? permissionMinutes - PERMISSION_LIMIT : 0;

    // Calculate total task time from daily tasks
    let totalTaskMinutes = 0;
    dailyTasks.forEach(task => {
      if (task.startTime && task.endTime) {
        const [startH, startM] = task.startTime.split(':').map(Number);
        const [endH, endM] = task.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        if (duration > 0) totalTaskMinutes += duration;
      }
    });

    // Calculate gaps between tasks
    const gaps = calculateTimeGaps();
    const totalGapMinutes = gaps.reduce((sum, gap) => sum + gap.gapMinutes, 0);

    // Effective work time (excluding standard lunch, break, and ALL permission time)
    const standardLunchTime = Math.min(lunchMinutes, 60);
    const standardBreakTime = Math.min(totalBreakMinutes, 30);
    const effectiveWorkMinutes = totalWorkMinutes - standardLunchTime - standardBreakTime - permissionMinutes;
    
    // Unaccounted time = effective work - (task time + gaps) + excess lunch + excess break + excess permission
    const accountedMinutes = totalTaskMinutes + totalGapMinutes;
    const unaccountedMinutes = Math.max(0, effectiveWorkMinutes - accountedMinutes + unaccountedLunchTime + unaccountedBreakTime + excessPermissionTime);

    const productivityRate = effectiveWorkMinutes > 0 ?
      ((totalTaskMinutes / effectiveWorkMinutes) * 100).toFixed(1) : 0;

    return {
      totalWorkMinutes,
      lunchMinutes,
      permissionMinutes,
      effectiveWorkMinutes,
      totalTaskMinutes,
      totalGapMinutes,
      unaccountedMinutes,
      unaccountedLunchTime,
      unaccountedBreakTime,
      excessPermissionTime,
      productivityRate,
      gaps
    };
  };

  // Calculate task statistics
  const getTaskStats = () => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter(t => t.status === "Completed").length;
    const inProgress = dailyTasks.filter(t => t.status === "In Progress").length;
    const pending = dailyTasks.filter(t => t.status === "Pending").length;
    const saved = dailyTasks.filter(t => t.isSaved).length;
    return { total, completed, inProgress, pending, saved };
  };

  if (loading || !user) return (
    <Layout>
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading daily tasks...</p>
        </div>
      </div>
    </Layout>
  );

  const stats = getTaskStats();
  const productivity = calculateProductivityMetrics();
  const timeGaps = calculateTimeGaps();

  const formatMinutes = (minutes) => {
    if (minutes < 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Layout>
      <div className="container-fluid mt-3 px-2 px-md-4" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        {/* Header Section */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3">
                <div className="row align-items-center">
                  <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                    <h2 className="mb-1 fs-4 fs-md-3"><i className="bi bi-clipboard-check me-2"></i>Daily Task Management</h2>
                    <p className="text-muted mb-0 small">Track your daily work progress</p>
                  </div>
                  <div className="col-12 col-lg-6 text-lg-end">
                    <div className="mb-2">
                      <span className="badge bg-dark d-inline-block" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-calendar3 me-1"></i>
                        <span className="d-none d-sm-inline">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="d-inline d-sm-none">{new Date().toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="small">
                      <div className="d-block d-sm-inline"><strong>ID:</strong> {user?.employeeId}</div>
                      <span className="d-none d-sm-inline"> | </span>
                      <div className="d-block d-sm-inline"><strong>Name:</strong> {user?.name}</div>
                      <span className="d-none d-sm-inline"> | </span>
                      <div className="d-block d-sm-inline"><strong>Role:</strong> {user?.designation}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="row mb-3 mb-md-4 g-2 g-md-3">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-2 p-md-3">
                <i className="bi bi-list-task fs-3 fs-md-1 text-primary"></i>
                <h3 className="mt-1 mt-md-2 mb-0 fs-5 fs-md-3">{stats.total}</h3>
                <p className="text-muted mb-0 small">Total Tasks</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-2 p-md-3">
                <i className="bi bi-check-circle fs-3 fs-md-1 text-success"></i>
                <h3 className="mt-1 mt-md-2 mb-0 fs-5 fs-md-3">{stats.completed}</h3>
                <p className="text-muted mb-0 small">Completed</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-2 p-md-3">
                <i className="bi bi-hourglass-split fs-3 fs-md-1 text-warning"></i>
                <h3 className="mt-1 mt-md-2 mb-0 fs-5 fs-md-3">{stats.inProgress}</h3>
                <p className="text-muted mb-0 small">In Progress</p>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center p-2 p-md-3">
                <i className="bi bi-save fs-3 fs-md-1 text-info"></i>
                <h3 className="mt-1 mt-md-2 mb-0 fs-5 fs-md-3">{stats.saved}</h3>
                <p className="text-muted mb-0 small">Saved Tasks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timecard Info */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3">
                <h6 className="mb-3 fs-6"><i className="bi bi-clock-history me-2"></i>Today&apos;s Timecard</h6>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-primary p-2 flex-grow-1 flex-sm-grow-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>Log In: {timecard.logIn || "--:--"}
                  </span>
                  <span className="badge bg-success p-2 flex-grow-1 flex-sm-grow-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-box-arrow-right me-1"></i>Log Out: {timecard.logOut || "--:--"}
                  </span>
                  <span className="badge bg-warning text-dark p-2 flex-grow-1 flex-sm-grow-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-cup-hot me-1"></i>Lunch Out: {timecard.lunchOut || "--:--"}
                  </span>
                  <span className="badge bg-info text-dark p-2 flex-grow-1 flex-sm-grow-0" style={{ fontSize: '0.85rem' }}>
                    <i className="bi bi-cup-hot-fill me-1"></i>Lunch In: {timecard.lunchIn || "--:--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Metrics */}
        {productivity && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                  <h6 className="mb-3 fs-6"><i className="bi bi-graph-up me-2"></i>Productivity Analysis</h6>
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="fs-5 fw-bold text-primary">{formatMinutes(productivity.effectiveWorkMinutes)}</div>
                        <small className="text-muted">Work Time</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="fs-5 fw-bold text-success">{formatMinutes(productivity.totalTaskMinutes)}</div>
                        <small className="text-muted">Task Time</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="fs-5 fw-bold text-warning">{formatMinutes(productivity.totalGapMinutes)}</div>
                        <small className="text-muted">Gaps</small>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="text-center p-2 bg-light rounded">
                        <div className="fs-5 fw-bold text-danger">{formatMinutes(productivity.unaccountedMinutes)}</div>
                        <small className="text-muted">Unaccounted</small>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small">Productivity Rate</span>
                      <span className="badge bg-primary">{productivity.productivityRate}%</span>
                    </div>
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className={`progress-bar ${productivity.productivityRate >= 80 ? 'bg-success' : productivity.productivityRate >= 60 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${productivity.productivityRate}%` }}
                      >
                        {productivity.productivityRate}%
                      </div>
                    </div>
                  </div>
                  {productivity.unaccountedMinutes > 15 && (
                    <div className="alert alert-warning mt-3 mb-0 py-2" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <small>You have {formatMinutes(productivity.unaccountedMinutes)} of unaccounted time. Please add tasks to track your work.</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Gaps Alert */}
        {timeGaps.length > 0 && (
          <div className="row mb-3">
            <div className="col-12">
              <div className="card border-0 shadow-sm border-start border-warning border-4">
                <div className="card-body p-3">
                  <h6 className="mb-2 fs-6 text-warning"><i className="bi bi-clock me-2"></i>Time Gaps Detected</h6>
                  <small className="text-muted d-block mb-2">Gaps between tasks may indicate idle time or breaks</small>
                  <div className="d-flex flex-wrap gap-2">
                    {timeGaps.map((gap, idx) => (
                      <span key={idx} className="badge bg-warning text-dark p-2" style={{ fontSize: '0.8rem' }}>
                        Between Task {gap.afterTask} & {gap.beforeTask}: {gap.gapTime}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Table */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white p-3">
                <h5 className="mb-0 fs-6 fs-md-5"><i className="bi bi-table me-2"></i>Task List</h5>
              </div>
              <div className="card-body p-0">
                <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '1200px' }}>
                    <thead className="table-dark text-center">
                      <tr>
                        <th scope="col" style={{ minWidth: '60px' }}>S.No</th>
                        <th scope="col" style={{ minWidth: '250px' }}>Task Details *</th>
                        <th scope="col" style={{ minWidth: '120px' }}>Start Time *</th>
                        <th scope="col" style={{ minWidth: '120px' }}>End Time *</th>
                        <th scope="col" style={{ minWidth: '100px' }}>Duration</th>
                        <th scope="col" style={{ minWidth: '150px' }}>Status</th>
                        <th scope="col" style={{ minWidth: '200px' }}>Remarks</th>
                        <th scope="col" style={{ minWidth: '200px' }}>Link</th>
                        <th scope="col" style={{ minWidth: '200px' }}>Feedback</th>
                        <th scope="col" style={{ minWidth: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyTasks.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center py-4">
                            <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                            <p className="text-muted mb-0">No tasks added yet. Click &quot;Add Task&quot; to get started.</p>
                          </td>
                        </tr>
                      ) : (
                        dailyTasks.map((task, idx) => (
                          <tr key={idx} className={task.isSaved ? 'table-light' : ''}>
                            <td className="text-center">
                              <span className="badge bg-secondary">{task.Serialno}</span>
                            </td>
                            <td>
                              <textarea
                                className={`form-control form-control-sm ${validationErrors[`details_${idx}`] ? 'is-invalid' : ''}`}
                                value={task.details}
                                onChange={(e) => handleChange(idx, "details", e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.key === 'Tab' || e.key === 'Enter') && (!task.details || task.details.trim() === '')) {
                                    e.preventDefault();
                                    setError('Task name is mandatory. Please enter task details before moving to next field.');
                                    setTimeout(() => setError(''), 3000);
                                  }
                                }}
                                disabled={task.isSaved}
                                placeholder={task.isSaved ? "Task details locked" : "Enter task details (Required - Min 25 characters)"}
                                rows="2"
                                required
                              />
                              {validationErrors[`details_${idx}`] && (
                                <div className="invalid-feedback">{validationErrors[`details_${idx}`]}</div>
                              )}
                            </td>
                            <td>
                              <input
                                type="time"
                                className={`form-control form-control-sm ${validationErrors[`startTime_${idx}`] ? 'is-invalid' : ''}`}
                                value={task.startTime}
                                disabled
                                title="Start time is automatically set"
                              />
                              {validationErrors[`startTime_${idx}`] && (
                                <div className="invalid-feedback">{validationErrors[`startTime_${idx}`]}</div>
                              )}
                            </td>
                            <td>
                              <input
                                type="time"
                                className={`form-control form-control-sm ${validationErrors[`endTime_${idx}`] ? 'is-invalid' : ''}`}
                                value={task.endTime}
                                disabled
                                title="End time is automatically set when you add next task or save"
                              />
                              {validationErrors[`endTime_${idx}`] && (
                                <div className="invalid-feedback">{validationErrors[`endTime_${idx}`]}</div>
                              )}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-info text-dark">
                                {calculateDuration(task.startTime, task.endTime)}
                              </span>
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={task.status}
                                onChange={(e) => handleChange(idx, "status", e.target.value)}
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                              <span className={`badge bg-${STATUS_COLORS[task.status]} mt-1 w-100`}>
                                {task.status}
                              </span>
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={task.remarks}
                                onChange={(e) => handleChange(idx, "remarks", e.target.value)}
                                disabled={task.isSaved}
                                placeholder="Add remarks"
                                rows="2"
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={task.link}
                                onChange={(e) => handleChange(idx, "link", e.target.value)}
                                disabled={task.isSaved}
                                placeholder="Add link"
                              />
                              {task.link && (
                                <a href={task.link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link p-0 mt-1">
                                  <i className="bi bi-box-arrow-up-right"></i> Open
                                </a>
                              )}
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                value={task.feedback}
                                onChange={(e) => handleChange(idx, "feedback", e.target.value)}
                                disabled={task.isSaved}
                                placeholder="Add feedback"
                                rows="2"
                              />
                            </td>
                            <td className="text-center">
                              {!task.isSaved && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => deleteTask(idx)}
                                  title="Delete task"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                              {task.isSaved && (
                                <span className="badge bg-success">
                                  <i className="bi bi-lock-fill"></i>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3">
                <div className="d-flex flex-wrap gap-2" style={{ width: '100%' }}>
                  <button
                    className="btn btn-primary"
                    onClick={addTask}
                    style={{ flex: '1 1 auto', minWidth: '100px' }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Add Task
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={updateTask}
                    disabled={dailyTasks.length === 0}
                    style={{ flex: '1 1 auto', minWidth: '100px' }}
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>Update
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={saveTasks}
                    disabled={dailyTasks.length === 0}
                    style={{ flex: '1 1 auto', minWidth: '100px' }}
                  >
                    <i className="bi bi-save me-2"></i>Save
                  </button>
                  <button
                    className="btn btn-info"
                    onClick={generateMonthlyReport}
                    style={{ flex: '1 1 auto', minWidth: '100px' }}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>Report
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={fetchData}
                    style={{ flex: '1 1 auto', minWidth: '100px' }}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>Refresh
                  </button>
                </div>
                <div className="mt-3">
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Note:</strong> Update saves temporarily. Save locks tasks.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SuccessMessage
          show={showSuccess}
          message="Tasks saved successfully!"
          onClose={() => setShowSuccess(false)}
        />
      </div>
    </Layout>
  );
}
