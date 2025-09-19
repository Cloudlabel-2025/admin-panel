"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Validate email exists in Employee DB
  const handleEmailCheck = async (e) => {
    e.preventDefault();
    if (!email) return alert("Enter email");

    setLoading(true);
    try {
      const res = await fetch("/api/User/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) return alert(data.error);
      setStep(2); // Show password field
    } catch (err) {
      console.error(err);
      alert("Error validating email");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create user
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!password) return alert("Enter password");

    setLoading(true);
    try {
      const res = await fetch("/api/User/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) return alert(data.error);
      alert("Signup successful! Please login.");
      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Signup</h2>
      <form
        onSubmit={step === 1 ? handleEmailCheck : handleSignup}
        className="col-md-6 mx-auto"
      >
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={step === 2}
          />
        </div>

        {step === 2 && (
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Processing..." : step === 1 ? "Next" : "Signup"}
        </button>
      </form>
    </div>
  );
}
