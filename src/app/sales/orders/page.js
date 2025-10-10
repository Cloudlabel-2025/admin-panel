"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/sales/orders");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📋 Sales Orders</h1>
        <Link href="/sales/orders/create" className="btn btn-primary">
          ➕ Create Order
        </Link>
      </div>

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.customer?.name}</td>
                <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                <td>${order.totalAmount}</td>
                <td>
                  <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : order.status === 'Confirmed' ? 'bg-warning' : 'bg-secondary'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <Link href={`/sales/orders/${order._id}/edit`} className="btn btn-sm btn-warning">
                    ✏️ Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}