"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function AccountSettingsPage() {
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

    setUser({ email: userEmail, role: userRole });
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

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="card shadow-sm mb-4" style={{background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)', border: 'none'}}>
        <div className="card-body">
          <h2 className="text-white mb-1">
            <i className="bi bi-shield-lock me-2"></i>
            Account Settings
          </h2>
          <small className="text-white-50">Manage your account security and preferences</small>
        </div>
      </div>

      <div className="card shadow-sm" style={{borderRadius: '12px'}}>
        <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '12px 12px 0 0'}}>
          <h5 className="mb-0"><i className="bi bi-key me-2"></i>Change Password</h5>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleChangePassword}>
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
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
