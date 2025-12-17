"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

const MAX_BREAKS = 1;
const BREAK_DURATION = 30;
const LUNCH_DURATION = 60;
const REQUIRED_WORK_HOURS = 8;
const GRACE_TIME = 60;

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
    if (!current?.logIn || !current?.logOut) return 0;
    
    let total = timeToMinutes(current.logOut) - timeToMinutes(current.logIn);
    
    if (current.lunchOut && current.lunchIn) {
      total -= (timeToMinutes(current.lunchIn) - timeToMinutes(current.lunchOut));
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
      const ongoingBreak = (today.breaks || []).find(b => b.breakOut && !b.breakIn);
      setIsOnBreak(!!ongoingBreak);
      setLateLogin(today.lateLogin || false);
      hasCreatedTimecard.current = true;
    } else if (!hasCreatedTimecard.current) {
      hasCreatedTimecard.current = true;
      const loginTime = getTimeString();
      const newEntry = { employeeId, date: getDateString(), logIn: loginTime, userRole };
      const token = localStorage.getItem('token');
      const res2 = await fetch("/api/timecard", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEntry),
      });
      const data2 = await res2.json();
      if (data2.timecard) {
        setCurrent(data2.timecard);
        setLateLogin(data2.timecard.lateLogin || false);
        if (data2.timecard.lateLogin) {
          setSuccessMessage(`Late login! Required: ${requiredLoginTime}. Admins notified.`);
          setShowSuccess(true);
        }
      }
    }
  };

  useEffect(() => {
    if (employeeId && requiredLoginTime) {
      fetchTimecards();
    }
  }, [employeeId, requiredLoginTime]);

  const updateTimecard = async (updates) => {
    if (!current?._id) return;
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
      setSuccessMessage(error.details || error.error || "Update failed");
      setShowSuccess(true);
      return false;
    }
    
    const data = await res.json();
    if (data.timecard) {
      setCurrent(data.timecard);
      setBreaks(data.timecard.breaks || []);
      return true;
    }
    return false;
  };

  const handleLogOut = async () => {
    const workMin = calculateWorkMinutes();
    const requiredMin = REQUIRED_WORK_HOURS * 60;
    
    if (workMin < requiredMin) {
      setSuccessMessage(`Cannot logout: Need ${minutesToTime(requiredMin - workMin)} more work time`);
      setShowSuccess(true);
      return;
    }
    
    const success = await updateTimecard({ logOut: getTimeString() });
    if (success) {
      setSuccessMessage("Logged out successfully");
      setShowSuccess(true);
    }
  };

  const handleLunchOut = () => {
    if (current?.logOut) {
      setSuccessMessage("Cannot take lunch after logout");
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
    
    if (current?.lunchOut && !current?.lunchIn) {
      const duration = timeToMinutes(getTimeString()) - timeToMinutes(current.lunchOut);
      if (duration > LUNCH_DURATION) {
        setSuccessMessage(`Lunch exceeded ${LUNCH_DURATION} minutes`);
        setShowSuccess(true);
      }
      updateTimecard({ lunchIn: getTimeString() });
    }
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
      setSuccessMessage("Not on break");
      setShowSuccess(true);
      return;
    }
    
    const updatedBreaks = breaks.map((b, index) => 
      index === breaks.length - 1 && !b.breakIn 
        ? { ...b, breakIn: getTimeString() }
        : b
    );
    
    const lastBreak = updatedBreaks[updatedBreaks.length - 1];
    if (lastBreak?.breakIn && lastBreak?.breakOut) {
      const duration = timeToMinutes(lastBreak.breakIn) - timeToMinutes(lastBreak.breakOut);
      
      if (duration > BREAK_DURATION) {
        setSuccessMessage(`Break exceeded ${BREAK_DURATION} minutes`);
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
  const requiredMin = (REQUIRED_WORK_HOURS * 60) + LUNCH_DURATION + BREAK_DURATION + GRACE_TIME;
  const progress = current?.logOut ? 100 : Math.min(100, (workMin / requiredMin) * 100);

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
                <small className="text-white d-block">Work Hours: {REQUIRED_WORK_HOURS} hrs</small>
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
                {progress.toFixed(1)}% - {minutesToTime(workMin)} / {REQUIRED_WORK_HOURS}h
              </div>
            </div>
            {!current?.logOut && workMin < requiredMin && (
              <small className="text-danger">
                Need {minutesToTime(requiredMin - workMin)} more to complete {REQUIRED_WORK_HOURS} hours
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
                        <input type="text" className="form-control text-center" value={current?.logIn || "-"} readOnly />
                        {lateLogin && <small className="text-danger d-block mt-1">Late Login</small>}
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold">Logout Time</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.logOut || "-"} readOnly />
                        <button onClick={handleLogOut} disabled={!!current?.logOut} className="btn btn-danger btn-sm w-100">
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
                        <button className="btn btn-warning btn-sm w-100" onClick={handleLunchOut} disabled={!!current?.lunchOut || !!current?.logOut}>
                          <i className="bi bi-cup-hot me-1"></i>Go Out
                        </button>
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold">Lunch In</label>
                        <input type="text" className="form-control text-center mb-2" value={current?.lunchIn || "-"} readOnly />
                        <button className="btn btn-success btn-sm w-100" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn || !!current?.logOut}>
                          <i className="bi bi-arrow-left me-1"></i>Come In
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mt-3">
              <div className="col-md-12">
                <div className="card" style={{ background: 'linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)', border: '2px solid #d4af37' }}>
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Breaks ({breaks.length}/{MAX_BREAKS}) - Max {BREAK_DURATION} min each</h6>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Break Reason</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={breakReason} 
                        onChange={(e) => setBreakReason(e.target.value)}
                        disabled={isOnBreak || breaks.length >= MAX_BREAKS || !!current?.logOut}
                        placeholder="Enter reason"
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <button 
                          onClick={handleBreakOut} 
                          className="btn btn-warning btn-sm w-100" 
                          disabled={isOnBreak || breaks.length >= MAX_BREAKS || !breakReason.trim() || !!current?.logOut}
                        >
                          <i className="bi bi-pause-circle me-1"></i>Break Out
                        </button>
                      </div>
                      <div className="col-6">
                        <button 
                          onClick={handleBreakIn} 
                          className="btn btn-success btn-sm w-100" 
                          disabled={!isOnBreak || !!current?.logOut}
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
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaks.map((breakItem, index) => {
                        const duration = breakItem.breakIn 
                          ? timeToMinutes(breakItem.breakIn) - timeToMinutes(breakItem.breakOut)
                          : 0;
                        return (
                          <tr key={index}>
                            <td>{breakItem.breakOut}</td>
                            <td>{breakItem.breakIn || "On Break"}</td>
                            <td>
                              {duration > 0 ? `${duration} min` : "-"}
                              {duration > BREAK_DURATION && <span className="text-danger ms-2">(Exceeded)</span>}
                            </td>
                            <td>{breakItem.reason}</td>
                          </tr>
                        );
                      })}
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
              <li>Required Work Hours: <strong>{REQUIRED_WORK_HOURS} hours</strong></li>
              <li>Lunch Break: <strong>Max {LUNCH_DURATION} minutes</strong></li>
              <li>Breaks: <strong>Max {MAX_BREAKS} breaks, {BREAK_DURATION} minutes each</strong></li>
              <li>Must complete lunch and all breaks before logout</li>
              <li>Cannot logout without completing {REQUIRED_WORK_HOURS} hours</li>
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
