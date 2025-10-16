"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";
import { makeAuthenticatedRequest } from "../utilis/tokenManager";

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
  const [breaks, setBreaks] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
      const res = await makeAuthenticatedRequest(`/api/Employee/${empId}`);
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
    const res = await makeAuthenticatedRequest(`/api/timecard?employeeId=${employeeId}`);
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
      setBreaks(today.breaks || []);
      const ongoingBreak = (today.breaks || []).find(b => b.breakOut && !b.breakIn);
      setIsOnBreak(!!ongoingBreak);
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
        await makeAuthenticatedRequest("/api/timecard", {
          method: "PUT",
          body: JSON.stringify({ 
            _id: incompleteTimecard._id, 
            logOut: "23:59",
            logoutDate: yesterdayStr
          }),
        });
      }
      
      // Auto-create entry with login time when employee accesses the page
      const newEntry = { employeeId, date: getDateString(), logIn: getTimeString() };
      const res2 = await makeAuthenticatedRequest("/api/timecard", {
        method: "POST",
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
    const res = await makeAuthenticatedRequest("/api/timecard", {
      method: "PUT",
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
      setSuccessMessage("Cannot take lunch break after logout");
      setShowSuccess(true);
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
      setSuccessMessage("Cannot return from lunch after logout");
      setShowSuccess(true);
      return;
    }
    
    if (current?.lunchOut && !current?.lunchIn) {
      updateTimecard({ lunchIn: getTimeString() });
      setIsLunchActive(false);
    }
  };
  




  const handleSavePermission = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot add permission after logout");
      setShowSuccess(true);
      return;
    }
    if (permission > 2) {
      setSuccessMessage("Permission cannot exceed 2 hours");
      setShowSuccess(true);
      return;
    }
    if (!reason.trim()) {
      setSuccessMessage("Please provide a reason for permission");
      setShowSuccess(true);
      return;
    }
    updateTimecard({ permission, reason });
    setPermissionLocked(true);
  };

  const handleBreakOut = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot take break after logout");
      setShowSuccess(true);
      return;
    }
    if (isOnBreak) {
      setSuccessMessage("Already on break");
      setShowSuccess(true);
      return;
    }
    if (breaks.length >= 3) {
      setSuccessMessage("Maximum 3 breaks allowed per day");
      setShowSuccess(true);
      return;
    }
    if (!breakReason.trim()) {
      setSuccessMessage("Please provide a reason for break");
      setShowSuccess(true);
      return;
    }
    
    const newBreak = {
      breakOut: getTimeString(),
      reason: breakReason
    };
    const updatedBreaks = [...breaks, newBreak];
    setBreaks(updatedBreaks);
    setIsOnBreak(true);
    setBreakReason("");
    updateTimecard({ breaks: updatedBreaks });
  };

  const handleBreakIn = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot return from break after logout");
      setShowSuccess(true);
      return;
    }
    if (!isOnBreak) {
      setSuccessMessage("Not currently on break");
      setShowSuccess(true);
      return;
    }
    
    const updatedBreaks = breaks.map((b, index) => 
      index === breaks.length - 1 && !b.breakIn 
        ? { ...b, breakIn: getTimeString() }
        : b
    );
    setBreaks(updatedBreaks);
    setIsOnBreak(false);
    updateTimecard({ breaks: updatedBreaks });
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
        {showSuccess && (
          <SuccessMessage 
            message={successMessage} 
            onClose={() => setShowSuccess(false)} 
          />
        )}
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
        <div className="card mb-3">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">Today&apos;s Timecard</h5>
            {/* First Row */}
            <div className="row g-4">
              {/* 1st Column - Login/Logout */}
              <div className="col-md-6">
                <div className="card h-100 border-primary">
                  <div className="card-body p-3">
                    <div className="text-center mb-3">
                      <i className="fas fa-clock text-primary fs-4"></i>
                      <h6 className="fw-bold text-primary mt-2">Login / Logout</h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-bold mb-2 text-success">Login Time</label>
                        <input type="text" className="form-control fw-bold text-center" value={current?.logIn || "-"} readOnly />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold mb-2 text-danger">Logout Time</label>
                        <input type="text" className="form-control fw-bold text-center mb-2" value={current?.logOut || "-"} readOnly />
                        <button onClick={handleLogOut} disabled={!!current?.logOut} className="btn btn-danger btn-sm w-100">
                          <i className="fas fa-power-off me-1"></i>Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 2nd Column - Lunch */}
              <div className="col-md-6">
                <div className="card h-100 border-warning">
                  <div className="card-body p-3">
                    <div className="text-center mb-3">
                      <i className="fas fa-utensils text-warning fs-4"></i>
                      <h6 className="fw-bold text-warning mt-2">Lunch Break</h6>
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-bold mb-2">Lunch Out</label>
                        <input type="text" className="form-control fw-bold text-center mb-2" value={current?.lunchOut || "-"} readOnly />
                        <button className="btn btn-warning btn-sm w-100" onClick={handleLunchOut} disabled={!!current?.lunchOut || !!current?.logOut}>
                          <i className="fas fa-utensils me-1"></i>Go Out
                        </button>
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold mb-2">Lunch In</label>
                        <input type="text" className="form-control fw-bold text-center mb-2" value={current?.lunchIn || "-"} readOnly />
                        <button className="btn btn-success btn-sm w-100" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn || !!current?.logOut}>
                          <i className="fas fa-arrow-left me-1"></i>Come In
                        </button>
                      </div>
                    </div>
                    {isLunchActive && (
                      <div className="text-center mt-2">
                        <div className="badge bg-warning text-dark">
                          <i className="fas fa-clock me-1"></i>On Lunch: {formatDuration(lunchDuration)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Second Row */}
            <div className="row g-4 mt-3">
              {/* 1st Column - Break */}
              <div className="col-md-6">
                <div className="card h-100 border-info">
                  <div className="card-body p-3">
                    <div className="text-center mb-3">
                      <i className="fas fa-coffee text-info fs-4"></i>
                      <h6 className="fw-bold text-info mt-2">Break ({breaks.length}/3)</h6>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold mb-2">Break Reason</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={breakReason} 
                        onChange={(e) => setBreakReason(e.target.value)}
                        disabled={isOnBreak || breaks.length >= 3 || !!current?.logOut}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <button 
                          onClick={handleBreakOut} 
                          className="btn btn-warning btn-sm w-100" 
                          disabled={isOnBreak || breaks.length >= 3 || !breakReason.trim() || !!current?.logOut}
                        >
                          <i className="fas fa-pause me-1"></i>Break Out
                        </button>
                      </div>
                      <div className="col-6">
                        <button 
                          onClick={handleBreakIn} 
                          className="btn btn-success btn-sm w-100" 
                          disabled={!isOnBreak || !!current?.logOut}
                        >
                          <i className="fas fa-play me-1"></i>Break In
                        </button>
                      </div>
                    </div>
                    {isOnBreak && (
                      <div className="text-center mt-2">
                        <div className="badge bg-info">
                          <i className="fas fa-clock me-1"></i>On Break
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 2nd Column - Permission */}
              <div className="col-md-6">
                <div className="card h-100 border-secondary">
                  <div className="card-body p-3">
                    <div className="text-center mb-3">
                      <i className="fas fa-user-clock text-secondary fs-4"></i>
                      <h6 className="fw-bold text-secondary mt-2">Permission Request</h6>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold mb-2">Hours</label>
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
                      <label className="form-label fw-bold mb-2">Reason</label>
                      <textarea 
                        className="form-control" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        disabled={permissionLocked || !!current?.logOut}
                        rows="2"
                        placeholder="Enter reason"
                      />
                    </div>
                    <button onClick={handleSavePermission} className="btn btn-primary btn-sm w-100" disabled={permissionLocked || !reason.trim() || !!current?.logOut}>
                      <i className="fas fa-save me-1"></i>Save Permission
                    </button>
                  </div>
                </div>
              </div>
            </div>

            
            {/* Break Records */}
            {breaks.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold mb-3">Today&apos;s Breaks</h6>
                <div className="table-responsive">
                  <table className="table table-bordered mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="fw-bold py-3">Break Out</th>
                        <th className="fw-bold py-3">Break In</th>
                        <th className="fw-bold py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaks.map((breakItem, index) => (
                        <tr key={index}>
                          <td className="fw-bold py-2">{breakItem.breakOut}</td>
                          <td className="fw-bold py-2">{breakItem.breakIn || "On Break"}</td>
                          <td className="py-2">{breakItem.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                    <th>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timecards.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-muted">
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
