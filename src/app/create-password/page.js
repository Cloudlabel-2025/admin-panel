"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePasswordPage({ searchParams }) {
  const router = useRouter();
  const email = searchParams?.email;

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreatePassword = async () => {
    if (!password) return setError("Password cannot be empty");
    try {
      const res = await fetch("/api/User/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        router.push("/login");
      }
    } catch {
      setError("Server error. Try again.");
    }
  };

  if (!email) return <p>Email is required</p>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Create Password</h2>
      <p>Email: {email}</p>
      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-danger">{error}</p>}
      <button className="btn btn-primary" onClick={handleCreatePassword}>
        Create Account
      </button>
    </div>
  );
}
