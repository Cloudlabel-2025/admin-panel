"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/User/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("employeeId", data.user.employeeId);
      localStorage.setItem("userId", data.user._id || data.user.id);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("userName", data.user.name);

      setShowSuccess(true);
      
      setTimeout(() => {
        const userRole = data.user.role;
        if (userRole === "super-admin" || userRole === "Super-admin" || userRole === "developer") {
          router.push("/admin-dashboard");
        } else if (userRole === "admin") {
          router.push("/admin-dashboard");
        } else if (userRole === "Team-Lead" || userRole === "Team-admin") {
          router.push("/admin/monitor");
        } else {
          router.push("/timecard-entry");
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Login failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) {
      setError("Password must contain uppercase, lowercase, number and special character");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    try {
      const res = await fetch("/api/User/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
        return;
      }

      setShowSignupSuccess(true);
      setTimeout(() => {
        setShowSignupSuccess(false);
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Signup failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      {showSignupSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3 d-flex flex-column align-items-center justify-content-center shadow-lg p-4" style={{ minWidth: '250px', animation: 'fadeIn 0.5s ease-in-out' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
              <path d="M9 12L11 14L15 10" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
            <h5 className="text-success mb-2">Account Created!</h5>
            <p className="text-muted text-center mb-0">You can now login with your credentials</p>
          </div>
        </div>
      )}
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{
        backgroundImage: 'url("/bg-6.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6 col-sm-8">
            <div className="card border-0" style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '15px',
              boxShadow: '0 8px 32px rgba(31,38,135,0.37)'
            }}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="text-dark fw-bold mb-2">
                    {isLogin ? "Welcome Back" : "Join Our Team"}
                  </h2>
                  <p className="text-dark mb-0" style={{opacity: 0.8}}>
                    {isLogin ? "Sign in to your account" : "Create your employee account"}
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={isLogin ? handleLogin : handleSignup}>
                  <div className="mb-3">
                    <label className="form-label text-dark">Email</label>
                    <input
                      type="email"
                      className="form-control text-dark"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      suppressHydrationWarning
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      onFocus={(e) => e.target.placeholder = ''}
                      onBlur={(e) => e.target.placeholder = 'Enter your email'}
                    />
                  </div>
                  
                  <div className={isLogin ? "mb-4" : "mb-2"}>
                    <label className="form-label text-dark">Password</label>
                    <input
                      type="password"
                      className="form-control text-dark"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (!isLogin) setPasswordStrength(checkPasswordStrength(e.target.value));
                      }}
                      autoComplete="current-password"
                      required
                      suppressHydrationWarning
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      onFocus={(e) => e.target.placeholder = ''}
                      onBlur={(e) => e.target.placeholder = 'Enter your password'}
                    />
                    {!isLogin && password && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="flex-grow-1" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${(passwordStrength.score / 4) * 100}%`, height: '100%', backgroundColor: passwordStrength.color, transition: 'all 0.3s' }}></div>
                          </div>
                          <small style={{ color: passwordStrength.color, fontWeight: 'bold', minWidth: '60px' }}>{passwordStrength.text}</small>
                        </div>
                        <small className="text-dark" style={{ opacity: 0.7, fontSize: '0.75rem' }}>Must contain: uppercase, lowercase, number & special character</small>
                      </div>
                    )}
                  </div>

                  {!isLogin && (
                    <div className="mb-4">
                      <label className="form-label text-dark">Confirm Password</label>
                      <input
                        type="password"
                        className="form-control text-dark"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                        suppressHydrationWarning
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                        onFocus={(e) => e.target.placeholder = ''}
                        onBlur={(e) => e.target.placeholder = 'Confirm your password'}
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn w-100 py-2  fw-semibold" 
                    suppressHydrationWarning
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(10, 8, 8, 0.3)',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#535353';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                      e.target.style.color = '#000';
                    }}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    className="btn btn-link text-dark p-0"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setPasswordStrength({ score: 0, text: '', color: '' });
                      setError("");
                    }}
                    suppressHydrationWarning
                    style={{opacity: 0.8, textDecoration: 'none'}}
                  >
                    {isLogin ? "New employee? Create account" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes drawCircle {
          from { stroke-dasharray: 0 63; }
          to { stroke-dasharray: 63 63; }
        }
        @keyframes drawCheck {
          from { stroke-dasharray: 0 20; }
          to { stroke-dasharray: 20 20; }
        }
      `}</style>
    </>
  );
}
