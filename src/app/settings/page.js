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
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

        <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
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
