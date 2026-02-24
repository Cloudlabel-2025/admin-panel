"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function SettingsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [requiredLoginTime, setRequiredLoginTime] = useState("10:00");
  const [newLoginTime, setNewLoginTime] = useState("");
  const [saturdayOverrides, setSaturdayOverrides] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isWorkingDay, setIsWorkingDay] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [leaveDate, setLeaveDate] = useState("");
  const [compensationDate, setCompensationDate] = useState("");
  const [compensationReason, setCompensationReason] = useState("");
  const [compensations, setCompensations] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    if (!role || !empId) {
      router.push("/");
      return;
    }
    if (role !== 'super-admin' && role !== 'Super-admin') {
      router.push('/admin-dashboard');
      return;
    }
    setUserRole(role);
    setEmployeeId(empId);
    fetchRequiredLoginTime();
    fetchSaturdayOverrides();
    fetchCompensations();
  }, [router]);

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

  const fetchSaturdayOverrides = async () => {
    try {
      const res = await fetch('/api/weekend-override');
      if (res.ok) {
        const data = await res.json();
        setSaturdayOverrides(data);
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

  const addSaturdayOverride = async () => {
    if (!selectedDate) {
      setSuccessMessage("Please select a date");
      setShowSuccess(true);
      return;
    }

    const date = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) {
      setSuccessMessage("Cannot set override for past dates");
      setShowSuccess(true);
      return;
    }

    if (date.getDay() !== 6) {
      setSuccessMessage("Please select a Saturday");
      setShowSuccess(true);
      return;
    }

    try {
      const res = await fetch('/api/weekend-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          isWeekend: !isWorkingDay,
          reason: isWorkingDay ? "Working Saturday" : "Weekend Override",
          createdBy: employeeId
        })
      });

      if (res.ok) {
        setSuccessMessage(`Saturday ${isWorkingDay ? 'marked as working day' : 'marked as weekend'}`);
        setShowSuccess(true);
        setSelectedDate("");
        setIsWorkingDay(false);
        fetchSaturdayOverrides();
      }
    } catch (err) {
      setSuccessMessage("Error updating Saturday");
      setShowSuccess(true);
    }
  };

  const removeOverride = async (date) => {
    try {
      const res = await fetch(`/api/weekend-override?date=${date}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage("Override removed");
        setShowSuccess(true);
        fetchSaturdayOverrides();
      }
    } catch (err) {
      setSuccessMessage("Error removing override");
      setShowSuccess(true);
    }
  };

  const generateMonthlyAttendance = async () => {
    if (!selectedMonth) {
      setSuccessMessage("Please select a month");
      setShowSuccess(true);
      return;
    }

    try {
      setGeneratingReport(true);
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const res = await fetch('/api/attendance?admin=true&startDate=' + startDate.toISOString() + '&endDate=' + endDate.toISOString());
      const result = await res.json();
      const data = result.data || [];

      if (data.length === 0) {
        setSuccessMessage("No attendance records found for selected month");
        setShowSuccess(true);
        setGeneratingReport(false);
        return;
      }

      const employeeMap = {};
      data.forEach(a => {
        if (!employeeMap[a.employeeId]) {
          employeeMap[a.employeeId] = {
            employeeId: a.employeeId,
            employeeName: a.employeeName,
            department: a.department,
            present: 0,
            absent: 0,
            halfDay: 0,
            logoutMissing: 0,
            totalHours: 0,
            totalOvertime: 0
          };
        }
        const emp = employeeMap[a.employeeId];
        if (a.status === 'Present') emp.present++;
        if (a.status === 'Absent') emp.absent++;
        if (a.status === 'Half Day') emp.halfDay++;
        if (a.status === 'Logout Missing') emp.logoutMissing++;
        emp.totalHours += a.totalHours || 0;
        emp.totalOvertime += a.overtimeHours || 0;
      });

      const reportData = Object.values(employeeMap).map(emp => ({
        EmployeeID: emp.employeeId,
        EmployeeName: emp.employeeName,
        Department: emp.department,
        Present: emp.present,
        Absent: emp.absent,
        HalfDay: emp.halfDay,
        LogoutMissing: emp.logoutMissing,
        TotalHours: emp.totalHours.toFixed(2),
        TotalOvertime: emp.totalOvertime.toFixed(2)
      }));

      const XLSX = (await import('xlsx'));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
      XLSX.writeFile(wb, `Monthly_Attendance_${selectedMonth}.xlsx`);

      setSuccessMessage(`Monthly report generated for ${new Date(startDate).toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      setShowSuccess(true);
      setSelectedMonth("");
    } catch (err) {
      setSuccessMessage("Error generating report");
      setShowSuccess(true);
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchCompensations = async () => {
    try {
      const res = await fetch('/api/weekend-override?type=compensation');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(item => item.compensationDate);
        setCompensations(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addCompensation = async () => {
    if (!leaveDate || !compensationDate || !compensationReason) {
      setSuccessMessage("Please fill all fields");
      setShowSuccess(true);
      return;
    }

    const leave = new Date(leaveDate);
    const comp = new Date(compensationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    leave.setHours(0, 0, 0, 0);
    comp.setHours(0, 0, 0, 0);

    if (leave < today || comp < today) {
      setSuccessMessage("Cannot set compensation for past dates");
      setShowSuccess(true);
      return;
    }

    try {
      const res = await fetch('/api/weekend-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: leaveDate,
          isWeekend: true,
          compensationDate: compensationDate,
          reason: compensationReason,
          createdBy: employeeId,
          type: 'compensation'
        })
      });

      if (res.ok) {
        setSuccessMessage(`Compensation leave added: ${new Date(leaveDate).toLocaleDateString()} → ${new Date(compensationDate).toLocaleDateString()}`);
        setShowSuccess(true);
        setLeaveDate("");
        setCompensationDate("");
        setCompensationReason("");
        fetchCompensations();
      }
    } catch (err) {
      setSuccessMessage("Error adding compensation");
      setShowSuccess(true);
    }
  };

  const removeCompensation = async (id, compensationDate) => {
    try {
      await fetch(`/api/weekend-override?id=${id}`, { method: 'DELETE' });
      if (compensationDate) {
        const compDate = new Date(compensationDate);
        compDate.setHours(0, 0, 0, 0);
        await fetch(`/api/weekend-override?date=${compDate.toISOString()}`, { method: 'DELETE' });
      }
      setSuccessMessage("Compensation removed");
      setShowSuccess(true);
      fetchCompensations();
    } catch (err) {
      setSuccessMessage("Error removing compensation");
      setShowSuccess(true);
    }
  };

  if (userRole !== 'super-admin' && userRole !== 'Super-admin') {
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

        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <h3 className="mb-0" style={{ color: '#ffffff' }}>
              <i className="bi bi-gear-fill me-2" style={{ color: '#d4af37' }}></i>
              Super Admin Settings
            </h3>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Timecard Configuration</h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Current Required Login Time</label>
                <input 
                  type="text" 
                  className="form-control form-control-lg text-center" 
                  value={requiredLoginTime}
                  readOnly
                  style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d4af37' }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Set New Required Login Time</label>
                <input 
                  type="time" 
                  className="form-control form-control-lg" 
                  value={newLoginTime}
                  onChange={(e) => setNewLoginTime(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4">
              <button 
                className="btn btn-warning btn-lg w-100"
                onClick={updateLoginTime}
              >
                <i className="bi bi-check-circle me-2"></i>Update Login Time for All Employees
              </button>
            </div>
            <div className="alert alert-info mt-4 mb-0">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> This setting applies to all employees. Late logins will trigger notifications to Team Admin, Team Lead, Super Admin, and Developers.
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Generate Monthly Attendance</h5>
          </div>
          <div className="card-body p-4">
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Generate Excel report from existing attendance records for all employees for a specific month.
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <label className="form-label fw-bold">Select Month</label>
                <input 
                  type="month" 
                  className="form-control" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button 
                  className="btn btn-warning w-100"
                  onClick={generateMonthlyAttendance}
                  disabled={generatingReport}
                >
                  {generatingReport ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
                  ) : (
                    <><i className="bi bi-file-earmark-excel me-2"></i>Generate Report</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Compensation Leave Management</h5>
          </div>
          <div className="card-body p-4">
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Note:</strong> Mark a working day as leave and assign a compensation working day (can be Saturday). Leave day will be treated as holiday and compensation day as working day.
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-bold">Leave Date (Working Day)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Compensation Date (Working Day)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={compensationDate}
                  onChange={(e) => setCompensationDate(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Reason</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., Festival, Company Event"
                  value={compensationReason}
                  onChange={(e) => setCompensationReason(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-warning w-100 mb-4" onClick={addCompensation}>
              <i className="bi bi-calendar-plus me-2"></i>Add Compensation Leave
            </button>
            
            {compensations.length > 0 && (
              <div>
                <h6 className="fw-bold mb-3">Active Compensations</h6>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Leave Date</th>
                        <th>Compensation Date</th>
                        <th>Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compensations.map((comp) => (
                        <tr key={comp._id}>
                          <td>
                            <span className="badge bg-danger">{new Date(comp.date).toLocaleDateString()}</span>
                          </td>
                          <td>
                            <span className="badge bg-success">{new Date(comp.compensationDate).toLocaleDateString()}</span>
                          </td>
                          <td>{comp.reason}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => removeCompensation(comp._id, comp.compensationDate)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">Saturday Override Configuration</h5>
          </div>
          <div className="card-body p-4">
            <div className="alert alert-info mb-4">
              <i className="bi bi-info-circle me-2"></i>
              <strong>Default Rule:</strong> Sunday is always weekend. 2nd & 4th Saturdays are weekends. Override specific Saturdays below.
            </div>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold">Select Saturday</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Mark As</label>
                <select 
                  className="form-select" 
                  value={isWorkingDay}
                  onChange={(e) => setIsWorkingDay(e.target.value === 'true')}
                >
                  <option value="false">Weekend</option>
                  <option value="true">Working Day</option>
                </select>
              </div>
            </div>
            <button className="btn btn-warning w-100 mb-4" onClick={addSaturdayOverride}>
              <i className="bi bi-calendar-plus me-2"></i>Add Override
            </button>
            
            {saturdayOverrides.length > 0 && (
              <div>
                <h6 className="fw-bold mb-3">Active Overrides</h6>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saturdayOverrides.map((override) => (
                        <tr key={override._id}>
                          <td>{new Date(override.date).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge ${override.isWeekend ? 'bg-danger' : 'bg-success'}`}>
                              {override.isWeekend ? 'Weekend' : 'Working Day'}
                            </span>
                          </td>
                          <td>{override.reason}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => removeOverride(override.date)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm mt-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
            <h5 className="mb-0">System Rules</h5>
          </div>
          <div className="card-body">
            <ul className="mb-0">
              <li>Work Schedule: <strong>4h work → 1h lunch → 2h work → 30min break → 2h work</strong></li>
              <li>Required Work Hours: <strong>8 hours</strong></li>
              <li>Lunch Break: <strong>1 hour (60 minutes)</strong></li>
              <li>Break: <strong>1 break of 30 minutes</strong></li>
              <li>Grace Time: <strong>1 hour extra allowed for logout</strong></li>
              <li>Total Time: <strong>10.5 hours (8h work + 1h lunch + 30min break + 1h grace)</strong></li>
              <li>Employees must complete lunch and break before logout</li>
              <li>Late logins trigger automatic notifications based on role hierarchy</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
