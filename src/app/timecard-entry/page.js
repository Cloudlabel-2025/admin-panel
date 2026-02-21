"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

const MAX_BREAKS = 1;
const BREAK_DURATION = 30;
const LUNCH_DURATION = 60;
const REQUIRED_WORK_HOURS = 8;
const MANDATORY_TIME = (REQUIRED_WORK_HOURS * 60) + BREAK_DURATION;
const GRACE_TIME = 60;
const PERMISSION_LIMIT = 2 * 60;

export default function TimecardPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [employeeData, setEmployeeData] = useState(null);
  const [current, setCurrent] = useState(null);
  const [breaks, setBreaks] = useState([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakReason, setBreakReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [lateLogin, setLateLogin] = useState(false);
  const [requiredLoginTime, setRequiredLoginTime] = useState("10:00");
  const [userRole, setUserRole] = useState("");
  const [newLoginTime, setNewLoginTime] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [permissionMinutes, setPermissionMinutes] = useState(0);
  const [permissionReason, setPermissionReason] = useState("");
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [monthlyPermissionCount, setMonthlyPermissionCount] = useState(0);
  const hasCreatedTimecard = useRef(false);

  const getTimeString = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const getDateString = () => new Date().toISOString().split("T")[0];

  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const calculateWorkMinutes = () => {
    if (!current?.logIn) return 0;
    
    const endTime = current?.logOut || getTimeString();
    let total = timeToMinutes(endTime) - timeToMinutes(current.logIn);
    
    if (current.lunchOut && current.lunchIn) {
      const lunchDuration = timeToMinutes(current.lunchIn) - timeToMinutes(current.lunchOut);
      // Only deduct standard lunch time (60 min), excess is unaccounted time
      const deductibleLunch = Math.min(lunchDuration, LUNCH_DURATION);
      total -= deductibleLunch;
    }
    
    return Math.max(0, total);
  };

  const fetchRequiredLoginTime = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings?key=REQUIRED_LOGIN_TIME', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequiredLoginTime(data.value || "10:00");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateLoginTime = async () => {
    if (!newLoginTime) {
      setSuccessMessage("Please enter a valid time");
      setShowSuccess(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: 'REQUIRED_LOGIN_TIME',
          value: newLoginTime,
          updatedBy: employeeId,
          role: userRole
        })
      });

      if (res.ok) {
        setRequiredLoginTime(newLoginTime);
        setSuccessMessage(`Login time updated to ${newLoginTime} for all employees`);
        setShowSuccess(true);
        setShowSettings(false);
        setNewLoginTime("");
      } else {
        const error = await res.json();
        setSuccessMessage(error.error || "Update failed");
        setShowSuccess(true);
      }
    } catch (err) {
      setSuccessMessage("Error updating login time");
      setShowSuccess(true);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    if (!role || !empId) {
      router.push("/");
      return;
    }
    const roleLower = role.toLowerCase();
    if (roleLower === 'super-admin' || roleLower === 'developer') {
      router.push('/admin-dashboard');
      return;
    }
    setEmployeeId(empId);
    setUserRole(role);
    fetchRequiredLoginTime();
    if (!empId.startsWith('ADMIN')) {
      fetchEmployeeData(empId);
    }
  }, [router]);

  const fetchEmployeeData = async (empId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/Employee/${empId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployeeData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimecards = async () => {
    if (!employeeId) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/timecard?employeeId=${employeeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();

    const today = data.find((t) => t.date?.startsWith(getDateString()));
    if (today) {
      setCurrent(today);
      setBreaks(today.breaks || []);
      setPermissionMinutes(today.permissionMinutes || 0);
      setPermissionReason(today.permissionReason || "");
      const ongoingBreak = (today.breaks || []).find(b => b.breakOut && !b.breakIn);
      setIsOnBreak(!!ongoingBreak);
      setLateLogin(today.lateLogin || false);
      setHasLoggedIn(!!today.logIn);
      hasCreatedTimecard.current = true;
    }
    
    // Count monthly permissions
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPerms = data.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startOfMonth && t.permissionLocked && t.permissionMinutes > 0;
    }).length;
    setMonthlyPermissionCount(monthlyPerms);
  };

  const handleLogin = async () => {
    if (hasLoggedIn) {
      setSuccessMessage("Already logged in today");
      setShowSuccess(true);
      return;
    }
    
    const token = localStorage.getItem('token');
    const res = await fetch("/api/timecard", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        employeeId, 
        date: getDateString(), 
        userRole,
        logIn: getTimeString()
      }),
    });
    
    const data = await res.json();
    if (data.timecard) {
      setCurrent(data.timecard);
      setHasLoggedIn(true);
      setLateLogin(data.timecard.lateLogin || false);
      if (data.timecard.lateLogin) {
        setSuccessMessage(`Late login! Required: ${requiredLoginTime}. Admins notified.`);
      } else {
        setSuccessMessage(`Logged in at ${data.timecard.logIn}`);
      }
      setShowSuccess(true);
    }
  };

  useEffect(() => {
    if (employeeId && requiredLoginTime) {
      fetchTimecards();
    }
  }, [employeeId, requiredLoginTime]);

  useEffect(() => {
    if (!current?.logIn || current?.logOut) return;
    
    const checkAutoLogout = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const loginMinutes = timeToMinutes(current.logIn);
      const requiredMinutes = timeToMinutes(requiredLoginTime);
      const maxLogoutTime = '20:30';
      const currentMinutes = timeToMinutes(currentTime);
      const maxLogoutMinutes = timeToMinutes(maxLogoutTime);
      
      if (loginMinutes <= requiredMinutes && currentMinutes >= maxLogoutMinutes) {
        let logMessage = `Auto-logout at ${maxLogoutTime}. `;
        
        if (!current?.lunchIn) {
          if (!current?.lunchOut) {
            logMessage += 'Lunch not taken. ';
          } else {
            logMessage += 'Lunch incomplete. ';
          }
        }
        
        const incompleteBreaks = breaks.filter(b => b.breakOut && !b.breakIn);
        if (incompleteBreaks.length > 0) {
          logMessage += 'Break incomplete. ';
        } else if (breaks.length === 0) {
          logMessage += 'Break not taken. ';
        }
        
        updateTimecard({ logOut: maxLogoutTime, autoLogoutReason: logMessage });
        setSuccessMessage(logMessage);
        setShowSuccess(true);
      }
    };
    
    const interval = setInterval(checkAutoLogout, 60000);
    return () => clearInterval(interval);
  }, [current, requiredLoginTime, breaks]);

  useEffect(() => {
    if (lateLogin && current?.logIn) {
      setSuccessMessage(`Late login at ${current.logIn}! Required: ${requiredLoginTime}. Admins notified.`);
      setShowSuccess(true);
    }
  }, [lateLogin, current?.logIn, requiredLoginTime]);

  const updateTimecard = async (updates) => {
    if (!current?._id) return;
    console.log('Frontend: Updating timecard with:', JSON.stringify(updates));
    const token = localStorage.getItem('token');
    const res = await fetch("/api/timecard", {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ _id: current._id, ...updates }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      console.error('Frontend: Update failed:', error);
      setSuccessMessage(error.details || error.error || "Update failed");
      setShowSuccess(true);
      return false;
    }
    
    const data = await res.json();
    console.log('Frontend: Update response:', JSON.stringify(data.timecard));
    if (data.timecard) {
      setCurrent(data.timecard);
      if (data.timecard.breaks) {
        setBreaks(data.timecard.breaks);
      }
      if (data.timecard.permissionMinutes !== undefined) {
        setPermissionMinutes(data.timecard.permissionMinutes);
      }
      if (data.timecard.permissionReason) {
        setPermissionReason(data.timecard.permissionReason);
      }
      return true;
    }
    return false;
  };

  const handleLogOut = async () => {
    let logMessage = '';
    
    if (!current?.lunchIn) {
      if (!current?.lunchOut) {
        logMessage += 'Lunch not taken. ';
      } else {
        logMessage += 'Lunch incomplete. ';
      }
    }
    
    const incompleteBreaks = breaks.filter(b => b.breakOut && !b.breakIn);
    if (incompleteBreaks.length > 0) {
      logMessage += 'Break incomplete. ';
    } else if (breaks.length === 0) {
      logMessage += 'Break not taken. ';
    }
    
    const success = await updateTimecard({ 
      logOut: getTimeString(),
      manualLogoutReason: logMessage || 'All breaks completed'
    });
    if (success) {
      const status = current?.attendanceStatus || 'Present';
      const reason = current?.statusReason || '';
      setSuccessMessage(`Logged out - Status: ${status}${reason ? ' (' + reason + ')' : ''}. ${logMessage}`);
      setShowSuccess(true);
    }
  };

  const handlePermissionUpdate = async () => {
    console.log('Frontend: Permission update clicked - Minutes:', permissionMinutes, 'Reason:', permissionReason);
    if (permissionMinutes < 30) {
      setSuccessMessage("Permission must be at least 30 minutes");
      setShowSuccess(true);
      return;
    }
    if (!permissionReason.trim()) {
      setSuccessMessage("Permission reason required");
      setShowSuccess(true);
      return;
    }
    if (permissionMinutes > PERMISSION_LIMIT) {
      setSuccessMessage(`Permission cannot exceed ${PERMISSION_LIMIT / 60} hours`);
      setShowSuccess(true);
      return;
    }
    
    // Check monthly limit
    if (monthlyPermissionCount >= 2) {
      setSuccessMessage(`Permission limit reached. You can only take permission 2 times per month. Used: ${monthlyPermissionCount}/2`);
      setShowSuccess(true);
      return;
    }
    
    // If no timecard exists (before login), create one first
    if (!current?._id) {
      const token = localStorage.getItem('token');
      const res = await fetch("/api/timecard", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          employeeId, 
          date: getDateString(), 
          userRole,
          permissionMinutes,
          permissionReason,
          permissionLocked: true
        }),
      });
      
      const data = await res.json();
      if (data.timecard) {
        setCurrent(data.timecard);
        setMonthlyPermissionCount(prev => prev + 1);
        setSuccessMessage(`Permission of ${permissionMinutes} min recorded before login`);
        setShowSuccess(true);
      } else if (data.error) {
        setSuccessMessage(data.error);
        setShowSuccess(true);
      }
      return;
    }
    
    console.log('Frontend: Sending permission update to backend');
    const success = await updateTimecard({ 
      permissionMinutes, 
      permissionReason,
      permissionLocked: true
    });
    if (success) {
      console.log('Frontend: Permission updated successfully');
      setMonthlyPermissionCount(prev => prev + 1);
      setSuccessMessage(`Permission of ${permissionMinutes} min recorded`);
      setShowSuccess(true);
    }
  };

  const handleLunchOut = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot take lunch after logout");
      setShowSuccess(true);
      return;
    }
    
    if (isOnBreak) {
      setSuccessMessage("Cannot take lunch while on break");
      setShowSuccess(true);
      return;
    }
    
    if (!current?.lunchOut) {
      updateTimecard({ lunchOut: getTimeString() });
    }
  };

  const handleLunchIn = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot return from lunch after logout");
      setShowSuccess(true);
      return;
    }
    
    if (isOnBreak) {
      setSuccessMessage("Cannot return from lunch while on break");
      setShowSuccess(true);
      return;
    }
    
    if (current?.lunchOut && !current?.lunchIn) {
      const duration = timeToMinutes(getTimeString()) - timeToMinutes(current.lunchOut);
      if (duration > LUNCH_DURATION) {
        setSuccessMessage(`Lunch extended by ${duration - LUNCH_DURATION} min. Admins notified.`);
        setShowSuccess(true);
      }
      updateTimecard({ lunchIn: getTimeString() });
    }
  };

  const handleBreakOut = () => {
    console.log('Frontend: Break Out clicked');
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
    if (current?.lunchOut && !current?.lunchIn) {
      setSuccessMessage("Cannot take break during lunch");
      setShowSuccess(true);
      return;
    }
    if (breaks.length >= MAX_BREAKS) {
      setSuccessMessage(`Maximum ${MAX_BREAKS} breaks allowed`);
      setShowSuccess(true);
      return;
    }
    if (!breakReason.trim()) {
      setSuccessMessage("Break reason required");
      setShowSuccess(true);
      return;
    }
    
    const newBreak = { breakOut: getTimeString(), reason: breakReason };
    const updatedBreaks = [...breaks, newBreak];
    console.log('Frontend: Sending break out:', JSON.stringify(updatedBreaks));
    setBreaks(updatedBreaks);
    setIsOnBreak(true);
    setBreakReason("");
    updateTimecard({ breaks: updatedBreaks });
  };

  const handleBreakIn = () => {
    console.log('Frontend: Break In clicked, current breaks:', JSON.stringify(breaks));
    if (current?.logOut) {
      setSuccessMessage("Cannot return from break after logout");
      setShowSuccess(true);
      return;
    }
    if (!isOnBreak) {
      setSuccessMessage("Not on break");
      setShowSuccess(true);
      return;
    }
    if (current?.lunchOut && !current?.lunchIn) {
      setSuccessMessage("Cannot return from break during lunch");
      setShowSuccess(true);
      return;
    }
    
    const updatedBreaks = breaks.map((b, index) => 
      index === breaks.length - 1 && !b.breakIn 
        ? { ...b, breakIn: getTimeString() }
        : b
    );
    
    console.log('Frontend: Sending break in:', JSON.stringify(updatedBreaks));
    
    const lastBreak = updatedBreaks[updatedBreaks.length - 1];
    if (lastBreak?.breakIn && lastBreak?.breakOut) {
      const duration = timeToMinutes(lastBreak.breakIn) - timeToMinutes(lastBreak.breakOut);
      console.log('Frontend: Break duration calculated:', duration, 'minutes');
      
      if (duration > BREAK_DURATION) {
        setSuccessMessage(`Break extended by ${duration - BREAK_DURATION} min. Admins notified.`);
        setShowSuccess(true);
      }
    }
    
    setBreaks(updatedBreaks);
    setIsOnBreak(false);
    updateTimecard({ breaks: updatedBreaks });
  }; 

  
  if (!employeeId) {
    return <div>Loading...</div>;
  }

  const workMin = calculateWorkMinutes();
  const mandatoryMin = MANDATORY_TIME;
  const progress = current?.logOut ? 100 : Math.min(100, (workMin / mandatoryMin) * 100);
  const totalBreakTime = breaks.reduce((sum, b) => {
    if (b.breakOut && b.breakIn) {
      return sum + (timeToMinutes(b.breakIn) - timeToMinutes(b.breakOut));
    }
    return sum;
  }, 0);
  const lunchTime = (current?.lunchOut && current?.lunchIn) 
    ? timeToMinutes(current.lunchIn) - timeToMinutes(current.lunchOut) 
    : 0;

  return (
    <Layout>
      <div className="container-fluid p-4">
        {showSuccess && (
          <SuccessMessage 
            message={successMessage} 
            onClose={() => setShowSuccess(false)} 
          />
        )}

        {lateLogin && (
          <div className="alert alert-warning mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Late Login:</strong> Required login time is {requiredLoginTime}. Team Admin, Team Lead, Super Admin, and Developers have been notified.
          </div>
        )}

        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0" style={{ color: '#ffffff' }}>
                <i className="bi bi-clock-history me-2" style={{ color: '#d4af37' }}></i>
                Production Timecard
              </h3>
              <div className="text-end">
                <small className="text-white d-block">Required Login: {requiredLoginTime}</small>
                <small className="text-white d-block">Work time determines attendance status</small>
                <small className="text-white d-block">Lunch: 1h (company-provided)</small>
                {userRole === 'SUPER_ADMIN' && (
                  <button 
                    className="btn btn-sm btn-warning mt-2"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <i className="bi bi-gear me-1"></i>Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {userRole === 'SUPER_ADMIN' && showSettings && (
          <div className="card shadow-sm mb-4 border-warning">
            <div className="card-header bg-warning">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>Super Admin Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Set Required Login Time (All Employees)</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={newLoginTime}
                    onChange={(e) => setNewLoginTime(e.target.value)}
                  />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={updateLoginTime}
                  >
                    <i className="bi bi-check-circle me-2"></i>Update Login Time
                  </button>
                </div>
              </div>
              <small className="text-muted d-block mt-2">
                This will update the required login time for all employees. Late logins will trigger notifications.
              </small>
            </div>
          </div>
        )}

        {employeeData && (
          <div className="card mb-4 shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <small className="text-muted d-block">Name</small>
                  <strong>{employeeData.firstName} {employeeData.lastName}</strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Employee ID</small>
                  <strong>{employeeData.employeeId}</strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Department</small>
                  <strong>{employeeData.department}</strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Today</small>
                  <strong>{new Date().toLocaleDateString()}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-4 shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Work Progress</h5>
          </div>
          <div className="card-body">
            <div className="progress mb-2" style={{ height: '30px' }}>
              <div
                className={`progress-bar ${progress >= 100 ? 'bg-success' : 'bg-warning'}`}
                style={{ width: `${progress}%` }}
              >
                {progress.toFixed(1)}% - {minutesToTime(workMin)}
              </div>
            </div>
            {!current?.logOut && (
              <small className="text-info d-block">
                {workMin < 4 * 60 && 'Status: Leave (< 4h)'}
                {workMin >= 4 * 60 && workMin < 8 * 60 && 'Status: Half Day (4-8h)'}
                {workMin >= 8 * 60 && 'Status: Present (≥ 8h)'}
              </small>
            )}
            {current?.logOut && current?.attendanceStatus && (
              <small className="text-success d-block fw-bold">
                Final Status: {current.attendanceStatus}
                {current.statusReason && ` - ${current.statusReason}`}
              </small>
            )}
            {totalBreakTime > 0 && (
              <small className={`d-block mt-1 ${totalBreakTime > BREAK_DURATION ? 'text-warning' : 'text-muted'}`}>
                Break: {totalBreakTime} min / {BREAK_DURATION} min {totalBreakTime > BREAK_DURATION && '(Extended)'}
              </small>
            )}
            {lunchTime > 0 && (
              <small className={`d-block mt-1 ${lunchTime > LUNCH_DURATION ? 'text-warning' : 'text-muted'}`}>
                Lunch: {lunchTime} min / {LUNCH_DURATION} min {lunchTime > LUNCH_DURATION && '(Extended)'}
              </small>
            )}
            {permissionMinutes > 0 && (
              <small className={`d-block mt-1 ${permissionMinutes > PERMISSION_LIMIT ? 'text-danger' : 'text-info'}`}>
                Permission: {permissionMinutes} min / {PERMISSION_LIMIT} min {permissionMinutes > PERMISSION_LIMIT && '(Will be Half Day)'}
              </small>
            )}
          </div>
        </div>

        <div className="card mb-4 shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Today's Timecard</h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card h-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Login / Logout</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-bold">Login Time</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.logIn || "-"} readOnly />
                        {lateLogin && <small className="text-danger d-block mt-1">Late Login</small>}
                        <button onClick={handleLogin} disabled={hasLoggedIn} className="btn btn-success btn-sm w-100">
                          <i className="bi bi-box-arrow-in-left me-1"></i>Login
                        </button>
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold">Logout Time</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.logOut || "-"} readOnly />
                        <button onClick={handleLogOut} disabled={!!current?.logOut || !hasLoggedIn} className="btn btn-danger btn-sm w-100">
                          <i className="bi bi-box-arrow-right me-1"></i>Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100" style={{ background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Lunch Break (Max {LUNCH_DURATION} min)</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label fw-bold">Lunch Out</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.lunchOut || "-"} readOnly />
                        <button className="btn btn-warning btn-sm w-100" onClick={handleLunchOut} disabled={!!current?.lunchOut || !!current?.logOut || isOnBreak || !hasLoggedIn}>
                          <i className="bi bi-cup-hot me-1"></i>Go Out
                        </button>
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold">Lunch In</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.lunchIn || "-"} readOnly />
                        <button className="btn btn-success btn-sm w-100" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn || !!current?.logOut || isOnBreak || !hasLoggedIn}>
                          <i className="bi bi-arrow-left me-1"></i>Come In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mt-3">
              <div className="col-md-6">
                <div className="card" style={{ background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Breaks ({breaks.length}/{MAX_BREAKS}) - Max {BREAK_DURATION} min each</h6>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Break Reason</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={breakReason} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
                          setBreakReason(value);
                        }}
                        disabled={isOnBreak || breaks.length >= MAX_BREAKS || !!current?.logOut}
                        placeholder="Enter reason "
                        maxLength={30}
                      />
                      <small className="text-muted">{breakReason.length}/30 characters</small>
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <button 
                          onClick={handleBreakOut} 
                          className="btn btn-warning btn-sm w-100" 
                          disabled={isOnBreak || breaks.length >= MAX_BREAKS || !breakReason.trim() || !!current?.logOut || (current?.lunchOut && !current?.lunchIn) || !hasLoggedIn}
                        >
                          <i className="bi bi-pause-circle me-1"></i>Break Out
                        </button>
                      </div>
                      <div className="col-6">
                        <button 
                          onClick={handleBreakIn} 
                          className="btn btn-success btn-sm w-100" 
                          disabled={!isOnBreak || !!current?.logOut || (current?.lunchOut && !current?.lunchIn) || !hasLoggedIn}
                        >
                          <i className="bi bi-play-circle me-1"></i>Break In
                        </button>
                      </div>
                    </div>
                    {isOnBreak && (
                      <div className="text-center mt-2">
                        <div className="badge bg-info">On Break</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card" style={{ background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Permission (Max {PERMISSION_LIMIT / 60} hours) - {monthlyPermissionCount}/2 used this month</h6>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Permission Time</label>
                      <select 
                        className="form-select" 
                        value={permissionMinutes} 
                        onChange={(e) => setPermissionMinutes(Number(e.target.value))}
                        disabled={!!current?.logOut || !!current?.permissionLocked || monthlyPermissionCount >= 2}
                      >
                        <option value={0}>Select Duration</option>
                        <option value={30}>0.5 hours (30 min)</option>
                        <option value={60}>1 hour (60 min)</option>
                        <option value={90}>1.5 hours (90 min)</option>
                        <option value={120}>2 hours (120 min)</option>
                      </select>
                      {monthlyPermissionCount >= 2 && (
                        <small className="text-danger d-block mt-1">Monthly limit reached (2/2)</small>
                      )}
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Reason</label>
                      <textarea 
                        className="form-control" 
                        value={permissionReason} 
                        onChange={(e) => setPermissionReason(e.target.value)}
                        disabled={!!current?.logOut || !!current?.permissionLocked || monthlyPermissionCount >= 2}
                        placeholder="Enter detailed reason for permission"
                        rows="2"
                      />
                    </div>
                    <button 
                      onClick={handlePermissionUpdate} 
                      className="btn btn-primary btn-sm w-100" 
                      disabled={!!current?.logOut || permissionMinutes < 30 || !permissionReason.trim() || !!current?.permissionLocked || monthlyPermissionCount >= 2}
                    >
                      <i className="bi bi-check-circle me-1"></i>Add Permission
                    </button>
                    {current?.permissionLocked ? (
                      <div className="text-center mt-2">
                        <div className="badge bg-success">Permission Locked</div>
                        <small className="d-block text-muted mt-1">Cannot be modified</small>
                      </div>
                    ) : permissionMinutes > 0 ? (
                      <div className="text-center mt-2">
                        <div className="badge bg-warning text-dark">Permission Added (Not Locked)</div>
                        <small className="d-block text-muted mt-1">Can still be removed or modified</small>
                      </div>
                    ) : null}
                    {permissionMinutes > 0 && (
                      <div className="text-center mt-2">
                        <small className={permissionMinutes > PERMISSION_LIMIT ? 'text-danger' : 'text-success'}>
                          {permissionMinutes} min / {PERMISSION_LIMIT} min
                          {permissionMinutes > PERMISSION_LIMIT && ' (Exceeds limit - will be Half Day)'}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {breaks.length > 0 && (
              <div className="mt-4">
                <h6 className="fw-bold mb-3">Today's Breaks</h6>
                <div className="table-responsive">
                  <table className="table table-bordered mb-0">
                    <thead className="table-dark">
                      <tr>
                        <th>Break Out</th>
                        <th>Break In</th>
                        <th>Duration</th>
                        <th>Unaccounted Time</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaks.map((breakItem, index) => {
                        const duration = breakItem.breakIn 
                          ? timeToMinutes(breakItem.breakIn) - timeToMinutes(breakItem.breakOut)
                          : 0;
                        const unaccountedTime = duration > BREAK_DURATION ? duration - BREAK_DURATION : 0;
                        return (
                          <tr key={index}>
                            <td>{breakItem.breakOut}</td>
                            <td>{breakItem.breakIn || "On Break"}</td>
                            <td>
                              {duration > 0 ? `${duration} min` : "-"}
                              {duration > BREAK_DURATION && <span className="text-danger ms-2">(Late Break)</span>}
                            </td>
                            <td className={unaccountedTime > 0 ? 'text-danger fw-bold' : 'text-muted'}>
                              {unaccountedTime > 0 ? `${unaccountedTime} min` : "-"}
                            </td>
                            <td>{breakItem.reason}</td>
                          </tr>
                        );
                      })}
                      {/* Lunch row if taken */}
                      {current?.lunchOut && (
                        <tr className="table-warning">
                          <td>{current.lunchOut}</td>
                          <td>{current.lunchIn || "On Lunch"}</td>
                          <td>
                            {current.lunchIn ? `${lunchTime} min` : "-"}
                            {lunchTime > LUNCH_DURATION && <span className="text-danger ms-2">(Late Lunch)</span>}
                          </td>
                          <td className={lunchTime > LUNCH_DURATION ? 'text-danger fw-bold' : 'text-muted'}>
                            {lunchTime > LUNCH_DURATION ? `${lunchTime - LUNCH_DURATION} min` : "-"}
                          </td>
                          <td>Lunch Break</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Rules & Constraints</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              <li>Required Login Time: <strong>{requiredLoginTime}</strong> (Late logins notify admins)</li>
              <li><strong>Work Time Rules:</strong>
                <ul>
                  <li>&lt; 4 hours: Marked as <strong>Leave</strong></li>
                  <li>4-8 hours: Marked as <strong>Half Day</strong></li>
                  <li>≥ 8 hours: Marked as <strong>Present</strong></li>
                </ul>
              </li>
              <li>Auto-logout: <strong>8:30 PM</strong> (If login at or before required time, logs lunch/break status)</li>
              <li>Manual logout: <strong>Allowed anytime</strong> (Logs lunch/break status)</li>
              <li>Lunch Break: <strong>60 minutes</strong> (Company-provided, not counted in work time)</li>
              <li>Breaks: <strong>Max {MAX_BREAKS} break, {BREAK_DURATION} minutes</strong></li>
              <li>Permission: <strong>0.5h, 1h, 1.5h, or 2h per day</strong> (Can be added before or after login, locks automatically. If &gt; 2 hours, marked as Half Day. <strong className="text-danger">Limited to 2 times per month</strong>)</li>
              <li>Extensions: Lunch or break extensions notify admins automatically</li>
              <li>Must complete lunch and all breaks before logout</li>
              {userRole === 'SUPER_ADMIN' && (
                <li className="text-warning"><strong>Super Admin:</strong> Can modify required login time for all employees</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
