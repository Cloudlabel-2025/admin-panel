"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Check if super admin
      if (email === "admin@gmail.com" && password === "Admin") {
        localStorage.setItem("userRole", "super-admin");
        localStorage.setItem("userEmail", email);
        alert("Super Admin login successful");
        router.push("/admin-dashboard");
        return;
      }

      // Regular employee login
      const res = await fetch("/api/User/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error);

      localStorage.setItem("employeeId", data.user.employeeId);
      localStorage.setItem("userRole", "employee");
      localStorage.setItem("userEmail", email);
      alert("Employee login successful");
      router.push("/timecard-entry");
    } catch (err) {
      console.error(err);
      alert("Login failed");
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
      if (!res.ok) return alert(data.error);

      alert("Signup successful! You can now login.");
      setIsLogin(true);
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                {isLogin ? "Login" : "Employee Signup"}
              </h2>
              
              <form onSubmit={isLogin ? handleLogin : handleSignup}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  {isLogin ? "Login" : "Sign Up"}
                </button>
              </form>
              
              <div className="text-center mt-3">
                <button 
                  className="btn btn-link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail("");
                    setPassword("");
                  }}
                >
                  {isLogin ? "New employee? Sign up here" : "Already have account? Login here"}
                </button>
              </div>
              
              {isLogin && (
                <div className="text-center mt-2">
                  <small className="text-muted">
                    Super Admin: admin@gmail.com / Admin
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
