"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "super-admin") {
      router.push("/");
      return;
    }
    setUserRole(role);
  }, [router]);

  if (userRole !== "super-admin") {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <h2>Super Admin Dashboard</h2>
      <p className="mt-4">Welcome to the admin panel. Use the sidebar to navigate.</p>
    </Layout>
  );
}