"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    localStorage.clear();
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  }, []);

  useEffect(() => {
    const observers = [];
    
    const protectInput = (input, expectedType) => {
      if (!input) return;
    
      const observer = new MutationObserver(() => {
        if (input.getAttribute('type') !== expectedType) {
          input.setAttribute('type', expectedType);
        }
      });
      observer.observe(input, { attributes: true, attributeFilter: ['type'] });
      observers.push(observer);
    };

    if (passwordRef.current) {
      protectInput(passwordRef.current, showPassword ? 'text' : 'password');
    }
    if (confirmPasswordRef.current) {
      protectInput(confirmPasswordRef.current, showConfirmPassword ? 'text' : 'password');
    }

    return () => observers.forEach(obs => obs.disconnect());
  }, [showPassword, showConfirmPassword]);

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
    const password = passwordRef.current?.value || "";
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
    const password = passwordRef.current?.value || "";
    const confirmPassword = confirmPasswordRef.current?.value || "";
    
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
        if (passwordRef.current) passwordRef.current.value = "";
        if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Signup failed");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/User/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
        return;
      }
      setOtpSent(true);
      setError("");
    } catch (err) {
      setError("Failed to send OTP");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      setError("Please fill all fields");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(newPassword)) {
      setError("Password must contain uppercase, lowercase, number and special character");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/User/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setTimeout(() => setError(""), 3000);
        return;
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowForgotPassword(false);
        setOtpSent(false);
        setOtp("");
        setNewPassword("");
        setEmail("");
      }, 2000);
    } catch (err) {
      setError("Failed to reset password");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-lg" style={{ width: '120px', height: '120px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      {showSignupSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3 d-flex flex-column align-items-center justify-content-center shadow-lg p-4" style={{ minWidth: '250px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
              <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
            <h5 className="mb-2" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700' }}>Account Created!</h5>
            <p className="text-muted text-center mb-0">You can now login with your credentials</p>
          </div>
        </div>
      )}
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{
        backgroundImage: 'url("/bg-7.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.7) 0%, rgba(45, 45, 45, 0.7) 100%)',
          pointerEvents: 'none'
        }}></div>
      <div className="container-fluid px-3 py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-9 col-md-7 col-lg-5 col-xl-4">
            <div className="card border-0 login-card" style={{
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
              backgroundColor: 'rgba(26, 26, 26, 0.4)',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              position: 'relative',
              zIndex: 1,
              overflow: 'hidden'
            }}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 50%, #d4af37 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 20px rgba(212, 175, 55, 0.3)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '28px', color: '#1a1a1a' }}></i>
                  </div>
                  <h2 className="fw-bold mb-2 text-center" style={{
                    backgroundImage: 'linear-gradient(135deg, #D4AF37 0%, #F4E5C3 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.5px',
                    fontWeight: '700',
                    fontSize: 'clamp(1.4rem, 4vw, 1.75rem)'
                  }}>
                    {isLogin ? "Welcome Back" : "Join Our Team"}
                  </h2>
                  <p className="mb-0 text-center" style={{
                    color: '#f4e5c3',
                    opacity: 0.7,
                    fontSize: '0.9rem',
                    fontWeight: '400'
                  }}>
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
                    <label className="form-label mb-2" style={{
                      color: '#d4af37',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      letterSpacing: '0.3px'
                    }}>
                      <i className="bi bi-envelope-fill me-2"></i>Email
                    </label>
                    <input
                      type="email"
                      className="form-control custom-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      suppressHydrationWarning
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '2px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '10px',
                        color: '#f4e5c3',
                        padding: '12px 16px',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.placeholder = '';
                        e.target.style.borderColor = '#d4af37';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        e.target.style.boxShadow = '0 0 0 4px rgba(212, 175, 55, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.placeholder = 'Enter your email';
                        e.target.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <div className={isLogin ? "mb-3" : "mb-3"}>
                    <label className="form-label mb-2" style={{
                      color: '#d4af37',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      letterSpacing: '0.3px'
                    }}>
                      <i className="bi bi-lock-fill me-2"></i>Password
                    </label>
                    <div className="position-relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        className="form-control custom-input"
                        placeholder="Enter your password"
                        onChange={(e) => {
                          if (!isLogin) setPasswordStrength(checkPasswordStrength(e.target.value));
                        }}
                        onPaste={(e) => e.preventDefault()}
                        autoComplete="off"
                        required
                        suppressHydrationWarning
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '2px solid rgba(212, 175, 55, 0.2)',
                          borderRadius: '10px',
                          color: '#f4e5c3',
                          padding: '12px 16px',
                          paddingRight: '45px',
                          fontSize: '0.95rem',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                          e.target.placeholder = '';
                          e.target.style.borderColor = '#d4af37';
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.boxShadow = '0 0 0 4px rgba(212, 175, 55, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.placeholder = 'Enter your password';
                          e.target.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ textDecoration: 'none', padding: '0 14px', color: '#d4af37', fontSize: '1.1rem' }}
                        suppressHydrationWarning
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {!isLogin && passwordStrength.score > 0 && (
                      <div className="mt-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="flex-grow-1" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${(passwordStrength.score / 4) * 100}%`, height: '100%', backgroundColor: passwordStrength.color, transition: 'all 0.3s' }}></div>
                          </div>
                          <small style={{ color: passwordStrength.color, fontWeight: 'bold', minWidth: '60px' }}>{passwordStrength.text}</small>
                        </div>
                        <small style={{ color: '#f4e5c3', opacity: 0.7, fontSize: '0.75rem' }}>Must contain: uppercase, lowercase, number & special character</small>
                      </div>
                    )}
                  </div>

                  {!isLogin && (
                    <div className="mb-4">
                      <label className="form-label" style={{
                        backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '500'
                      }}>Confirm Password</label>
                      <div className="position-relative">
                        <input
                          ref={confirmPasswordRef}
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          placeholder="Confirm your password"
                          onPaste={(e) => e.preventDefault()}
                          autoComplete="off"
                          required
                          suppressHydrationWarning
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            borderRadius: '10px',
                            color: '#f4e5c3',
                            padding: '12px 16px',
                            paddingRight: '45px'
                          }}
                          onFocus={(e) => {
                            e.target.placeholder = '';
                            e.target.style.borderColor = '#d4af37';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(212, 175, 55, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.target.placeholder = 'Confirm your password';
                            e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ textDecoration: 'none', padding: '0 12px', color: '#d4af37' }}
                          suppressHydrationWarning
                        >
                          <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="d-flex justify-content-center mt-3">
                    <button 
                      type="submit" 
                      className="btn py-2 fw-semibold submit-btn" 
                      suppressHydrationWarning
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 50%, #d4af37 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#1a1a1a',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
                        width: '100%',
                        maxWidth: '280px',
                        transition: 'all 0.3s ease',
                        textTransform: 'uppercase',
                        padding: '12px'
                      }}
                    >
                      <i className={`bi ${isLogin ? 'bi-box-arrow-in-right' : 'bi-person-plus-fill'} me-2`}></i>
                      {isLogin ? "Sign In" : "Create Account"}
                    </button>
                  </div>
                </form>

                {isLogin && (
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => setShowForgotPassword(true)}
                      suppressHydrationWarning
                      style={{
                        color: '#d4af37',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '0.9rem'
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                <div className="text-center mt-2">
                  <button
                    className="btn btn-link p-0"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setEmail("");
                      if (passwordRef.current) passwordRef.current.value = "";
                      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
                      setPasswordStrength({ score: 0, text: '', color: '' });
                      setError("");
                      setShowPassword(false);
                      setShowConfirmPassword(false);
                    }}
                    suppressHydrationWarning
                    style={{
                      color: '#f4e5c3',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      opacity: 0.9
                    }}
                  >
                    {isLogin ? "New employee? Create account" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="card border-0" style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.3)',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ color: '#d4af37', fontWeight: '700' }}>
                  <i className="bi bi-key-fill me-2"></i>Reset Password
                </h5>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setOtpSent(false);
                    setOtp("");
                    setNewPassword("");
                    setError("");
                  }}
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a' }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {!otpSent ? (
                <>
                  <p style={{ color: '#f4e5c3', fontSize: '14px' }}>Enter your email to receive OTP</p>
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: '#f4e5c3',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                  <button
                    className="btn w-100"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: '#f4e5c3', fontSize: '14px' }}>OTP sent! Check console. Enter OTP and new password.</p>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: '#f4e5c3',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: '#f4e5c3',
                        padding: '12px 16px'
                      }}
                    />
                  </div>
                  <button
                    className="btn w-100"
                    onClick={handleResetPassword}
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
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
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4), 0 0 0 4px rgba(212, 175, 55, 0.1); }
          50% { transform: scale(1.05); box-shadow: 0 12px 32px rgba(212, 175, 55, 0.6), 0 0 0 6px rgba(212, 175, 55, 0.2); }
        }
        .login-card {
          animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-input::placeholder {
          color: rgba(244, 229, 195, 0.4);
        }
        .custom-input {
          width: 100%;
          box-sizing: border-box;
        }
        .login-card {
          max-width: 420px;
          margin: 0 auto;
        }
        
        /* Extra Small Mobile (< 412px) */
        @media (max-width: 411px) {
          .login-card {
            border-radius: 16px !important;
            background-color: rgba(26, 26, 26, 0.5) !important;
            max-width: 100% !important;
          }
          .login-card .card-body {
            padding: 1.5rem !important;
          }
          .submit-btn {
            max-width: 100% !important;
            font-size: 0.9rem !important;
            padding: 10px !important;
          }
          .custom-input {
            padding: 10px 14px !important;
            font-size: 0.9rem !important;
          }
          .form-label {
            font-size: 0.85rem !important;
          }
        }
        
        /* 6.72 inch Display (412px - 575px) - Large phones like Samsung Galaxy S21+, Pixel 6 Pro */
        @media (min-width: 412px) and (max-width: 575px) {
          .login-card {
            border-radius: 18px !important;
            background-color: rgba(26, 26, 26, 0.48) !important;
            max-width: 95% !important;
          }
          .login-card .card-body {
            padding: 1.75rem !important;
          }
          .submit-btn {
            max-width: 100% !important;
            font-size: 0.95rem !important;
            padding: 11px !important;
          }
          .custom-input {
            padding: 11px 15px !important;
            font-size: 0.95rem !important;
          }
          .form-label {
            font-size: 0.9rem !important;
          }
        }
        
        /* Large Mobile & Small Tablets (Samsung Galaxy A51/71, 576px - 767px) */
        @media (min-width: 576px) and (max-width: 767px) {
          .login-card {
            border-radius: 18px !important;
            background-color: rgba(26, 26, 26, 0.48) !important;
            max-width: 480px !important;
          }
          .login-card .card-body {
            padding: 1.75rem 2rem !important;
          }
          .submit-btn {
            max-width: 100% !important;
            font-size: 0.95rem !important;
            padding: 11px !important;
          }
          .custom-input {
            padding: 11px 15px !important;
            font-size: 0.95rem !important;
          }
          .form-label {
            font-size: 0.9rem !important;
          }
        }
        
        /* iPad Mini Portrait & Small Tablets (768px - 820px) */
        @media (min-width: 768px) and (max-width: 820px) {
          .login-card {
            border-radius: 20px !important;
            background-color: rgba(26, 26, 26, 0.45) !important;
            max-width: 90% !important;
          }
          .login-card .card-body {
            padding: 2rem 2rem !important;
          }
          .submit-btn {
            max-width: 100% !important;
            font-size: 1rem !important;
            padding: 13px !important;
          }
          .custom-input {
            padding: 13px 17px !important;
            font-size: 1rem !important;
          }
          .form-label {
            font-size: 0.95rem !important;
          }
        }
        
        /* Larger Tablets (821px - 991px) */
        @media (min-width: 821px) and (max-width: 991px) {
          .login-card {
            border-radius: 20px !important;
            background-color: rgba(26, 26, 26, 0.45) !important;
            max-width: 540px !important;
          }
          .login-card .card-body {
            padding: 2rem 2.5rem !important;
          }
          .submit-btn {
            max-width: 100% !important;
            font-size: 1rem !important;
            padding: 13px !important;
          }
          .custom-input {
            padding: 13px 17px !important;
            font-size: 1rem !important;
          }
          .form-label {
            font-size: 0.95rem !important;
          }
        }
        
        /* Tablet Landscape & Small Desktop */
        @media (min-width: 992px) and (max-width: 1199px) {
          .login-card {
            border-radius: 20px !important;
            background-color: rgba(26, 26, 26, 0.42) !important;
            max-width: 450px !important;
          }
          .login-card .card-body {
            padding: 2rem !important;
          }
          .submit-btn:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 10px 28px rgba(212, 175, 55, 0.5) !important;
          }
        }
        
        /* Desktop styles */
        @media (min-width: 1200px) {
          .login-card {
            border-radius: 20px !important;
            background-color: rgba(26, 26, 26, 0.4) !important;
            max-width: 420px !important;
          }
          .login-card .card-body {
            padding: 2rem !important;
          }
          .submit-btn:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 12px 32px rgba(212, 175, 55, 0.6), 0 6px 16px rgba(0, 0, 0, 0.4) !important;
          }
          .submit-btn:active {
            transform: translateY(-1px) scale(0.98);
          }
        }
      `}</style>
    </>
  );
}
