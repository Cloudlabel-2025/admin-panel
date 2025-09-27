"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userEmail = localStorage.getItem("userEmail");
    
    if (!userRole || !userEmail) {
      router.push("/");
      return;
    }

    // Handle super admin profile
    if (userRole === "super-admin") {
      setUser({
        email: userEmail,
        firstName: "Super",
        lastName: "Admin",
        role: "Administrator",
        department: "Management",
        employeeId: "ADMIN001"
      });
      return;
    }

    // Handle employee profile
    const employeeId = localStorage.getItem("employeeId");
    if (!employeeId) {
      router.push("/");
      return;
    }

    fetch(`/api/Employee/${employeeId}`)
      .then((res) => {
        if (!res.ok) {
          console.error(`Employee API returned ${res.status}`);
          if (res.status === 404) {
            alert(`Employee ${employeeId} not found in database. Please contact admin.`);
          }
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Employee data received:", data);
        setUser(data);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        alert("Unable to load profile. Please try again or contact admin.");
        router.push("/");
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };



  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return alert("Enter current and new password");

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
      if (!res.ok) return alert(data.error || "Failed to update password");

      alert("Password updated successfully!");
      setCurrentPassword("");
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
    const userRole = localStorage.getItem("userRole");
    
    if (userRole === "super-admin") {
      const userEmail = localStorage.getItem("userEmail");
      setUser({
        email: userEmail,
        firstName: "Super",
        lastName: "Admin",
        role: "Administrator",
        department: "Management",
        employeeId: "ADMIN001"
      });
      return;
    }

    const employeeId = localStorage.getItem("employeeId");
    if (employeeId) {
      fetch(`/api/Employee/${employeeId}`)
        .then((res) => {
          if (!res.ok) {
            console.error(`Refresh: Employee API returned ${res.status}`);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            setUser(data);
          }
        })
        .catch((err) => {
          console.error("Refresh error:", err);
        });
    }
  };

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center">
        <h2>{localStorage.getItem("userRole") === "super-admin" ? "Admin Profile" : "Employee Profile"}</h2>
        <button className="btn btn-info" onClick={refreshProfile}>
          Refresh
        </button>
      </div>
      <div className="card p-4 mt-4">
        <div className="row">
          <div className="col-md-6">
            <h5>Personal Information</h5>
            <p><strong>Employee ID:</strong> {user.employeeId || 'N/A'}</p>
            <p><strong>Name:</strong> {user.firstName || 'N/A'} {user.lastName || ''}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
          </div>
          <div className="col-md-6">
            <h5>Work Information</h5>
            <p><strong>Department:</strong> {user.department || 'N/A'}</p>
            <p><strong>Role:</strong> {user.role || 'N/A'}</p>
            <p><strong>Joining Date:</strong> {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</p>
            {user.salary && <p><strong>Salary:</strong> {user.payroll?.salary || 'N/A'}</p>}
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

        {user.skills && user.skills.length > 0 && (
          <div className="mt-3">
            <h5>Skills</h5>
            <div className="row">
              {user.skills.map((skill, index) => (
                <div key={index} className="col-md-6 mb-2">
                  <div className="card p-2">
                    <p className="mb-1"><strong>{skill.name}</strong></p>
                    <small>Level: {skill.level} | Experience: {skill.yearsOfExperience} years</small>
                    {skill.certifications && <small className="d-block">Certifications: {skill.certifications}</small>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.projects && user.projects.length > 0 && (
          <div className="mt-3">
            <h5>Projects</h5>
            <div className="row">
              {user.projects.map((project, index) => (
                <div key={index} className="col-md-6 mb-2">
                  <div className="card p-2">
                    <p className="mb-1"><strong>{project.projectName}</strong> ({project.projectId})</p>
                    <small>Role: {project.roleInProject}</small>
                    <small className="d-block">Status: {project.status}</small>
                    {project.technologies && <small className="d-block">Tech: {project.technologies}</small>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr />

        <h5>Change Password</h5>
        <form onSubmit={handleChangePassword} className="mb-3">
          <div className="mb-2">
            <input
              type="password"
              placeholder="Current Password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
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
