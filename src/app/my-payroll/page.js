'use client';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

export default function MyPayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const empId = localStorage.getItem('employeeId');
    if (empId) {
      setEmployeeId(empId);
      fetchPayrolls(empId);
      fetchPayrollNotifications(empId);
    }
  }, []);

  const fetchPayrolls = async (empId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('userRole', 'Employee');
      params.append('employeeId', empId);

      const res = await fetch(`/api/payroll?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.payrolls || []);
      }
    } catch (err) {
      console.error('Failed to fetch payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportPayroll = () => {
    const wsData = payrolls.map(p => ({
      PayPeriod: p.payPeriod,
      GrossSalary: p.grossSalary,
      TotalEarnings: p.totalEarnings,
      TotalDeductions: p.totalDeductions,
      NetPay: p.netPay,
      Status: p.status
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Payroll');
    XLSX.writeFile(wb, `My_Payroll_${employeeId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fetchPayrollNotifications = async (empId) => {
    try {
      const res = await fetch(`/api/notifications?employeeId=${empId}&type=payroll`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications?.filter(n => n.type === 'payroll' && !n.isRead) || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Draft: 'secondary',
      Approved: 'success',
      Paid: 'primary'
    };
    return `badge bg-${colors[status] || 'secondary'}`;
  };

  if (!employeeId) {
    return (
      <Layout>
        <div className="container-fluid p-4">
          <div className="alert alert-warning">
            Please login as an employee to view payroll.
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>💰 My Payroll</h2>
          <button className="btn btn-primary" onClick={exportPayroll}>
            📊 Export My Payroll
          </button>
        </div>

        {/* Payroll Notifications */}
        {notifications.length > 0 && (
          <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
            <div className="d-flex align-items-center">
              <span className="me-2">🔔</span>
              <div>
                <strong>New Payroll Available!</strong>
                <div className="mt-1">
                  {notifications.map(notif => (
                    <div key={notif._id} className="small">
                      {notif.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button type="button" className="btn-close" onClick={() => setNotifications([])}></button>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status"></div>
                <p>Loading payrolls...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Pay Period</th>
                      <th>Gross Salary</th>
                      <th>Total Earnings</th>
                      <th>Total Deductions</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No payroll records found
                        </td>
                      </tr>
                    ) : (
                      payrolls.map(payroll => (
                        <tr key={payroll._id}>
                          <td>{payroll.payPeriod}</td>
                          <td>₹{payroll.grossSalary?.toLocaleString()}</td>
                          <td>₹{payroll.totalEarnings?.toLocaleString()}</td>
                          <td>₹{payroll.totalDeductions?.toLocaleString()}</td>
                          <td><strong>₹{payroll.netPay?.toLocaleString()}</strong></td>
                          <td>
                            <span className={getStatusBadge(payroll.status)}>
                              {payroll.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-info btn-sm"
                              onClick={() => {
                                setSelectedPayroll(payroll);
                                setShowModal(true);
                              }}
                            >
                              View Details
                            </button>
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

        {showModal && selectedPayroll && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Payroll Details - {selectedPayroll.payPeriod}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card border-success h-100">
                        <div className="card-header bg-success text-white">
                          <h6 className="mb-0">Earnings</h6>
                        </div>
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Basic Salary:</span>
                            <span>₹{selectedPayroll.basicSalary?.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>HRA:</span>
                            <span>₹{selectedPayroll.hra?.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>DA:</span>
                            <span>₹{selectedPayroll.da?.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Conveyance:</span>
                            <span>₹{selectedPayroll.conveyance?.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>Medical:</span>
                            <span>₹{selectedPayroll.medical?.toLocaleString()}</span>
                          </div>
                          {selectedPayroll.bonus > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Bonus:</span>
                              <span>₹{selectedPayroll.bonus?.toLocaleString()}</span>
                            </div>
                          )}
                          <hr />
                          <div className="d-flex justify-content-between fw-bold text-success">
                            <span>Total Earnings:</span>
                            <span>₹{selectedPayroll.totalEarnings?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card border-danger h-100">
                        <div className="card-header bg-danger text-white">
                          <h6 className="mb-0">Deductions</h6>
                        </div>
                        <div className="card-body">
                          <div className="d-flex justify-content-between mb-1">
                            <span>PF (12%):</span>
                            <span>₹{selectedPayroll.pf?.toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span>ESI (0.75%):</span>
                            <span>₹{selectedPayroll.esi?.toLocaleString() || 0}</span>
                          </div>
                          {selectedPayroll.lopDeduction > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>LOP:</span>
                              <span>₹{selectedPayroll.lopDeduction?.toLocaleString()}</span>
                            </div>
                          )}
                          <hr />
                          <div className="d-flex justify-content-between fw-bold text-danger">
                            <span>Total Deductions:</span>
                            <span>₹{selectedPayroll.totalDeductions?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <hr />
                  
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <h4 className="text-primary mb-0">Net Salary: ₹{selectedPayroll.netPay?.toLocaleString()}</h4>
                      <small className="text-muted">Total Earnings - Total Deductions</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Close
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