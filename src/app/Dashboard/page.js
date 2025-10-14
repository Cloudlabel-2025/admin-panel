"use client";
import { useState } from "react";
import { Card } from "react-bootstrap";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const barData = [
    { month: "Jan", attendance: 90, payroll: 75000 },
    { month: "Feb", attendance: 85, payroll: 72000 },
    { month: "Mar", attendance: 88, payroll: 76000 },
    { month: "Apr", attendance: 92, payroll: 81000 },
    { month: "May", attendance: 95, payroll: 83000 },
  ];

  const pieData = [
    { name: "Development", value: 45 },
    { name: "HR", value: 15 },
    { name: "Sales", value: 25 },
    { name: "Support", value: 15 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const cards = [
    { title: "Total Employees", value: 120, color: "#007bff" },
    { title: "Attendance Rate", value: "91%", color: "#6610f2" },
    { title: "Departments", value: 6, color: "#20c997" },
    { title: "Pending Leaves", value: 8, color: "#fd7e14" },
  ];

  return (
    <div className="container-fluid py-5" style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <h2 className="mb-4 text-center fw-bold" style={{ color: "#343a40" }}>
        Dashboard Overview
      </h2>

      {/* Cards Section */}
      <div className="row g-4 mb-5">
        {cards.map((card, idx) => (
          <div className="col-md-3 col-sm-6" key={idx}>
            <Card
              className="shadow-sm text-center border-0 card-hover"
              style={{
                borderRadius: "18px",
                background: `linear-gradient(135deg, ${card.color} 0%, #4facfe 100%)`,
                color: "white",
                transition: "transform 0.3s ease",
              }}
            >
              <Card.Body>
                <Card.Title className="fw-semibold">{card.title}</Card.Title>
                <h2 className="fw-bold mt-2">{card.value}</h2>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="row">
        {/* Bar Chart */}
        <div className="col-lg-8 col-md-12 mb-4">
          <Card className="shadow-lg border-0" style={{ borderRadius: "20px" }}>
            <Card.Body>
              <Card.Title className="fw-semibold text-secondary mb-3">
                Monthly Attendance & Payroll Trend
              </Card.Title>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData} barGap={8}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007bff" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#66b2ff" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="attendance"
                    fill="url(#barGradient)"
                    radius={[10, 10, 0, 0]}
                    name="Attendance %"
                  />
                  <Bar
                    dataKey="payroll"
                    fill="#20c997"
                    radius={[10, 10, 0, 0]}
                    name="Payroll ₹"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="col-lg-4 col-md-12 mb-4">
          <Card className="shadow-lg border-0" style={{ borderRadius: "20px" }}>
            <Card.Body>
              <Card.Title className="fw-semibold text-secondary mb-3 text-center">
                Department Distribution
              </Card.Title>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={110}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
