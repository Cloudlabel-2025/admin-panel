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
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6 col-sm-8">
            <div className="card border-0" style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.3)',
              position: 'relative',
              zIndex: 1
            }}>
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                  }}>
                    <i className="bi bi-shield-lock" style={{ fontSize: '28px', color: '#1a1a1a' }}></i>
                  </div>
                  <h2 className="fw-bold mb-2" style={{
                    backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '1px',
                    fontWeight: '700'
                  }}>
                    {isLogin ? "Welcome Back" : "Join Our Team"}
                  </h2>
                  <p className="mb-0" style={{
                    backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    opacity: 0.9
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
                    <label className="form-label" style={{
                      backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '500'
                    }}>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      suppressHydrationWarning
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '10px',
                        color: '#f4e5c3',
                        padding: '12px 16px'
                      }}
                      onFocus={(e) => {
                        e.target.placeholder = '';
                        e.target.style.borderColor = '#d4af37';
                        e.target.style.boxShadow = '0 0 0 0.2rem rgba(212, 175, 55, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.target.placeholder = 'Enter your email';
                        e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <div className={isLogin ? "mb-4" : "mb-2"}>
                    <label className="form-label" style={{
                      backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '500'
                    }}>Password</label>
                    <div className="position-relative">
                      <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter your password"
                        onChange={(e) => {
                          if (!isLogin) setPasswordStrength(checkPasswordStrength(e.target.value));
                        }}
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
                          e.target.placeholder = 'Enter your password';
                          e.target.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ textDecoration: 'none', padding: '0 12px', color: '#d4af37' }}
                        suppressHydrationWarning
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
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

                  <button 
                    type="submit" 
                    className="btn w-100 py-3 fw-semibold" 
                    suppressHydrationWarning
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#1a1a1a',
                      fontSize: '16px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(212, 175, 55, 0.3)';
                    }}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </button>
                </form>

                <div className="text-center mt-3">
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
                      backgroundImage: 'linear-gradient(90deg, #D4AF37 0%, #F4E5C3 50%, #C9A961 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textDecoration: 'none',
                      fontWeight: '500'
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
