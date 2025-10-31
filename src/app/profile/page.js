"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import SuccessMessage from "../components/SuccessMessage";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [showPictureMenu, setShowPictureMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

    console.log(`Fetching employee data for ID: ${employeeId}`);
    console.log(`Full API URL: /api/Employee/${employeeId}`);
    fetch(`/api/Employee/${employeeId}`)
      .then((res) => {
        if (res.status === 404) {
          // Employee record not found - show basic info
          setUser({
            employeeId: employeeId,
            firstName: "Not Set",
            lastName: "(Contact Admin)",
            email: userEmail,
            department: "Not Assigned",
            role: userRole || "Employee",
            profileIncomplete: true
          });
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          console.log("Employee data received:", data);
          setUser(data);
        }
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        setSuccessMessage(`Unable to load employee profile. Error: ${err.message}`);
        setShowSuccess(true);
      });
  }, [router]);



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
          if (res.status === 404) {
            setSuccessMessage("Employee profile not found. Contact admin to create your profile.");
            setShowSuccess(true);
            return null;
          }
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            console.log("Refreshed employee data:", data);
            setUser(data);
          }
        })
        .catch((err) => {
          console.error("Refresh error:", err);
          setSuccessMessage(`Unable to refresh profile: ${err.message}`);
          setShowSuccess(true);
        });
    }
  };

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="card shadow-sm mb-4" style={{background: 'linear-gradient(135deg, #2c3e50 0%, #1a252f 100%)', border: 'none'}}>
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div>
              <h2 className="text-white mb-1">
                <i className="bi bi-person-badge me-2"></i>
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}'s Profile` : (localStorage.getItem("userRole") === "super-admin" ? "Admin Profile" : "Employee Profile")}
              </h2>
              <small className="text-white-50">Manage your profile information and settings</small>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-light btn-sm" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i> Print
              </button>
              <button className="btn btn-outline-light btn-sm" onClick={refreshProfile}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      {user.profileIncomplete && (
        <div className="alert alert-warning mt-4">
          <h5>⚠️ Profile Incomplete</h5>
          <p>Your detailed employee profile has not been created yet. Please contact your administrator to:</p>
          <ul>
            <li>Add your complete employee record through &quot;Add Employee&quot; feature</li>
            <li>Assign you to a department</li>
            <li>Fill in your personal and professional details</li>
          </ul>
          <p><strong>Currently showing basic login information only.</strong></p>
        </div>
      )}
      
      <div className="card shadow-sm" style={{borderRadius: '12px'}}>
        {/* Profile Picture Section */}
        <div className="text-center py-4" style={{background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px 12px 0 0'}}>
          <div className="position-relative d-inline-block">
            <div 
              className="rounded-circle overflow-hidden bg-light d-flex align-items-center justify-content-center" 
              style={{width: '150px', height: '150px', border: '3px solid #d4af37'}}
            >
              {profilePicturePreview || user.profilePicture ? (
                <img 
                  src={profilePicturePreview || user.profilePicture} 
                  alt="Profile" 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <i className="bi bi-person-circle" style={{fontSize: '100px', color: '#ccc'}}></i>
              )}
            </div>
            <button 
              type="button"
              className="btn btn-warning btn-sm rounded-circle position-absolute" 
              style={{bottom: '5px', right: '5px', width: '40px', height: '40px', padding: '0'}}
              title="Manage Profile Picture"
              onClick={() => setShowPictureMenu(!showPictureMenu)}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-camera-fill"></i>
              )}
            </button>
            <input 
              type="file" 
              id="profilePictureInput" 
              className="d-none" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  setProfilePicture(file);
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64Image = reader.result;
                    setProfilePicturePreview(base64Image);
                    setShowPictureMenu(false);
                    
                    // Auto-save profile picture
                    setIsSaving(true);
                    try {
                      const employeeId = localStorage.getItem("employeeId");
                      const response = await fetch("/api/Employee/profile-picture", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ employeeId, profilePicture: base64Image })
                      });
                      
                      if (response.ok) {
                        setSuccessMessage("Profile picture updated successfully!");
                        setShowSuccess(true);
                        // Trigger Layout refresh
                        localStorage.setItem('profilePictureUpdated', Date.now().toString());
                        window.dispatchEvent(new Event('storage'));
                        // Refresh user data
                        refreshProfile();
                      } else {
                        setSuccessMessage("Failed to update profile picture");
                        setShowSuccess(true);
                      }
                    } catch (error) {
                      console.error("Error saving profile picture:", error);
                      setSuccessMessage("Error updating profile picture");
                      setShowSuccess(true);
                    } finally {
                      setIsSaving(false);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
          {showPictureMenu && (
            <div className="position-absolute bg-white shadow rounded p-2" style={{top: '160px', zIndex: 10, minWidth: '200px'}}>
              <button 
                className="btn btn-sm btn-light w-100 text-start mb-1"
                onClick={() => {
                  document.getElementById('profilePictureInput').click();
                }}
              >
                <i className="bi bi-upload me-2"></i>Change Picture
              </button>
              {(profilePicturePreview || user.profilePicture) && (
                <button 
                  className="btn btn-sm btn-light w-100 text-start text-danger"
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const employeeId = localStorage.getItem("employeeId");
                      const response = await fetch("/api/Employee/profile-picture", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ employeeId, profilePicture: "" })
                      });
                      
                      if (response.ok) {
                        setProfilePicture(null);
                        setProfilePicturePreview(null);
                        document.getElementById('profilePictureInput').value = '';
                        setShowPictureMenu(false);
                        setSuccessMessage("Profile picture removed successfully!");
                        setShowSuccess(true);
                        // Trigger Layout refresh
                        localStorage.setItem('profilePictureUpdated', Date.now().toString());
                        window.dispatchEvent(new Event('storage'));
                        refreshProfile();
                      } else {
                        setSuccessMessage("Failed to remove profile picture");
                        setShowSuccess(true);
                      }
                    } catch (error) {
                      console.error("Error removing profile picture:", error);
                      setSuccessMessage("Error removing profile picture");
                      setShowSuccess(true);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <i className="bi bi-trash me-2"></i>Remove Picture
                </button>
              )}
            </div>
          )}
          <div className="mt-2">
            <h5 className="mb-0">{user.firstName} {user.lastName}</h5>
            <small className="text-muted">{user.role || localStorage.getItem('userRole')}</small>
          </div>
        </div>
        
        <div className="row p-4">
          <div className="col-md-6 mb-4">
            <div className="card h-100" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
              <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '8px 8px 0 0'}}>
                <h5 className="mb-0"><i className="bi bi-person me-2"></i>Personal Information</h5>
              </div>
              <div className="card-body">
            <p><strong>Employee ID:</strong> {user.employeeId || 'N/A'}</p>
            <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
            <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> {user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card h-100" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
              <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '8px 8px 0 0'}}>
                <h5 className="mb-0"><i className="bi bi-briefcase me-2"></i>Work Information</h5>
              </div>
              <div className="card-body">
            <p><strong>Department:</strong> {user.department || 'N/A'}</p>
            <p><strong>Role/Position:</strong> {user.role || localStorage.getItem('userRole') || 'N/A'}</p>
            <p><strong>Joining Date:</strong> {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Account Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Last Updated:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row px-4">
          <div className="col-md-6 mb-4">
            <div className="card h-100" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
              <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '8px 8px 0 0'}}>
                <h5 className="mb-0"><i className="bi bi-telephone me-2"></i>Emergency Contact</h5>
              </div>
              <div className="card-body">
            <p><strong>Contact Person:</strong> {user.emergencyContact?.contactPerson || 'N/A'}</p>
            <p><strong>Contact Number:</strong> {user.emergencyContact?.contactNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="card h-100" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
              <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '8px 8px 0 0'}}>
                <h5 className="mb-0"><i className="bi bi-cash-stack me-2"></i>Payroll Information</h5>
              </div>
              <div className="card-body">
            <p><strong>Salary:</strong> {user.payroll?.salary || 'N/A'} {user.payroll?.currency || ''}</p>
            <p><strong>Bonus:</strong> {user.payroll?.bonus || 'N/A'}</p>
            <p><strong>Deductions:</strong> {user.payroll?.deductions || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="card" style={{border: '1px solid #dee2e6', borderRadius: '8px'}}>
            <div className="card-header" style={{background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', color: 'white', borderRadius: '8px 8px 0 0'}}>
              <h5 className="mb-0"><i className="bi bi-geo-alt me-2"></i>Address Information</h5>
            </div>
            <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Street:</strong> {user.address?.street || 'N/A'}</p>
              <p><strong>City:</strong> {user.address?.city || 'N/A'}</p>
              <p><strong>State:</strong> {user.address?.state || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>ZIP Code:</strong> {user.address?.zip || 'N/A'}</p>
              <p><strong>Country:</strong> {user.address?.country || 'N/A'}</p>
            </div>
          </div>
            </div>
          </div>
        </div>

        {user.documents && user.documents.length > 0 && (
          <div className="mt-4">
            <h5>Documents</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Document Number</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {user.documents.map((doc, index) => (
                    <tr key={index}>
                      <td>{doc.docType || 'N/A'}</td>
                      <td>{doc.docNumber || 'N/A'}</td>
                      <td>{doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}</td>
                      <td>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {user.skills && user.skills.length > 0 && (
          <div className="mt-4">
            <h5>Skills & Expertise</h5>
            <div className="row">
              {user.skills.map((skill, index) => (
                <div key={index} className="col-md-6 mb-3">
                  <div className="card p-3">
                    <h6 className="mb-2">{skill.name}</h6>
                    <p className="mb-1"><strong>Level:</strong> {skill.level || 'N/A'}</p>
                    <p className="mb-1"><strong>Experience:</strong> {skill.yearsOfExperience || 'N/A'} years</p>
                    {skill.certifications && <p className="mb-0"><strong>Certifications:</strong> {skill.certifications}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.projects && user.projects.length > 0 && (
          <div className="mt-4">
            <h5>Project History</h5>
            <div className="row">
              {user.projects.map((project, index) => (
                <div key={index} className="col-md-6 mb-3">
                  <div className="card p-3">
                    <h6 className="mb-2">{project.projectName} ({project.projectId})</h6>
                    <p className="mb-1"><strong>Role:</strong> {project.roleInProject || 'N/A'}</p>
                    <p className="mb-1"><strong>Status:</strong> {project.status || 'N/A'}</p>
                    <p className="mb-1"><strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="mb-1"><strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</p>
                    {project.technologies && <p className="mb-0"><strong>Technologies:</strong> {project.technologies}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </Layout>
  );
}
