"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";

export default function TimecardPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState(null);
  const [timecards, setTimecards] = useState([]);
  const [current, setCurrent] = useState(null);

  const [stats, setStats] = useState({
    totalDays: 0,
    totalHours: 0,
    avgHours: 0,
    presentDays: 0,
    absentDays: 0,
    permissionDays: 0,
    overtimeHours: 0
  });
  const [isLunchActive, setIsLunchActive] = useState(false);
  const [lunchDuration, setLunchDuration] = useState(0);
  const [permission, setPermission] = useState(0);
  const [reason, setReason] = useState("");
  const [permissionLocked, setPermissionLocked] = useState(false);

  // Helpers
  const getTimeString = () =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const getDateString = () => new Date().toISOString().split("T")[0];
  
  // Convert time string to minutes for calculation
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };
  
  // Convert minutes to HH:MM format
  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
    return d.toLocaleDateString("en-GB") + ` (${dayName})`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    // Allow all employee roles to access timecard
    if (!role || !empId || role === "super-admin" || role === "Super-admin") {
      router.push("/");
      return;
    }
    setEmployeeId(empId);
    fetchEmployeeData(empId);
  }, [router]);

  const fetchEmployeeData = async (empId) => {
    try {
      const res = await fetch(`/api/Employee/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployeeData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all records
  const fetchTimecards = async () => {
    if (!employeeId) return;
    const res = await fetch(`/api/timecard?employeeId=${employeeId}`);
    if (!res.ok) return;
    const data = await res.json();
    setTimecards(data);
    calculateStats(data);

    const today = data.find((t) => t.date?.startsWith(getDateString()));
    if (today) {
      setCurrent(today);
      setIsLunchActive(today.lunchOut && !today.lunchIn);
      setPermission(Number(today.permission) || 0);
      setReason(today.reason || "");
      if (today.permission && today.reason) {
        setPermissionLocked(true);
      }
      updateLunchDuration(today);
    } else {
      // Check for previous day's incomplete timecard and auto-logout
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      
      const incompleteTimecard = data.find((t) => 
        t.date?.startsWith(yesterdayStr) && t.logIn && !t.logOut
      );
      
      if (incompleteTimecard) {
        // Auto-logout previous day's timecard at end of that day (23:59)
        await fetch("/api/timecard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            _id: incompleteTimecard._id, 
            logOut: "23:59",
            logoutDate: yesterdayStr
          }),
        });
      }
      
      // Auto-create entry with login time when employee accesses the page
      const newEntry = { employeeId, date: getDateString(), logIn: getTimeString() };
      const res2 = await fetch("/api/timecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const data2 = await res2.json();
      if (data2.timecard) {
        setCurrent(data2.timecard);
        // Refresh timecards to show updated data
        fetchTimecards();
      }
    }
  };

  const calculateStats = (data) => {
    const totalDays = data.length;
    let totalMinutes = 0;
    let presentDays = 0;
    let absentDays = 0;
    let permissionDays = 0;
    let overtimeMinutes = 0;

    data.forEach(t => {
      const hours = calcTotalHours(t);
      
      if (hours !== "-") {
        const [h, m] = hours.split(":").map(Number);
        const minutes = h * 60 + m;
        totalMinutes += minutes;
        
        // Calculate attendance status based on actual hours worked
        if (h >= 8) {
          presentDays++;
        } else if (h >= 4) {
          presentDays++; // Half day counts as present
        } else {
          absentDays++;
        }
        
        // Calculate overtime
        if (h > 8) overtimeMinutes += minutes - 480; // 480 = 8 hours
      } else {
        absentDays++;
      }
    });

    setStats({
      totalDays,
      totalHours: (totalMinutes / 60).toFixed(1),
      avgHours: totalDays > 0 ? (totalMinutes / 60 / totalDays).toFixed(1) : 0,
      presentDays,
      absentDays,
      overtimeHours: (overtimeMinutes / 60).toFixed(1)
    });
  };

  const updateLunchDuration = (timecard) => {
    if (timecard?.lunchOut && timecard?.lunchIn) {
      const [loH, loM] = timecard.lunchOut.split(":").map(Number);
      const [liH, liM] = timecard.lunchIn.split(":").map(Number);
      const duration = (liH * 60 + liM) - (loH * 60 + loM);
      setLunchDuration(Math.max(0, duration));
    } else if (timecard?.lunchOut && !timecard?.lunchIn) {
      // Calculate ongoing lunch duration
      const [loH, loM] = timecard.lunchOut.split(":").map(Number);
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const lunchStart = loH * 60 + loM;
      setLunchDuration(Math.max(0, currentMinutes - lunchStart));
    } else {
      setLunchDuration(0);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchTimecards();
    }
  }, [employeeId]);

  // Update record
  const updateTimecard = async (updates) => {
    if (!current?._id) return;
    const res = await fetch("/api/timecard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: current._id, ...updates }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.timecard) {
      setCurrent(data.timecard);
      setTimecards((prev) =>
        prev.map((t) => (t._id === data.timecard._id ? data.timecard : t))
      );
    }
  };

  // Actions
  const handleLogOut = () => {
    // Rule 5: Logout finalizes the record - no more changes after this
    // Store logout date along with logout time for cross-date tracking
    const logoutData = { 
      logOut: getTimeString(),
      logoutDate: getDateString() // Track logout date separately
    };
    updateTimecard(logoutData);
  };
  
  const handleLunchOut = () => {
    // Rule 5: No lunch actions after logout
    if (current?.logOut) {
      alert("Cannot take lunch break after logout");
      return;
    }
    
    if (!current?.lunchOut) {
      updateTimecard({ lunchOut: getTimeString() });
      setIsLunchActive(true);
    }
  };
  
  const handleLunchIn = () => {
    // Rule 5: No lunch actions after logout
    if (current?.logOut) {
      alert("Cannot return from lunch after logout");
      return;
    }
    
    if (current?.lunchOut && !current?.lunchIn) {
      updateTimecard({ lunchIn: getTimeString() });
      setIsLunchActive(false);
    }
  };
  


  // Rule 6: Break Calculation - handle multiple breaks
  const handleBreakTime = () => {
    if (current?.logOut) {
      alert("Cannot add breaks after logout");
      return;
    }
    
    const breakTime = prompt("Enter break duration in minutes (e.g., 15 for 15 minutes):");
    if (breakTime && !isNaN(breakTime) && Number(breakTime) > 0) {
      const currentBreaks = current?.breakTime || 0;
      const totalBreaks = currentBreaks + Number(breakTime);
      updateTimecard({ breakTime: totalBreaks });
    }
  };

  const handleSavePermission = () => {
    if (current?.logOut) {
      alert("Cannot add permission after logout");
      return;
    }
    if (permission > 2) {
      alert("Permission cannot exceed 2 hours");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide a reason for permission");
      return;
    }
    updateTimecard({ permission, reason });
    setPermissionLocked(true);
  };

  // Enhanced hours calculation with system date-wise calculation
  const calcTotalHours = (t) => {
    // Rule 1: Login Time = Entry Time (automatically recorded)
    // Rule 5: Only count work between login and logout
    if (!t.logIn || !t.logOut) return "-";
    
    try {
      let loginMinutes = timeToMinutes(t.logIn);
      let logoutMinutes = timeToMinutes(t.logOut);
      
      // Check if logout happened on a different date
      const loginDate = new Date(t.date);
      const logoutDate = t.logoutDate ? new Date(t.logoutDate) : loginDate;
      
      // Calculate date difference in days
      const daysDiff = Math.floor((logoutDate - loginDate) / (1000 * 60 * 60 * 24));
      
      // If logout is on next day, add 24 hours per day difference
      if (daysDiff > 0) {
        logoutMinutes += daysDiff * 24 * 60;
      }
      // If logout time is less than login time on same date, add 24 hours
      else if (daysDiff === 0 && logoutMinutes < loginMinutes) {
        logoutMinutes += 24 * 60;
      }
      
      let totalWorked = logoutMinutes - loginMinutes;
      
      // Rule 2: Lunch Out/In Deduction - only if both values exist
      if (t.lunchOut && t.lunchIn) {
        let lunchOutMinutes = timeToMinutes(t.lunchOut);
        let lunchInMinutes = timeToMinutes(t.lunchIn);
        
        // Handle lunch break spanning to next day
        if (lunchInMinutes < lunchOutMinutes) {
          lunchInMinutes += 24 * 60;
        }
        
        const lunchDuration = lunchInMinutes - lunchOutMinutes;
        if (lunchDuration > 0) {
          totalWorked -= lunchDuration;
        }
      }
      
      // Rule 6: Break Calculation - subtract all breaks
      if (t.breakTime && !isNaN(t.breakTime)) {
        totalWorked -= Number(t.breakTime);
      }
      
      // Permission deduction (max 2 hours)
      if (t.permission && !isNaN(t.permission)) {
        const permissionMinutes = Math.min(Number(t.permission) * 60, 120); // Max 2 hours
        totalWorked -= permissionMinutes;
      }
      
      // Ensure non-negative result
      totalWorked = Math.max(0, totalWorked);
      
      return minutesToTime(totalWorked);
    } catch (error) {
      console.error('Error calculating hours:', error);
      return "-";
    }
  };

  // Rule 4: Status Classification based on total working hours
  const getWorkStatus = (t) => {
    const hours = calcTotalHours(t);
    if (hours === "-") return { status: "Incomplete", color: "secondary" };
    
    const [h, m] = hours.split(":").map(Number);
    const totalHours = h + (m / 60);
    
    // Rule 4: Status based on working hours
    if (totalHours >= 8) return { status: "Full Day", color: "success" };
    if (totalHours >= 4) return { status: "Half Day", color: "warning" };
    return { status: "Absent", color: "danger" }; // < 4 hrs = Absent
  };

  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Live time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (current?.lunchOut && !current?.lunchIn) {
        updateLunchDuration(current);
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [current]);

  // Export Excel
  const exportReport = () => {
    if (!timecards.length) return;
    const wsData = timecards.map((t) => ({
      Date: formatDate(t.date),
      LogIn: t.logIn || "-",
      LogOut: t.logOut || "-",
      LunchOut: t.lunchOut || "-",
      LunchIn: t.lunchIn || "-",
      Permission: t.permission ? `${t.permission} hr` : "-",
      Reason: t.reason || "-",
      Breaks: t.breakTime ? `${t.breakTime} min` : "-",
      TotalHours: calcTotalHours(t),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, "Monthly_Report.xlsx");
  };

  if (!employeeId) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>My Timecard</h2>
          <button onClick={exportReport} className="btn btn-success">
            Export Monthly Report
          </button>
        </div>

        {/* Employee Info */}
        {employeeData && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <p><strong>Name:</strong> {employeeData.firstName} {employeeData.lastName}</p>
                </div>
                <div className="col-md-3">
                  <p><strong>Employee ID:</strong> {employeeData.employeeId}</p>
                </div>
                <div className="col-md-3">
                  <p><strong>Department:</strong> {employeeData.department}</p>
                </div>
                <div className="col-md-3">
                  <p><strong>Today:</strong> {formatDate(new Date().toISOString())}</p>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Today's Timecard */}
        <div className="card mb-4">
          <div className="card-body">
            <h5>Today&apos;s Timecard</h5>
            <div className="row">
              <div className="col-md-6">
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Login Time</label>
                    <input type="text" className="form-control" value={current?.logIn || "-"} readOnly />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Logout Time</label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" value={current?.logOut || "-"} readOnly />
                      <button onClick={handleLogOut} disabled={!!current?.logOut} className="btn btn-danger">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Lunch Out</label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" value={current?.lunchOut || "-"} readOnly />
                      <button className="btn btn-warning" onClick={handleLunchOut} disabled={!!current?.lunchOut || !!current?.logOut}>
                        Lunch Out
                      </button>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Lunch In</label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" value={current?.lunchIn || "-"} readOnly />
                      <button className="btn btn-success" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn || !!current?.logOut}>
                        Lunch In
                      </button>
                    </div>
                  </div>
                </div>

                {isLunchActive && (
                  <div className="alert alert-warning">
                    <strong>Lunch Break Active:</strong> {formatDuration(lunchDuration)}
                  </div>
                )}
              </div>
              
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Permission Hours</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="2" 
                    step="0.5" 
                    className="form-control" 
                    value={permission} 
                    onChange={(e) => setPermission(Math.min(2, Math.max(0, Number(e.target.value))))}
                    disabled={permissionLocked || !!current?.logOut} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea 
                    className="form-control" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    disabled={permissionLocked || !!current?.logOut}
                    rows="2"
                  />
                </div>
                <div className="d-flex gap-2 mb-3">
                  <button onClick={handleSavePermission} className="btn btn-primary" disabled={permissionLocked || !reason.trim() || !!current?.logOut}>
                    Save Permission
                  </button>
                  <button onClick={handleBreakTime} className="btn btn-outline-secondary" disabled={!!current?.logOut}>
                    Add Break
                  </button>
                </div>
                {current?.breakTime > 0 && (
                  <div className="mb-3">
                    <span className="badge bg-info">
                      Total Breaks: {current.breakTime} min
                    </span>
                  </div>
                )}
                

              </div>
            </div>
          </div>
        </div>

        {/* Monthly Records */}
        <div className="card">
          <div className="card-body">
            <h5>Monthly Timecard Records</h5>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Login</th>
                    <th>Logout</th>
                    <th>Lunch Out</th>
                    <th>Lunch In</th>
                    <th>Permission</th>
                    <th>Reason</th>
                    <th>Breaks (min)</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center text-muted">
                        No timecard records found.
                      </td>
                    </tr>
                  )}
                  {timecards.map((t) => {
                    const workStatus = getWorkStatus(t);
                    return (
                      <tr key={t._id}>
                        <td>{formatDate(t.date)}</td>
                        <td>{t.logIn || "-"}</td>
                        <td>{t.logOut || "-"}</td>
                        <td>{t.lunchOut || "-"}</td>
                        <td>{t.lunchIn || "-"}</td>
                        <td>{t.permission ? `${t.permission}h` : "-"}</td>
                        <td>{t.reason || "-"}</td>
                        <td>{t.breakTime || "-"}</td>
                        <td className="fw-bold">{calcTotalHours(t)}</td>
                        <td>
                          <span className={`badge bg-${workStatus.color}`}>
                            {workStatus.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
