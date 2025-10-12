"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");




    if (!(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "Team-Lead" || role === "Team-admin")) {

      router.push("/");
      return;
    }


    setUserRole(role);
  }, [router]);

  if (!(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin" || userRole === "Team-Lead" || userRole === "Team-admin")) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <h2>
        {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ? "Admin Dashboard" : "Team Management Dashboard"}
      </h2>
      <p className="mt-4">
        {(userRole === "super-admin" || userRole === "Super-admin" || userRole === "admin") ?
          "Welcome to the admin panel. Use the sidebar to navigate." :
          "Welcome to the team management panel. Use the sidebar to navigate."}
      </p>
    </Layout>
  );
}