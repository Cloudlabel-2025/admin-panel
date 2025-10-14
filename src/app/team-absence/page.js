'use client';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function TeamAbsence() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      const employeeId = localStorage.getItem('employeeId');
      const response = await fetch(`/api/team-absence?employeeId=${employeeId}`);
      const data = await response.json();
      setAbsences(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching absences:', error);
      setAbsences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, action) => {
    try {
      const approvedBy = localStorage.getItem('userEmail');
      await fetch('/api/absence', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, action, approvedBy })
      });
      fetchAbsences();
    } catch (error) {
      console.error('Error updating absence:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <Layout>
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Team Leave Requests</h1>
      
      {absences.length === 0 ? (
        <p className="text-gray-500">No leave requests</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(absences) && absences.map((absence) => (
                <tr key={absence._id}>
                  <td>{absence.employeeName}</td>
                  <td>{absence.leaveType}</td>
                  <td>{new Date(absence.startDate).toLocaleDateString()}</td>
                  <td>{new Date(absence.endDate).toLocaleDateString()}</td>
                  <td>{absence.reason}</td>
                  <td>
                    <span className={`badge ${
                      absence.status === 'Approved' ? 'bg-success' :
                      absence.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {absence.status}
                    </span>
                  </td>
                  <td>
                    {absence.status === 'Pending' && (
                      <div className="btn-group">
                        <button 
                          className="btn btn-sm btn-success"
                          onClick={() => handleApproval(absence._id, 'approve')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleApproval(absence._id, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </Layout>
  );
}