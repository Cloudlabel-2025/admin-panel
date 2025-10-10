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
  const [permission, setPermission] = useState(0);
  const [reason, setReason] = useState("");
  const [permissionLocked, setPermissionLocked] = useState(false);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalHours: 0,
    avgHours: 0,
    shortDays: 0,
    overtimeHours: 0
  });
  const [isLunchActive, setIsLunchActive] = useState(false);
  const [lunchDuration, setLunchDuration] = useState(0);

  // Helpers
  const getTimeString = () =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const getDateString = () => new Date().toISOString().split("T")[0];
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
    return d.toLocaleDateString("en-GB") + ` (${dayName})`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    if (role !== "employee" || !empId) {
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
      setPermission(Number(today.permission) || 0);
      setReason(today.reason || "");
      setIsLunchActive(today.lunchOut && !today.lunchIn);
      if (today.permission && today.reason) {
        setPermissionLocked(true);
      }
      updateLunchDuration(today);
    } else {
      const newEntry = { employeeId, date: getDateString(), logIn: getTimeString() };
      const res2 = await fetch("/api/timecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const data2 = await res2.json();
      if (data2.timecard) {
        setCurrent(data2.timecard);
        setTimecards([data2.timecard, ...data]);
      }
    }
  };

  const calculateStats = (data) => {
    const totalDays = data.length;
    let totalMinutes = 0;
    let shortDays = 0;
    let overtimeMinutes = 0;

    data.forEach(t => {
      const hours = calcTotalHours(t);
      if (hours !== "-") {
        const [h, m] = hours.split(":").map(Number);
        const minutes = h * 60 + m;
        totalMinutes += minutes;
        
        if (h < 8) shortDays++;
        if (h > 8) overtimeMinutes += minutes - 480; // 480 = 8 hours
      }
    });

    setStats({
      totalDays,
      totalHours: (totalMinutes / 60).toFixed(1),
      avgHours: totalDays > 0 ? (totalMinutes / 60 / totalDays).toFixed(1) : 0,
      shortDays,
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
    updateTimecard({ logOut: getTimeString() });
  };
  
  const handleLunchOut = () => {
    if (!current?.lunchOut) {
      updateTimecard({ lunchOut: getTimeString() });
      setIsLunchActive(true);
    }
  };
  
  const handleLunchIn = () => {
    if (current?.lunchOut && !current?.lunchIn) {
      updateTimecard({ lunchIn: getTimeString() });
      setIsLunchActive(false);
    }
  };
  
  const handleSavePermission = () => {
    if (permission > 2) {
      alert("Permission cannot exceed 2 hours");
      return;
    }
    updateTimecard({ permission, reason });
    setPermissionLocked(true);
  };

  const handleBreakTime = () => {
    const breakTime = prompt("Enter break duration in minutes:");
    if (breakTime && !isNaN(breakTime)) {
      updateTimecard({ breakTime: Number(breakTime) });
    }
  };

  // Enhanced hours calculation with better logic
  const calcTotalHours = (t) => {
    if (!t.logIn || !t.logOut) return "-";
    
    try {
      const [liH, liM] = t.logIn.split(":").map(Number);
      const [loH, loM] = t.logOut.split(":").map(Number);
      
      if (isNaN(liH) || isNaN(liM) || isNaN(loH) || isNaN(loM)) return "-";
      
      let start = liH * 60 + liM;
      let end = loH * 60 + loM;
      
      // Handle overnight shifts
      if (end < start) end += 24 * 60;
      
      let worked = end - start;
      
      // Subtract lunch break (only if both times exist and are different)
      if (t.lunchOut && t.lunchIn && t.lunchOut !== t.lunchIn) {
        const [lo1, lo2] = t.lunchOut.split(":").map(Number);
        const [li1, li2] = t.lunchIn.split(":").map(Number);
        
        if (!isNaN(lo1) && !isNaN(lo2) && !isNaN(li1) && !isNaN(li2)) {
          let lunchStart = lo1 * 60 + lo2;
          let lunchEnd = li1 * 60 + li2;
          
          // Handle lunch break spanning midnight
          if (lunchEnd < lunchStart) lunchEnd += 24 * 60;
          
          const lunchDuration = lunchEnd - lunchStart;
          if (lunchDuration > 0 && lunchDuration <= 120) { // Max 2 hours lunch
            worked -= lunchDuration;
          }
        }
      }
      
      // Subtract permission time
      if (t.permission && !isNaN(t.permission)) {
        worked -= Number(t.permission) * 60;
      }
      
      // Subtract break time if exists
      if (t.breakTime && !isNaN(t.breakTime)) {
        worked -= Number(t.breakTime);
      }
      
      // Ensure non-negative
      worked = Math.max(0, worked);
      
      const hh = Math.floor(worked / 60);
      const mm = worked % 60;
      return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error calculating hours:', error);
      return "-";
    }
  };

  const getWorkStatus = (t) => {
    const hours = calcTotalHours(t);
    if (hours === "-") return { status: "Incomplete", color: "secondary" };
    
    const [h] = hours.split(":").map(Number);
    if (h >= 8) return { status: "Full Day", color: "success" };
    if (h >= 4) return { status: "Half Day", color: "warning" };
    return { status: "Short Day", color: "danger" };
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

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5>{stats.totalDays}</h5>
                <p>Total Days</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5>{stats.totalHours}h</h5>
                <p>Total Hours</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5>{stats.avgHours}h</h5>
                <p>Avg Hours</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h5>{stats.shortDays}</h5>
                <p>Short Days</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-secondary text-white">
              <div className="card-body text-center">
                <h5>{stats.overtimeHours}h</h5>
                <p>Overtime</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-dark text-white">
              <div className="card-body text-center">
                <h5>{current ? calcTotalHours(current) : "-"}</h5>
                <p>Today&apos;s Hours</p>
              </div>
            </div>
          </div>
        </div>

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
                      <button className="btn btn-warning" onClick={handleLunchOut} disabled={!!current?.lunchOut}>
                        Lunch Out
                      </button>
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Lunch In</label>
                    <div className="d-flex gap-2">
                      <input type="text" className="form-control" value={current?.lunchIn || "-"} readOnly />
                      <button className="btn btn-success" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn}>
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
                  <label className="form-label">Permission Hours (Max 2)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="2" 
                    step="0.5" 
                    className="form-control" 
                    value={permission} 
                    onChange={(e) => setPermission(Math.min(2, Math.max(0, Number(e.target.value))))}
                    disabled={permissionLocked} 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason</label>
                  <textarea 
                    className="form-control" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    disabled={permissionLocked}
                    rows="2"
                  />
                </div>
                <div className="d-flex gap-2">
                  <button onClick={handleSavePermission} className="btn btn-primary" disabled={permissionLocked || !reason.trim()}>
                    Save Permission
                  </button>
                  <button onClick={handleBreakTime} className="btn btn-outline-secondary">
                    Add Break
                  </button>
                </div>
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
