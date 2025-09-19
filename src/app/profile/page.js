"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      router.push("/login");
      return;
    }

    // Fetch user data from DB using employeeId
    fetch(`/api/User/get-user?employeeId=${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          localStorage.removeItem("employeeId");
          router.push("/login");
        } else {
          setUser(data.user);
        }
      })
      .catch((err) => {
        console.error(err);
        router.push("/login");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("employeeId");
    router.push("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return alert("Enter new password");

    setLoading(true);
    try {
      const res = await fetch("/api/User/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to update password");

      alert("Password updated successfully!");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert("Error updating password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Hi, {user.name}</h2>
      <div className="card col-md-8 mx-auto p-3">
        <p><strong>Employee ID:</strong> {user.employeeId}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Department:</strong> {user.department}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Joining Date:</strong> {new Date(user.joiningDate).toLocaleDateString()}</p>

        <hr />

        <h5>Change Password</h5>
        <form onSubmit={handleChangePassword} className="mb-3">
          <div className="mb-2">
            <input
              type="password"
              placeholder="New Password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-warning" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <button className="btn btn-danger mt-3" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
