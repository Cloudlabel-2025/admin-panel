"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    
    if (!userRole || !userEmail) {
      router.push("/");
      return;
    }

    // Handle super admin profile
    if (userRole === "super-admin") {
      setUser({
        email: userEmail,
        firstName: "Super",
        lastName: "Admin",
        role: "Administrator",
        department: "Management",
        employeeId: "ADMIN001"
      });
      return;
    }

    // Handle employee profile
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      router.push("/");
      return;
    }

    console.log(`Fetching employee data for ID: ${employeeId}`);
    console.log(`Full API URL: /api/Employee/${employeeId}`);
    fetch(`/api/Employee/${employeeId}`)
      .then((res) => {
        if (res.status === 404) {
          // Employee record not found - show basic info
          setUser({
            employeeId: employeeId,
            firstName: "Not Set",
            lastName: "(Contact Admin)",
            email: userEmail,
            department: "Not Assigned",
            role: userRole || "Employee",
            profileIncomplete: true
          });
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          console.log("Employee data received:", data);
          setUser(data);
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setSuccessMessage(`Unable to load employee profile. Error: ${err.message}`);
        setShowSuccess(true);
      });
  }, [router]);

  const checkPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score === 0) return { score: 0, text: '', color: '' };
    if (score <= 2) return { score: 1, text: 'Weak', color: '#dc3545' };
    if (score === 3) return { score: 2, text: 'Fair', color: '#ffc107' };
    if (score === 4) return { score: 3, text: 'Good', color: '#17a2b8' };
    return { score: 4, text: 'Strong', color: '#28a745' };
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };



  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSuccessMessage("All password fields are required");
      setShowSuccess(true);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(newPassword)) {
      setSuccessMessage("Password must contain uppercase, lowercase, number and special character");
      setShowSuccess(true);
      return;
    }

    if (newPassword.length < 8) {
      setSuccessMessage("Password must be at least 8 characters long");
      setShowSuccess(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSuccessMessage("New password and confirm password do not match");
      setShowSuccess(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/User/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: user.email, 
          currentPassword,
          newPassword 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSuccessMessage(data.error || "Failed to update password");
        setShowSuccess(true);
        return;
      }

      setSuccessMessage("Password updated successfully!");
      setShowSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStrength({ score: 0, text: '', color: '' });
    } catch (err) {
      console.error(err);
      setSuccessMessage("Error updating password");
      setShowSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  const refreshProfile = () => {
    const userRole = localStorage.getItem("userRole");
    
    if (userRole === "super-admin") {
      const userEmail = localStorage.getItem("userEmail");
      setUser({
        email: userEmail,
        firstName: "Super",
        lastName: "Admin",
        role: "Administrator",
        department: "Management",
        employeeId: "ADMIN001"
      });
      return;
    }

    const employeeId = localStorage.getItem("employeeId");
    if (employeeId) {
      fetch(`/api/Employee/${employeeId}`)
        .then((res) => {
          if (res.status === 404) {
            setSuccessMessage("Employee profile not found. Contact admin to create your profile.");
            setShowSuccess(true);
            return null;
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            console.log("Refreshed employee data:", data);
            setUser(data);
          }
        })
        .catch((err) => {
          console.error("Refresh error:", err);
          setSuccessMessage(`Unable to refresh profile: ${err.message}`);
          setShowSuccess(true);
        });
    }
  };

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="d-flex justify-content-between align-items-center">
        <h2>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}'s Profile` : (localStorage.getItem("userRole") === "super-admin" ? "Admin Profile" : "Employee Profile")}</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => window.print()}>
            📄 View
          </button>
          <button className="btn btn-info" onClick={refreshProfile}>
            🔄 Refresh
          </button>
        </div>
      </div>
      {user.profileIncomplete && (
        <div className="alert alert-warning mt-4">
          <h5>⚠️ Profile Incomplete</h5>
          <p>Your detailed employee profile has not been created yet. Please contact your administrator to:</p>
          <ul>
            <li>Add your complete employee record through &quot;Add Employee&quot; feature</li>
            <li>Assign you to a department</li>
            <li>Fill in your personal and professional details</li>
          </ul>
          <p><strong>Currently showing basic login information only.</strong></p>
        </div>
      )}
      
      <div className="card p-4 mt-4">
        <div className="row">
          <div className="col-md-6">
            <h5>Personal Information</h5>
            <p><strong>Employee ID:</strong> {user.employeeId || 'N/A'}</p>
            <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
            <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
          </div>
          <div className="col-md-6">
            <h5>Work Information</h5>
            <p><strong>Department:</strong> {user.department || 'N/A'}</p>
            <p><strong>Role/Position:</strong> {user.role || localStorage.getItem('userRole') || 'N/A'}</p>
            <p><strong>Joining Date:</strong> {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Account Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Last Updated:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <h5>Emergency Contact</h5>
            <p><strong>Contact Person:</strong> {user.emergencyContact?.contactPerson || 'N/A'}</p>
            <p><strong>Contact Number:</strong> {user.emergencyContact?.contactNumber || 'N/A'}</p>
          </div>
          <div className="col-md-6">
            <h5>Payroll Information</h5>
            <p><strong>Salary:</strong> {user.payroll?.salary || 'N/A'} {user.payroll?.currency || ''}</p>
            <p><strong>Bonus:</strong> {user.payroll?.bonus || 'N/A'}</p>
            <p><strong>Deductions:</strong> {user.payroll?.deductions || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-4">
          <h5>Address Information</h5>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Street:</strong> {user.address?.street || 'N/A'}</p>
              <p><strong>City:</strong> {user.address?.city || 'N/A'}</p>
              <p><strong>State:</strong> {user.address?.state || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>ZIP Code:</strong> {user.address?.zip || 'N/A'}</p>
              <p><strong>Country:</strong> {user.address?.country || 'N/A'}</p>
            </div>
          </div>
        </div>

        {user.documents && user.documents.length > 0 && (
          <div className="mt-4">
            <h5>Documents</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Document Number</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.documents.map((doc, index) => (
                    <tr key={index}>
                      <td>{doc.docType || 'N/A'}</td>
                      <td>{doc.docNumber || 'N/A'}</td>
                      <td>{doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user.skills && user.skills.length > 0 && (
          <div className="mt-4">
            <h5>Skills & Expertise</h5>
            <div className="row">
              {user.skills.map((skill, index) => (
                <div key={index} className="col-md-6 mb-3">
                  <div className="card p-3">
                    <h6 className="mb-2">{skill.name}</h6>
                    <p className="mb-1"><strong>Level:</strong> {skill.level || 'N/A'}</p>
                    <p className="mb-1"><strong>Experience:</strong> {skill.yearsOfExperience || 'N/A'} years</p>
                    {skill.certifications && <p className="mb-0"><strong>Certifications:</strong> {skill.certifications}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.projects && user.projects.length > 0 && (
          <div className="mt-4">
            <h5>Project History</h5>
            <div className="row">
              {user.projects.map((project, index) => (
                <div key={index} className="col-md-6 mb-3">
                  <div className="card p-3">
                    <h6 className="mb-2">{project.projectName} ({project.projectId})</h6>
                    <p className="mb-1"><strong>Role:</strong> {project.roleInProject || 'N/A'}</p>
                    <p className="mb-1"><strong>Status:</strong> {project.status || 'N/A'}</p>
                    <p className="mb-1"><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="mb-1"><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</p>
                    {project.technologies && <p className="mb-0"><strong>Technologies:</strong> {project.technologies}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr />

        <h5>Change Password</h5>
        <form onSubmit={handleChangePassword} className="mb-3">
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <div className="position-relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{ textDecoration: 'none', padding: '0 10px' }}
              >
                <i className={`bi ${showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <div className="position-relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                className="form-control"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordStrength(checkPasswordStrength(e.target.value));
                }}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{ textDecoration: 'none', padding: '0 10px' }}
              >
                <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="flex-grow-1" style={{ height: '4px', backgroundColor: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(passwordStrength.score / 4) * 100}%`, height: '100%', backgroundColor: passwordStrength.color, transition: 'all 0.3s' }}></div>
                  </div>
                  <small style={{ color: passwordStrength.color, fontWeight: 'bold', minWidth: '60px' }}>{passwordStrength.text}</small>
                </div>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Must contain: uppercase, lowercase, number & special character (min 8 chars)</small>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm New Password</label>
            <div className="position-relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ textDecoration: 'none', padding: '0 10px' }}
              >
                <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <small className="text-danger">Passwords do not match</small>
            )}
          </div>
          <button className="btn btn-warning" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        
      </div>
    </Layout>
  );
}
