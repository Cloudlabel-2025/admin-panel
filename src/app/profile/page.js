"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const employeeId = localStorage.getItem("employeeId");
    const userRole = localStorage.getItem("userRole");
    if (!employeeId || userRole !== "employee") {
      router.push("/");
      return;
    }

    // Fetch employee data from department collections
    fetch(`/api/Employee/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Employee data received:", data);
        if (data.error) {
          localStorage.clear();
          router.push("/");
        } else {
          setUser(data);
        }
      })
      .catch((err) => {
        console.error(err);
        router.push("/");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
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

  const refreshProfile = () => {
    const employeeId = localStorage.getItem("employeeId");
    fetch(`/api/Employee/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Refreshed employee data:", data);
        if (!data.error) {
          setUser(data);
        }
      });
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center">
        <h2>Employee Profile</h2>
        <button className="btn btn-info" onClick={refreshProfile}>
          Refresh
        </button>
      </div>
      <div className="card p-4 mt-4">
        <div className="row">
          <div className="col-md-6">
            <h5>Personal Information</h5>
            <p><strong>Employee ID:</strong> {user.employeeId}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
          </div>
          <div className="col-md-6">
            <h5>Work Information</h5>
            <p><strong>Department:</strong> {user.department}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Joining Date:</strong> {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {user.emergencyContact && (
          <div className="mt-3">
            <h5>Emergency Contact</h5>
            <p><strong>Contact Person:</strong> {user.emergencyContact.contactPerson || 'N/A'}</p>
            <p><strong>Contact Number:</strong> {user.emergencyContact.contactNumber || 'N/A'}</p>
          </div>
        )}

        {user.address && (
          <div className="mt-3">
            <h5>Address</h5>
            <p><strong>Street:</strong> {user.address.street || 'N/A'}</p>
            <p><strong>City:</strong> {user.address.city || 'N/A'}</p>
            <p><strong>State:</strong> {user.address.state || 'N/A'}</p>
            <p><strong>Zip:</strong> {user.address.zip || 'N/A'}</p>
            <p><strong>Country:</strong> {user.address.country || 'N/A'}</p>
          </div>
        )}

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
        
      </div>
    </Layout>
  );
}
