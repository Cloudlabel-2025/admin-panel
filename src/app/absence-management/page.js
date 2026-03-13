'use client';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import SuccessMessage from '../components/SuccessMessage';

export default function AbsenceManagement() {
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('my-absence');
  const [absences, setAbsences] = useState([]);
  const [teamAbsences, setTeamAbsences] = useState([]);
  const [allAbsences, setAllAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    department: '',
    absenceType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [filter, setFilter] = useState({ status: '', employeeId: '' });
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [adminComments, setAdminComments] = useState('');
  const [isLOP, setIsLOP] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    const empId = localStorage.getItem('employeeId') || '';
    setUserRole(role);

    // Set default tab based on role
    if (role === 'super-admin' || role === 'Super-admin') {
      setActiveTab('approval-requests');
    } else if (role === 'admin-management' || role === 'admin') {
      setActiveTab('approval-requests');
    } else if (role === 'Teamlead' || role === 'Team-Lead') {
      setActiveTab('my-absence');
    } else if (role === 'Team-admin' || role === 'Team Admin') {
      setActiveTab('my-absence');
    } else {
      setActiveTab('my-absence');
    }

    // Fetch initial data
    if (empId) {
      fetchCurrentEmployee(empId);
      fetchMyAbsences(empId);
    }
  }, []);

  useEffect(() => {
    // Fetch data when tab changes
    const empId = localStorage.getItem('employeeId');
    if (activeTab === 'my-absence' && empId) {
      fetchMyAbsences(empId);
    } else if (activeTab === 'team-absence') {
      fetchTeamAbsences();
    } else if (activeTab === 'approval-requests') {
      fetchApprovalRequests();
    } else if (activeTab === 'all-records') {
      fetchAllRecords();
    }
  }, [activeTab]);

  const fetchCurrentEmployee = async (empId) => {
    try {
      const res = await fetch(`/api/Employee/${empId}`);
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          employeeId: data.employeeId,
          employeeName: `${data.firstName} ${data.lastName}`,
          department: data.department
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAbsences = async (empId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/absence?employeeId=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setAbsences(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamAbsences = async () => {
    try {
      setLoading(true);
      const empId = localStorage.getItem('employeeId');
      const res = await fetch(`/api/team-absence?employeeId=${empId}`);
      if (res.ok) {
        const data = await res.json();
        setTeamAbsences(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      let url = '/api/absence';
      if (filter.status) url += `?status=${filter.status}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAllAbsences(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/absence');
      if (res.ok) {
        const data = await res.json();
        setAllAbsences(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.absenceType || !form.startDate || !form.endDate || !form.reason) {
      setSuccessMessage('Please fill all required fields');
      setShowSuccess(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/absence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setSuccessMessage('Leave request submitted successfully');
        setShowSuccess(true);
        setForm({
          ...form,
          absenceType: '',
          startDate: '',
          endDate: '',
          reason: ''
        });
        const empId = localStorage.getItem('employeeId');
        fetchMyAbsences(empId);
      } else {
        const errorData = await res.json();
        setSuccessMessage(errorData.error || 'Failed to submit leave request');
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage('Error submitting request');
      setShowSuccess(true);
    }
    setLoading(false);
  };

  const handleApproval = async (id, action) => {
    try {
      const res = await fetch('/api/absence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          action,
          approvedBy: localStorage.getItem('employeeId') || 'Admin',
          comments: adminComments,
          isLOP: isLOP
        })
      });

      if (res.ok) {
        setSuccessMessage(`Leave request ${action}d successfully`);
        setShowSuccess(true);
        setSelectedAbsence(null);
        setAdminComments('');
        setIsLOP(false);
        fetchApprovalRequests();
      } else {
        setSuccessMessage(`Failed to ${action} leave request`);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage('Error processing request');
      setShowSuccess(true);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    
    try {
      const res = await fetch('/api/absence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          action: 'cancel',
          cancelledBy: localStorage.getItem('employeeId'),
          cancellationReason: 'Cancelled by employee'
        })
      });

      if (res.ok) {
        setSuccessMessage('Leave cancelled successfully');
        setShowSuccess(true);
        const empId = localStorage.getItem('employeeId');
        fetchMyAbsences(empId);
      } else {
        const errorData = await res.json();
        setSuccessMessage(errorData.error || 'Failed to cancel leave');
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMessage('Error cancelling leave');
      setShowSuccess(true);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'danger',
      Cancelled: 'secondary'
    };
    return `badge bg-${colors[status] || 'secondary'}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  // Determine which tabs to show based on role
  const canApplyLeave = !['super-admin', 'Super-admin'].includes(userRole);
  const canViewTeamAbsence = ['Teamlead', 'Team-Lead', 'Team-admin', 'Team Admin', 'admin-management', 'admin'].includes(userRole);
  const canApproveRequests = ['super-admin', 'Super-admin', 'admin-management', 'admin'].includes(userRole);
  const canViewAllRecords = ['super-admin', 'Super-admin', 'admin-management', 'admin'].includes(userRole);

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      
      <div className="container-fluid p-4">
        <h2 className="mb-4">
          <i className="bi bi-calendar-x-fill me-2"></i>
          Absence Management
        </h2>

        {/* Role-based Tabs */}
        <ul className="nav nav-tabs mb-4">
          {canApplyLeave && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'my-absence' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-absence')}
              >
                <i className="bi bi-person-fill me-2"></i>
                My Absence
              </button>
            </li>
          )}
          
          {canViewTeamAbsence && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'team-absence' ? 'active' : ''}`}
                onClick={() => setActiveTab('team-absence')}
              >
                <i className="bi bi-people-fill me-2"></i>
                Team Absence
              </button>
            </li>
          )}
          
          {canApproveRequests && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'approval-requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('approval-requests')}
              >
                <i className="bi bi-check-circle-fill me-2"></i>
                Approval Requests
              </button>
            </li>
          )}
          
          {canViewAllRecords && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'all-records' ? 'active' : ''}`}
                onClick={() => setActiveTab('all-records')}
              >
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                All Records
              </button>
            </li>
          )}
        </ul>

        {/* Tab Content */}
        {activeTab === 'my-absence' && canApplyLeave && (
          <div>
            {/* Apply Leave Form */}
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-plus-circle-fill me-2"></i>
                  Apply for Leave
                </h5>
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Employee</label>
                      <input
                        type="text"
                        className="form-control"
                        value={`${form.employeeName} (${form.employeeId})`}
                        readOnly
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Leave Type *</label>
                      <select
                        className="form-select"
                        value={form.absenceType}
                        onChange={(e) => setForm({...form, absenceType: e.target.value})}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Emergency Leave">Emergency Leave</option>
                        <option value="Personal Leave">Personal Leave</option>
                        <option value="Medical Leave">Medical Leave</option>
                        <option value="Maternity Leave">Maternity Leave</option>
                        <option value="Paternity Leave">Paternity Leave</option>
                      </select>
                    </div>
                    <div className="col-md-2 mb-3">
                      <label className="form-label">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({...form, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-2 mb-3">
                      <label className="form-label">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.endDate}
                        min={form.startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setForm({...form, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-10 mb-3">
                      <label className="form-label">Reason *</label>
                      <textarea
                        className="form-control"
                        value={form.reason}
                        onChange={(e) => setForm({...form, reason: e.target.value})}
                        rows="2"
                        required
                      />
                    </div>
                    <div className="col-md-2 mb-3 d-flex align-items-end">
                      <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* My Absence Records */}
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-list-ul me-2"></i>
                  My Leave Requests
                </h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Leave Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Days</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absences.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted">
                            No leave requests found
                          </td>
                        </tr>
                      ) : (
                        absences.map(absence => (
                          <tr key={absence._id}>
                            <td>{absence.absenceType}</td>
                            <td>{formatDate(absence.startDate)}</td>
                            <td>{formatDate(absence.endDate)}</td>
                            <td>{absence.totalDays}</td>
                            <td>{absence.reason}</td>
                            <td>
                              <span className={getStatusBadge(absence.status)}>
                                {absence.status}
                              </span>
                            </td>
                            <td>
                              {(absence.status === 'Pending' || absence.status === 'Approved') ? (
                                <button
                                  className="btn btn-warning btn-sm"
                                  onClick={() => handleCancel(absence._id)}
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team-absence' && canViewTeamAbsence && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-people-fill me-2"></i>
                Team Leave Requests
                {(userRole === 'Teamlead' || userRole === 'Team-Lead' || userRole === 'Team-admin' || userRole === 'Team Admin') && (
                  <span className="badge bg-info ms-2">View Only</span>
                )}
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamAbsences.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          No team leave requests found
                        </td>
                      </tr>
                    ) : (
                      teamAbsences.map(absence => (
                        <tr key={absence._id}>
                          <td>
                            <strong>{absence.employeeName}</strong><br />
                            <small className="text-muted">{absence.employeeId}</small>
                          </td>
                          <td>{absence.department}</td>
                          <td>{absence.absenceType}</td>
                          <td>{formatDate(absence.startDate)}</td>
                          <td>{formatDate(absence.endDate)}</td>
                          <td>{absence.totalDays}</td>
                          <td>{absence.reason}</td>
                          <td>
                            <span className={getStatusBadge(absence.status)}>
                              {absence.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'approval-requests' && canApproveRequests && (
          <div>
            {/* Filter */}
            <div className="card mb-3">
              <div className="card-body">
                <div className="row align-items-end">
                  <div className="col-md-3">
                    <label className="form-label">Filter by Status</label>
                    <select
                      className="form-select"
                      value={filter.status}
                      onChange={(e) => setFilter({...filter, status: e.target.value})}
                    >
                      <option value="">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-primary" onClick={fetchApprovalRequests}>
                      <i className="bi bi-funnel-fill me-2"></i>
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Requests Table */}
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Leave Approval Requests
                </h5>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Leave Type</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Days</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Applied On</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAbsences.length === 0 ? (
                          <tr>
                            <td colSpan="10" className="text-center text-muted">
                              No leave requests found
                            </td>
                          </tr>
                        ) : (
                          allAbsences.map(absence => (
                            <tr key={absence._id}>
                              <td>
                                <strong>{absence.employeeName}</strong><br />
                                <small className="text-muted">{absence.employeeId}</small>
                              </td>
                              <td>{absence.department}</td>
                              <td>{absence.absenceType}</td>
                              <td>{formatDate(absence.startDate)}</td>
                              <td>{formatDate(absence.endDate)}</td>
                              <td>{absence.totalDays}</td>
                              <td>
                                <span title={absence.reason}>
                                  {absence.reason.length > 30 ? 
                                    absence.reason.substring(0, 30) + '...' : 
                                    absence.reason
                                  }
                                </span>
                              </td>
                              <td>
                                <span className={getStatusBadge(absence.status)}>
                                  {absence.status}
                                </span>
                                {absence.isLOP && (
                                  <><br /><small className="text-danger">LOP</small></>
                                )}
                              </td>
                              <td>{formatDate(absence.createdAt)}</td>
                              <td>
                                {absence.status === 'Pending' ? (
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => setSelectedAbsence({...absence, action: 'approve'})}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => setSelectedAbsence({...absence, action: 'reject'})}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <small className="text-muted">
                                      By: {absence.approvedBy}<br />
                                      {absence.approvalDate && formatDate(absence.approvalDate)}
                                    </small>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all-records' && canViewAllRecords && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                All Absence Records
              </h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAbsences.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      allAbsences.map(absence => (
                        <tr key={absence._id}>
                          <td>
                            <strong>{absence.employeeName}</strong><br />
                            <small className="text-muted">{absence.employeeId}</small>
                          </td>
                          <td>{absence.department}</td>
                          <td>{absence.absenceType}</td>
                          <td>{formatDate(absence.startDate)}</td>
                          <td>{formatDate(absence.endDate)}</td>
                          <td>{absence.totalDays}</td>
                          <td>
                            <span className={getStatusBadge(absence.status)}>
                              {absence.status}
                            </span>
                          </td>
                          <td>{formatDate(absence.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approval/Rejection Modal */}
        {selectedAbsence && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>
                    {selectedAbsence.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
                  </h5>
                  <button 
                    className="btn-close" 
                    onClick={() => {
                      setSelectedAbsence(null);
                      setAdminComments('');
                      setIsLOP(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Employee:</strong> {selectedAbsence.employeeName} ({selectedAbsence.employeeId})
                  </div>
                  <div className="mb-3">
                    <strong>Leave Type:</strong> {selectedAbsence.absenceType}
                  </div>
                  <div className="mb-3">
                    <strong>Duration:</strong> {formatDate(selectedAbsence.startDate)} to {formatDate(selectedAbsence.endDate)} ({selectedAbsence.totalDays} days)
                  </div>
                  <div className="mb-3">
                    <strong>Reason:</strong> {selectedAbsence.reason}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      {selectedAbsence.action === 'approve' ? 'Approval' : 'Rejection'} Comments:
                    </label>
                    <textarea
                      className="form-control"
                      value={adminComments}
                      onChange={(e) => setAdminComments(e.target.value)}
                      placeholder={`Enter ${selectedAbsence.action === 'approve' ? 'approval' : 'rejection'} comments...`}
                      rows="3"
                    />
                  </div>
                  {selectedAbsence.action === 'approve' && (
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="lopCheck"
                          checked={isLOP}
                          onChange={(e) => setIsLOP(e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="lopCheck">
                          Mark as Loss of Pay (LOP)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setSelectedAbsence(null);
                      setAdminComments('');
                      setIsLOP(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn ${selectedAbsence.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => handleApproval(selectedAbsence._id, selectedAbsence.action)}
                  >
                    {selectedAbsence.action === 'approve' ? 'Approve' : 'Reject'} Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
