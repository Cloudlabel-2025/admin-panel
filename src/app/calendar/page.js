"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function CalendarPage() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({
    name: "",
    date: "",
    type: "Public",
    description: "",
    isRecurring: false
  });
  const [editingId, setEditingId] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const getTamilNaduHolidays = (year) => {
    const holidays2025 = [
      { name: "New Year's Day", date: "2025-01-01", type: "Public" },
      { name: "Pongal", date: "2025-01-14", type: "Public" },
      { name: "Thiruvalluvar Day", date: "2025-01-15", type: "Public" },
      { name: "Uzhavar Thirunal", date: "2025-01-16", type: "Public" },
      { name: "Republic Day", date: "2025-01-26", type: "Public" },
      { name: "Maha Shivaratri", date: "2025-02-26", type: "Public" },
      { name: "Telugu New Year", date: "2025-03-30", type: "Public" },
      { name: "Good Friday", date: "2025-04-18", type: "Public" },
      { name: "May Day", date: "2025-05-01", type: "Public" },
      { name: "Ramzan (Eid-ul-Fitr)", date: "2025-03-31", type: "Public" },
      { name: "Independence Day", date: "2025-08-15", type: "Public" },
      { name: "Krishna Jayanthi", date: "2025-08-16", type: "Public" },
      { name: "Vinayagar Chaturthi", date: "2025-08-27", type: "Public" },
      { name: "Milad-un-Nabi", date: "2025-09-05", type: "Public" },
      { name: "Gandhi Jayanti", date: "2025-10-02", type: "Public" },
      { name: "Ayudha Pooja", date: "2025-10-01", type: "Public" },
      { name: "Vijaya Dasami", date: "2025-10-02", type: "Public" },
      { name: "Deepavali", date: "2025-10-20", type: "Public" },
      { name: "Christmas", date: "2025-12-25", type: "Public" }
    ];
    
    const holidays2026 = [
      { name: "New Year's Day", date: "2026-01-01", type: "Public" },
      { name: "Pongal", date: "2026-01-14", type: "Public" },
      { name: "Thiruvalluvar Day", date: "2026-01-15", type: "Public" },
      { name: "Uzhavar Thirunal", date: "2026-01-16", type: "Public" },
      { name: "Republic Day", date: "2026-01-26", type: "Public" },
      { name: "Maha Shivaratri", date: "2026-03-14", type: "Public" },
      { name: "Telugu New Year", date: "2026-03-22", type: "Public" },
      { name: "Ramzan (Eid-ul-Fitr)", date: "2026-03-20", type: "Public" },
      { name: "Good Friday", date: "2026-04-03", type: "Public" },
      { name: "May Day", date: "2026-05-01", type: "Public" },
      { name: "Independence Day", date: "2026-08-15", type: "Public" },
      { name: "Krishna Jayanthi", date: "2026-09-05", type: "Public" },
      { name: "Vinayagar Chaturthi", date: "2026-09-16", type: "Public" },
      { name: "Milad-un-Nabi", date: "2026-08-26", type: "Public" },
      { name: "Gandhi Jayanti", date: "2026-10-02", type: "Public" },
      { name: "Ayudha Pooja", date: "2026-10-20", type: "Public" },
      { name: "Vijaya Dasami", date: "2026-10-21", type: "Public" },
      { name: "Deepavali", date: "2026-11-08", type: "Public" },
      { name: "Christmas", date: "2026-12-25", type: "Public" }
    ];
    
    const holidays2027 = [
      { name: "New Year's Day", date: "2027-01-01", type: "Public" },
      { name: "Pongal", date: "2027-01-14", type: "Public" },
      { name: "Thiruvalluvar Day", date: "2027-01-15", type: "Public" },
      { name: "Uzhavar Thirunal", date: "2027-01-16", type: "Public" },
      { name: "Republic Day", date: "2027-01-26", type: "Public" },
      { name: "Maha Shivaratri", date: "2027-03-04", type: "Public" },
      { name: "Ramzan (Eid-ul-Fitr)", date: "2027-03-09", type: "Public" },
      { name: "Telugu New Year", date: "2027-04-10", type: "Public" },
      { name: "Good Friday", date: "2027-03-26", type: "Public" },
      { name: "May Day", date: "2027-05-01", type: "Public" },
      { name: "Milad-un-Nabi", date: "2027-08-15", type: "Public" },
      { name: "Independence Day", date: "2027-08-15", type: "Public" },
      { name: "Krishna Jayanthi", date: "2027-08-26", type: "Public" },
      { name: "Vinayagar Chaturthi", date: "2027-09-05", type: "Public" },
      { name: "Gandhi Jayanti", date: "2027-10-02", type: "Public" },
      { name: "Ayudha Pooja", date: "2027-10-09", type: "Public" },
      { name: "Vijaya Dasami", date: "2027-10-10", type: "Public" },
      { name: "Deepavali", date: "2027-10-29", type: "Public" },
      { name: "Christmas", date: "2027-12-25", type: "Public" }
    ];
    
    if (year === 2025) return holidays2025;
    if (year === 2026) return holidays2026;
    if (year === 2027) return holidays2027;
    return [];
  };
  
  const commonHolidays = getTamilNaduHolidays(currentYear);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setIsAdmin(role === "super-admin" || role === "Super-admin" || role === "admin" || role === "developer");
    fetchAvailableYears();
    fetchHolidays();
  }, [currentYear]);

  const fetchAvailableYears = async () => {
    try {
      const res = await fetch('/api/holiday');
      const data = await res.json();
      const years = [...new Set(data.map(h => new Date(h.date).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) {
      console.error('Error fetching available years:', error);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/holiday?year=${currentYear}`);
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const notifyAllUsers = async (action, holidayName, holidayDate) => {
    try {
      const updatedBy = localStorage.getItem('userName') || localStorage.getItem('userEmail');
      const userRole = localStorage.getItem('userRole');
      
      // Fetch all employees
      const empRes = await fetch('/api/Employee');
      const employees = await empRes.json();
      
      // Fetch all users
      const userRes = await fetch('/api/User');
      const users = await userRes.json();
      
      // Combine all unique IDs
      const allEmployeeIds = [...new Set([
        ...employees.map(emp => emp.employeeId),
        ...users.map(user => user.employeeId)
      ])];
      
      const notifications = allEmployeeIds.map(empId => ({
        employeeId: empId,
        title: `Holiday ${action}`,
        message: `${holidayName} on ${new Date(holidayDate).toLocaleDateString()} has been ${action} by ${updatedBy} (${userRole})`,
        type: 'holiday',
        isRead: false
      }));

      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
      });
    } catch (error) {
      console.error('Error notifying users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Please enter holiday name');
      return;
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(form.name)) {
      alert('Holiday name can only contain letters, spaces, hyphens and apostrophes');
      return;
    }
    
    if (!form.date) {
      alert('Please select a date');
      return;
    }
    
    const selectedYear = new Date(form.date).getFullYear();
    if (selectedYear < 2025 || selectedYear > 2027) {
      alert('Please select a date between 2025 and 2027');
      return;
    }
    
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!editingId && selectedDate < today) {
      alert('Cannot add holiday for past dates');
      return;
    }
    
    const duplicate = holidays.find(h => 
      h.date === form.date && 
      h.name.toLowerCase() === form.name.toLowerCase() &&
      h._id !== editingId
    );
    
    if (duplicate) {
      alert('A holiday with this name already exists on this date');
      return;
    }
    
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId 
        ? { _id: editingId, ...form }
        : { ...form, createdBy: localStorage.getItem("employeeId") };

      const res = await fetch("/api/holiday", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await notifyAllUsers(
          editingId ? 'Updated' : 'Added',
          form.name,
          form.date
        );
        setForm({ name: "", date: "", type: "Public", description: "", isRecurring: false });
        setEditingId(null);
        setShowForm(false);
        fetchAvailableYears();
        fetchHolidays();
      } else {
        alert('Failed to save holiday. Please try again.');
      }
    } catch (error) {
      console.error("Error saving holiday:", error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEdit = (holiday) => {
    setForm({
      name: holiday.name,
      date: new Date(holiday.date).toISOString().split('T')[0],
      type: holiday.type,
      description: holiday.description || "",
      isRecurring: holiday.isRecurring
    });
    setEditingId(holiday._id);
  };

  const handleDelete = async (id) => {
    const holiday = holidays.find(h => h._id === id);
    if (confirm(`Are you sure you want to delete ${holiday.name}? All employees will be notified.`)) {
      try {
        const res = await fetch(`/api/holiday?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          await notifyAllUsers('Cancelled', holiday.name, holiday.date);
          fetchAvailableYears();
          fetchHolidays();
        }
      } catch (error) {
        console.error("Error deleting holiday:", error);
      }
    }
  };

  const handleAddPresets = async () => {
    try {
      const presetsToAdd = commonHolidays.filter((_, index) => selectedPresets.includes(index));
      
      for (const preset of presetsToAdd) {
        await fetch("/api/holiday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...preset,
            createdBy: localStorage.getItem("employeeId")
          })
        });
      }
      
      await notifyAllUsers(
        'Added',
        `${presetsToAdd.length} public holidays`,
        currentYear
      );
      
      setShowPresetModal(false);
      setSelectedPresets([]);
      fetchAvailableYears();
      fetchHolidays();
    } catch (error) {
      console.error("Error adding preset holidays:", error);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const isHoliday = (date) => {
    return holidays.find(h => {
      const holidayDate = new Date(h.date);
      return holidayDate.getDate() === date && 
             holidayDate.getMonth() === currentMonth && 
             holidayDate.getFullYear() === currentYear;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const holiday = isHoliday(day);
      const isToday = day === new Date().getDate() && 
                      currentMonth === new Date().getMonth() && 
                      currentYear === new Date().getFullYear();
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${holiday ? 'holiday' : ''} ${isToday ? 'today' : ''}`}
          style={{
            padding: '10px',
            border: '1px solid #e0e0e0',
            minHeight: '80px',
            backgroundColor: holiday ? '#fff3cd' : isToday ? '#d4edda' : 'white',
            cursor: isAdmin ? 'pointer' : (holiday ? 'pointer' : 'default'),
            transition: 'all 0.3s ease'
          }}
          onClick={() => {
            if (isAdmin && !holiday) {
              const selectedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              setForm({...form, date: selectedDate});
              setShowForm(true);
            }
          }}
          onMouseEnter={(e) => {
            if (holiday) {
              e.target.style.backgroundColor = '#ffc107';
            } else if (isAdmin) {
              e.target.style.backgroundColor = '#f0f0f0';
            }
          }}
          onMouseLeave={(e) => {
            if (holiday) {
              e.target.style.backgroundColor = '#fff3cd';
            } else {
              e.target.style.backgroundColor = 'white';
            }
          }}
        >
          <div style={{ fontWeight: isToday ? 'bold' : 'normal', color: holiday ? '#856404' : '#333' }}>
            {day}
          </div>
          {holiday && (
            <div style={{ fontSize: '11px', marginTop: '5px', color: '#856404' }}>
              <i className="bi bi-calendar-event me-1"></i>
              <strong>{holiday.name}</strong>
              <div>
                <span className={`badge badge-sm ${
                  holiday.type === 'Public' ? 'bg-success' :
                  holiday.type === 'Company' ? 'bg-primary' : 'bg-warning'
                }`} style={{ fontSize: '9px' }}>
                  {holiday.type}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <h1 className="mb-1" style={{ color: '#d4af37', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}>
                  <i className="bi bi-calendar3 me-2"></i>Holiday Calendar {currentYear}
                </h1>
                <small style={{ color: '#f4e5c3' }}>Manage company holidays and events</small>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentYear(currentYear - 1)}
                  disabled={currentYear <= 2025}
                  style={{ 
                    background: currentYear > 2025 ? 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)' : '#6c757d',
                    border: 'none', 
                    color: '#1a1a1a', 
                    fontWeight: '600',
                    opacity: currentYear > 2025 ? 1 : 0.5
                  }}
                >
                  <i className="bi bi-chevron-left"></i> {currentYear - 1}
                </button>
                <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem' }}>{currentYear}</span>
                <button
                  className="btn btn-sm"
                  onClick={() => setCurrentYear(currentYear + 1)}
                  disabled={currentYear >= 2027}
                  style={{ 
                    background: currentYear < 2027 ? 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)' : '#6c757d',
                    border: 'none', 
                    color: '#1a1a1a', 
                    fontWeight: '600',
                    opacity: currentYear < 2027 ? 1 : 0.5
                  }}
                >
                  {currentYear + 1} <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-sm"
                  onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                >
                  <i className={`bi ${viewMode === 'calendar' ? 'bi-list-ul' : 'bi-calendar3'} me-2`}></i>
                  {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => setShowPresetModal(true)}
                  style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #5bc0de 100%)', border: 'none', color: 'white', fontWeight: '600' }}
                >
                  <i className="bi bi-eye me-2"></i>
                  View Holidays
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowForm(!showForm)}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    {showForm ? 'Hide Form' : 'Add Holiday'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && showForm && (
          <div className="card mb-4 shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}>
                <i className="bi bi-calendar-plus me-2"></i>{editingId ? "Edit Holiday" : "Add Holiday"}
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-semibold"><i className="bi bi-tag-fill me-2" style={{ color: '#d4af37' }}></i>Holiday Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., New Year"
                      value={form.name}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                        setForm({...form, name: value});
                      }}
                      required
                      maxLength={50}
                      style={{ border: '2px solid #d4af37', padding: '12px' }}
                    />
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-semibold"><i className="bi bi-calendar-fill me-2" style={{ color: '#d4af37' }}></i>Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => setForm({...form, date: e.target.value})}
                      required
                      min="2025-01-01"
                      max="2027-12-31"
                      style={{ border: '2px solid #d4af37', padding: '12px' }}
                    />
                  </div>
                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-semibold"><i className="bi bi-bookmark-fill me-2" style={{ color: '#d4af37' }}></i>Type</label>
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) => setForm({...form, type: e.target.value})}
                      style={{ border: '2px solid #d4af37', padding: '12px' }}
                    >
                      <option value="Public">Public</option>
                      <option value="Company">Company</option>
                      <option value="Optional">Optional</option>
                    </select>
                  </div>
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-semibold"><i className="bi bi-file-text-fill me-2" style={{ color: '#d4af37' }}></i>Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Optional"
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                      style={{ border: '2px solid #d4af37', padding: '12px' }}
                    />
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                  {editingId && (
                    <button 
                      type="button" 
                      className="btn"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ name: "", date: "", type: "Public", description: "", isRecurring: false });
                      }}
                      style={{ border: '2px solid #d4af37', color: '#d4af37', background: 'transparent' }}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    className="btn"
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    <i className="bi bi-save me-2"></i>{editingId ? "Update" : "Add Holiday"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewMode === 'calendar' ? (
          <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1)}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a' }}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <h5 className="mb-0" style={{ color: '#d4af37' }}>
                <i className="bi bi-calendar-month me-2"></i>{monthNames[currentMonth]} {currentYear}
              </h5>
              <button
                className="btn btn-sm"
                onClick={() => setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1)}
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a' }}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            <div className="card-body p-3">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f8f9fa', border: '1px solid #d4af37' }}>
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <h5 className="mb-0" style={{ color: '#d4af37' }}>
                <i className="bi bi-list-ul me-2"></i>Holidays {currentYear}
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', color: '#d4af37' }}>
                    <tr>
                      <th style={{ color: '#d4af37' }}><i className="bi bi-calendar-fill me-2"></i>Date</th>
                      <th style={{ color: '#d4af37' }}><i className="bi bi-tag-fill me-2"></i>Holiday Name</th>
                      <th style={{ color: '#d4af37' }}><i className="bi bi-bookmark-fill me-2"></i>Type</th>
                      <th style={{ color: '#d4af37' }}><i className="bi bi-file-text-fill me-2"></i>Description</th>
                      {isAdmin && <th style={{ color: '#d4af37' }}><i className="bi bi-gear-fill me-2"></i>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="text-center py-4 text-muted">
                          <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                          No holidays found for {currentYear}
                        </td>
                      </tr>
                    ) : (
                      holidays
                        .filter((holiday, index, self) => 
                          index === self.findIndex(h => h.date === holiday.date && h.name === holiday.name)
                        )
                        .map((holiday) => (
                        <tr key={holiday._id}>
                          <td>{new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td><strong>{holiday.name}</strong></td>
                          <td>
                            <span className={`badge ${
                              holiday.type === 'Public' ? 'bg-success' :
                              holiday.type === 'Company' ? 'bg-primary' : 'bg-warning'
                            }`}>
                              {holiday.type}
                            </span>
                          </td>
                          <td>{holiday.description || "-"}</td>
                          {isAdmin && (
                            <td>
                              <button
                                className="btn btn-sm me-1"
                                onClick={() => {
                                  handleEdit(holiday);
                                  setShowForm(true);
                                }}
                                style={{ background: 'linear-gradient(135deg, #ffc107 0%, #ffeb3b 100%)', border: 'none', color: '#1a1a1a' }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button
                                className="btn btn-sm"
                                onClick={() => handleDelete(holiday._id)}
                                style={{ background: 'linear-gradient(135deg, #dc3545 0%, #ff6b6b 100%)', border: 'none', color: 'white' }}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preset Holidays Modal */}
      {showPresetModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', border: '2px solid #d4af37' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', borderBottom: '2px solid #d4af37' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ color: '#d4af37' }}>
                  <i className="bi bi-calendar-check me-2"></i>Tamil Nadu Public Holidays {currentYear}
                </h5>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setShowPresetModal(false);
                    setSelectedPresets([]);
                  }}
                  style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a' }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {isAdmin && <p className="text-muted mb-3">Select holidays to add to your company calendar. All employees will be notified.</p>}
              {getTamilNaduHolidays(currentYear).map((holiday, index) => {
                const isAdded = holidays.some(h => {
                  const holidayDate = new Date(h.date).toISOString().split('T')[0];
                  return holidayDate === holiday.date && h.name.toLowerCase() === holiday.name.toLowerCase();
                });
                return (
                  <div key={index} className="form-check mb-2 p-3" style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px',
                    backgroundColor: isAdded ? '#f0f0f0' : 'white',
                    opacity: isAdded ? 0.7 : 1
                  }}>
                    {isAdmin && (
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`holiday-${index}`}
                        checked={selectedPresets.includes(index)}
                        disabled={isAdded}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPresets([...selectedPresets, index]);
                          } else {
                            setSelectedPresets(selectedPresets.filter(i => i !== index));
                          }
                        }}
                      />
                    )}
                    <label className="form-check-label w-100" htmlFor={`holiday-${index}`} style={{ cursor: isAdded ? 'not-allowed' : 'pointer' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>{holiday.name}</strong>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {isAdded && <span className="badge bg-success">Already Added</span>}
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            {isAdmin && (
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">{selectedPresets.length} holidays selected</small>
                  <button
                    className="btn"
                    onClick={handleAddPresets}
                    disabled={selectedPresets.length === 0}
                    style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', border: 'none', color: '#1a1a1a', fontWeight: '600' }}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Add Selected Holidays
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .calendar-day {
          position: relative;
          border-radius: 8px;
        }
        .calendar-day.today {
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          border: 2px solid #d4af37 !important;
        }
        .calendar-day.holiday {
          border: 2px solid #ffc107 !important;
        }
      `}</style>
    </Layout>
  );
}