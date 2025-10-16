"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);

      setShowSuccess(true);
      
      // Route based on role from server after animation
      setTimeout(() => {
        if (data.user.role === "super-admin") {
          router.push("/admin-dashboard");
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
              <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
          </div>
        </div>
      )}
      {showSignupSuccess && (
        <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3 d-flex flex-column align-items-center justify-content-center shadow-lg p-4" style={{ minWidth: '250px', animation: 'fadeIn 0.5s ease-in-out' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
              <path d="M9 12L11 14L15 10" stroke="#28a745" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
              <circle cx="12" cy="12" r="10" stroke="#28a745" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
            </svg>
            <h5 className="text-success mb-2">Account Created!</h5>
            <p className="text-muted text-center mb-0">You can now login with your credentials</p>
          </div>
        </div>
      )}
      {error && (
        <div className="position-fixed top-0 end-0 m-3" style={{ zIndex: 9999 }}>
          <div className="alert alert-danger mb-0" style={{ borderRadius: '8px' }}>
            {error}
          </div>
        </div>
      )}
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{
        backgroundImage: 'url("/login-bg.jpg")',
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
                  <h2 className="text-white fw-bold mb-2">
                    {isLogin ? "Welcome Back" : "Join Our Team"}
                  </h2>
                  <p className="text-white mb-0" style={{opacity: 0.8}}>
                    {isLogin ? "Sign in to your account" : "Create your employee account"}
                  </p>
                </div>

                <form onSubmit={isLogin ? handleLogin : handleSignup}>
                  <div className="mb-3">
                    <label className="form-label text-white">Email</label>
                    <input
                      type="email"
                      className="form-control text-white"
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
                  
                  <div className="mb-4">
                    <label className="form-label text-white">Password</label>
                    <input
                      type="password"
                      className="form-control text-white"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                  </div>

                  <button 
                    type="submit" 
                    className="btn w-100 py-2 text-white fw-semibold" 
                    suppressHydrationWarning
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
                      e.target.style.color = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
                      e.target.style.color = '#fff';
                    }}
                  >
                    {isLogin ? "Sign In" : "Create Account"}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    className="btn btn-link text-white p-0"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setEmail("");
                      setPassword("");
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
