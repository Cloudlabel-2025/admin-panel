'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newNotification, setNewNotification] = useState({
    employeeId: '',
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      router.push('/');
      return;
    }
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const role = localStorage.getItem('userRole');
      let url = '/api/notifications';
      
      if (role !== 'super-admin' && role !== 'Super-admin' && role !== 'developer') {
        url += `?employeeId=${employeeId}`;
      }
      
      if (filter !== 'all') {
        url += url.includes('?') ? '&' : '?';
        url += `status=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, isRead: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      setShowCreateForm(false);
      setNewNotification({ employeeId: '', title: '', message: '', type: 'info' });
      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : '';
  const isAdmin = userRole === 'super-admin' || userRole === 'Super-admin' || userRole === 'developer';

  return (
    <Layout>
      <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0" style={{ color: '#ffffff', textShadow: '2px 2px 4px rgba(212, 175, 55, 0.3)' }}>
              <i className="bi bi-bell-fill me-2" style={{ color: '#d4af37' }}></i>
              Notifications
            </h2>
            {isAdmin && (
              <button 
                className="btn btn-sm" 
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000', border: 'none' }}
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Create Notification
              </button>
            )}
          </div>
        </div>
      </div>

      {showCreateForm && isAdmin && (
        <div className="card shadow-sm mb-4" style={{ border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <h5 className="mb-3">Create New Notification</h5>
            <form onSubmit={createNotification}>
              <div className="mb-3">
                <label className="form-label">Employee ID <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={newNotification.employeeId}
                  onChange={(e) => setNewNotification({...newNotification, employeeId: e.target.value})}
                  required
                  placeholder="Enter employee ID or 'ALL' for all employees"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Title <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Message <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
        <div className="card-body p-4">
          <div className="d-flex gap-2 mb-4">
            <button 
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn btn-sm ${filter === 'unread' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
            <button 
              className={`btn btn-sm ${filter === 'read' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('read')}
            >
              Read
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash fs-1 d-block mb-3"></i>
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="list-group">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`list-group-item ${!notification.isRead ? 'border-start border-primary border-3' : ''}`}
                  style={{ backgroundColor: !notification.isRead ? '#f8f9fa' : 'white' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="mb-0">{notification.title}</h6>
                        <span className={`badge bg-${notification.type === 'error' ? 'danger' : notification.type === 'warning' ? 'warning' : notification.type === 'success' ? 'success' : 'info'}`}>
                          {notification.type}
                        </span>
                        {!notification.isRead && <span className="badge bg-primary">New</span>}
                      </div>
                      <p className="mb-2 text-muted">{notification.message}</p>
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      {!notification.isRead && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => markAsRead(notification._id)}
                          title="Mark as read"
                        >
                          <i className="bi bi-check2"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteNotification(notification._id)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}