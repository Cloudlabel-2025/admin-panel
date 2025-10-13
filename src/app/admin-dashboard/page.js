"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");




    if (!(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "Team-Lead" || role === "Team-admin")) {

      router.push("/");
      return;
    }


    setUserRole(role);
    if (role === "admin") {
      fetchNotifications();
    }
    setLoading(false);
  }, [router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?role=admin");
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading || !(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin")) {
    return <Layout><div>Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="row">
        <div className="col-md-8">
          <h2>
            {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Admin Dashboard" : "Team Management Dashboard"}
          </h2>
          <p className="mt-4">
            {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ?
              "Welcome to the admin panel. Use the sidebar to navigate." :
              "Welcome to the team management panel. Use the sidebar to navigate."}
          </p>
        </div>
        
        {/* Notifications Panel for Admin */}
        {userRole === "admin" && (
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">🔔 Notifications</h5>
              </div>
              <div className="card-body" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <p className="text-muted">No new notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className={`alert ${notification.read ? 'alert-secondary' : 'alert-info'} alert-dismissible`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{notification.title}</strong>
                          <p className="mb-1">{notification.message}</p>
                          <small className="text-muted">
                            {new Date(notification.createdAt).toLocaleDateString('en-IN')}
                          </small>
                        </div>
                        {!notification.read && (
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => markAsRead(notification._id)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}