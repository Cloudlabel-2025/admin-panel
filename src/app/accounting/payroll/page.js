"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import * as XLSX from "xlsx";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState("manage");
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [currentEmployeeId, setCurrentEmployeeId] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    payPeriod: "",
    status: "",
    employeeId: ""
  });

  // Generate Payroll States
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [payPeriod, setPayPeriod] = useState("");
  const [customData, setCustomData] = useState({
    bonus: 0,
    incentive: 0,
    loanDeduction: 0,
    otherDeductions: 0
  });
  const [previewData, setPreviewData] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHikeModal, setShowHikeModal] = useState(false);
  const [hikeData, setHikeData] = useState({
    employeeId: '',
    newSalary: '',
    effectiveDate: '',
    reason: ''
  });

  const fetchPayrolls = useCallback(async () => {
    if (!userRole) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add role and employee ID for access control
      params.append("userRole", userRole);
      if (userRole !== "super-admin" && userRole !== "admin") {
        if (!currentEmployeeId) return;
        params.append("employeeId", currentEmployeeId);
      } else {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const res = await fetch(`/api/payroll?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayrolls(data.payrolls || []);
      }
    } catch (err) {
      console.error("Failed to fetch payrolls:", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, currentEmployeeId, filters]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/Employee/search");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "employee";
    const empId = localStorage.getItem("employeeId") || "";
    setUserRole(role);
    setCurrentEmployeeId(empId);
    
    if (role === "super-admin" || role === "admin") {
      fetchEmployees();
      setActiveTab("generate");
    }
  }, []);

  useEffect(() => {
    if (userRole && (userRole === "super-admin" || userRole === "admin" || currentEmployeeId)) {
      fetchPayrolls();
    }
  }, [userRole, currentEmployeeId, fetchPayrolls]);

  const generatePayroll = async () => {
    if (!selectedEmployee || !payPeriod) {
      alert("Please select employee and pay period");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          payPeriod,
          customData,
          userRole,
          createdBy: localStorage.getItem("userEmail") || "Admin"
        })
      });

      const data = await res.json();
      if (res.ok) {
        const employeeName = employees.find(emp => emp.employeeId === selectedEmployee)?.firstName + ' ' + employees.find(emp => emp.employeeId === selectedEmployee)?.lastName;
        alert(`Payroll generated successfully and sent to ${employeeName}! Employee can now view it in their My Payroll section.`);
        setPreviewData(data.payroll);
        fetchPayrolls();
        // Reset form
        setSelectedEmployee("");
        setPayPeriod("");
        setCustomData({ bonus: 0, incentive: 0, loanDeduction: 0, otherDeductions: 0 });
      } else {
        alert(data.error || "Failed to generate payroll");
      }
    } catch (err) {
      console.error("Generate payroll error:", err);
      alert("Failed to generate payroll");
    } finally {
      setLoading(false);
    }
  };

  const updatePayrollStatus = async (payrollId, status) => {
    try {
      const res = await fetch("/api/payroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: payrollId,
          status,
          ...(status === 'Approved' && { approvedBy: localStorage.getItem("userEmail"), approvedAt: new Date() }),
          ...(status === 'Paid' && { paidAt: new Date() })
        })
      });

      if (res.ok) {
        alert(`Payroll ${status.toLowerCase()} successfully!`);
        fetchPayrolls();
      } else {
        alert("Failed to update payroll status");
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Failed to update payroll status");
    }
  };

  const processSalaryHike = async () => {
    if (!hikeData.employeeId || !hikeData.newSalary || !hikeData.effectiveDate) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'salary-hike',
          ...hikeData,
          processedBy: localStorage.getItem('userEmail')
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Salary hike processed successfully for ${data.employeeName}!`);
        setShowHikeModal(false);
        setHikeData({ employeeId: '', newSalary: '', effectiveDate: '', reason: '' });
      } else {
        alert(data.error || 'Failed to process salary hike');
      }
    } catch (err) {
      console.error('Salary hike error:', err);
      alert('Failed to process salary hike');
    } finally {
      setLoading(false);
    }
  };

  const exportPayrolls = () => {
    const wsData = payrolls.map(p => ({
      Employee: p.employeeName,
      Department: p.department,
      PayPeriod: p.payPeriod,
      GrossSalary: p.grossSalary,
      TotalEarnings: p.totalEarnings,
      TotalDeductions: p.totalDeductions,
      NetPay: p.netPay,
      Status: p.status,
      CreatedAt: new Date(p.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll Report");
    XLSX.writeFile(wb, `Payroll_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status) => {
    const colors = {
      Draft: "secondary",
      Approved: "warning",
      Paid: "success"
    };
    return `badge bg-${colors[status] || "secondary"}`;
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>💰 Payroll Management</h2>
          <div className="d-flex gap-2">
            {(userRole === "super-admin" || userRole === "admin") && (
              <button className="btn btn-warning" onClick={() => setShowHikeModal(true)}>
                📈 Salary Hike
              </button>
            )}
            <button className="btn btn-success" onClick={exportPayrolls}>
              📊 Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-pills mb-4">
          {(userRole === "super-admin" || userRole === "admin") && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "generate" ? "active" : ""}`}
                onClick={() => setActiveTab("generate")}
              >
                🎯 Generate Payroll
              </button>
            </li>
          )}
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === "manage" ? "active" : ""}`}
              onClick={() => setActiveTab("manage")}
            >
              {(userRole === "super-admin" || userRole === "admin") ? "📋 Manage Payrolls" : "💰 My Payroll"}
            </button>
          </li>
          {userRole === "super-admin" && (
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => setActiveTab("reports")}
              >
                📈 Reports & Analytics
              </button>
            </li>
          )}
        </ul>

        {/* Generate Payroll Tab - Admin Access */}
        {activeTab === "generate" && (userRole === "super-admin" || userRole === "admin") && (
          <div className="row">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">🎯 Generate New Payroll</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">👤 Select Employee</label>
                      <select 
                        className="form-select"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                      >
                        <option value="">Choose Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.firstName} {emp.lastName} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">📅 Pay Period</label>
                      <input 
                        type="month"
                        className="form-control"
                        value={payPeriod}
                        onChange={(e) => setPayPeriod(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-3">
                      <label className="form-label">🎁 Bonus</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={customData.bonus}
                        onChange={(e) => setCustomData({...customData, bonus: Number(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">⭐ Incentive</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={customData.incentive}
                        onChange={(e) => setCustomData({...customData, incentive: Number(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">💳 Loan Deduction</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={customData.loanDeduction}
                        onChange={(e) => setCustomData({...customData, loanDeduction: Number(e.target.value)})}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">➖ Other Deductions</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={customData.otherDeductions}
                        onChange={(e) => setCustomData({...customData, otherDeductions: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  {selectedEmployee && (
                    <div className="alert alert-info mb-3">
                      <i className="bi bi-info-circle"></i> 
                      <strong>Note:</strong> Generated payroll will be automatically sent to the employee&apos;s &quot;My Payroll&quot; section and they will receive a notification.
                    </div>
                  )}
                  
                  <button 
                    className="btn btn-primary btn-lg w-100"
                    onClick={generatePayroll}
                    disabled={loading || !selectedEmployee || !payPeriod}
                  >
                    {loading ? "⏳ Generating & Sending..." : "🚀 Generate & Send Payroll"}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {previewData && (
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">💰 Payroll Calculation</h5>
                  </div>
                  <div className="card-body">
                    <div className="text-center mb-3">
                      <h6 className="fw-bold">{previewData.employeeName}</h6>
                      <p className="text-muted mb-0">{previewData.department}</p>
                      <p className="text-muted">{previewData.payPeriod}</p>
                    </div>
                    
                    <div className="card mb-3 border-success">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 text-success">Earnings</h6>
                      </div>
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between">
                          <span>Basic Salary:</span>
                          <span>₹{previewData.basicSalary?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>HRA:</span>
                          <span>₹{previewData.hra?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>DA:</span>
                          <span>₹{previewData.da?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Conveyance:</span>
                          <span>₹{previewData.conveyance?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>Medical:</span>
                          <span>₹{previewData.medical?.toLocaleString()}</span>
                        </div>
                        {previewData.bonus > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Bonus:</span>
                            <span>₹{previewData.bonus?.toLocaleString()}</span>
                          </div>
                        )}
                        {previewData.incentive > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Incentive:</span>
                            <span>₹{previewData.incentive?.toLocaleString()}</span>
                          </div>
                        )}
                        {previewData.overtimePay > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Overtime:</span>
                            <span>₹{previewData.overtimePay?.toLocaleString()}</span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between fw-bold text-success">
                          <span>Total Earnings:</span>
                          <span>₹{previewData.totalEarnings?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card mb-3 border-danger">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 text-danger">Deductions</h6>
                      </div>
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between">
                          <span>PF (12%):</span>
                          <span>₹{previewData.pf?.toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span>ESI (0.75%):</span>
                          <span>₹{previewData.esi?.toLocaleString() || 0}</span>
                        </div>
                        {previewData.lopDeduction > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>LOP Deduction:</span>
                            <span>₹{previewData.lopDeduction?.toLocaleString()}</span>
                          </div>
                        )}
                        {previewData.loanDeduction > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Loan Deduction:</span>
                            <span>₹{previewData.loanDeduction?.toLocaleString()}</span>
                          </div>
                        )}
                        {previewData.otherDeductions > 0 && (
                          <div className="d-flex justify-content-between">
                            <span>Other Deductions:</span>
                            <span>₹{previewData.otherDeductions?.toLocaleString()}</span>
                          </div>
                        )}
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between fw-bold text-danger">
                          <span>Total Deductions:</span>
                          <span>₹{previewData.totalDeductions?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card border-primary">
                      <div className="card-body p-3 text-center">
                        <div className="mb-2">
                          <small className="text-muted">Calculation Formula:</small>
                          <br />
                          <code>Total Earnings - Total Deductions = Net Salary</code>
                        </div>
                        <div className="mb-2">
                          <small>₹{previewData.totalEarnings?.toLocaleString()} - ₹{previewData.totalDeductions?.toLocaleString()}</small>
                        </div>
                        <h4 className="text-primary mb-0">Net Salary: ₹{previewData.netPay?.toLocaleString()}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manage Payrolls Tab */}
        {activeTab === "manage" && (
          <div>
            {/* Filters - Admin Access */}
            {(userRole === "super-admin" || userRole === "admin") && (
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="🔍 Employee ID"
                        value={filters.employeeId}
                        onChange={(e) => setFilters({...filters, employeeId: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <input 
                        type="month"
                        className="form-control"
                        value={filters.payPeriod}
                        onChange={(e) => setFilters({...filters, payPeriod: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <select 
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                      >
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Department"
                        value={filters.department}
                        onChange={(e) => setFilters({...filters, department: e.target.value})}
                      />
                    </div>
                    <div className="col-md-2">
                      <button className="btn btn-primary w-100" onClick={fetchPayrolls}>
                        🔍 Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payroll Table */}
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
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Pay Period</th>
                          <th>Gross Salary</th>
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
                              <td>
                                <strong>{payroll.employeeName}</strong><br/>
                                <small className="text-muted">{payroll.employeeId}</small>
                              </td>
                              <td>{payroll.department}</td>
                              <td>{payroll.payPeriod}</td>
                              <td>₹{payroll.grossSalary.toLocaleString()}</td>
                              <td><strong>₹{payroll.netPay.toLocaleString()}</strong></td>
                              <td>
                                <span className={getStatusBadge(payroll.status)}>
                                  {payroll.status}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  {(userRole === "super-admin" || userRole === "admin") && (
                                    <>
                                      {payroll.status === 'Draft' && (
                                        <button 
                                          className="btn btn-warning"
                                          onClick={() => updatePayrollStatus(payroll._id, 'Approved')}
                                        >
                                          ✅ Approve
                                        </button>
                                      )}
                                      {payroll.status === 'Approved' && (
                                        <button 
                                          className="btn btn-success"
                                          onClick={() => updatePayrollStatus(payroll._id, 'Paid')}
                                        >
                                          💰 Mark Paid
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <button 
                                    className="btn btn-info"
                                    onClick={() => {
                                      setSelectedPayroll(payroll);
                                      setShowModal(true);
                                    }}
                                  >
                                    👁️ View
                                  </button>
                                </div>
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

        {/* Reports Tab - Super Admin Only */}
        {activeTab === "reports" && userRole === "super-admin" && (
          <div className="row">
            <div className="col-md-3">
              <div className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3>{payrolls.length}</h3>
                  <p>Total Payrolls</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3>{payrolls.filter(p => p.status === 'Paid').length}</h3>
                  <p>Paid Payrolls</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-warning text-white">
                <div className="card-body text-center">
                  <h3>{payrolls.filter(p => p.status === 'Approved').length}</h3>
                  <p>Pending Payment</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3>₹{payrolls.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}</h3>
                  <p>Total Payout</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payroll Detail Modal */}
        {showModal && selectedPayroll && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Payroll Details - {selectedPayroll.employeeName}</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Employee Information</h6>
                      <p><strong>Name:</strong> {selectedPayroll.employeeName}</p>
                      <p><strong>Employee ID:</strong> {selectedPayroll.employeeId}</p>
                      <p><strong>Department:</strong> {selectedPayroll.department}</p>
                      <p><strong>Pay Period:</strong> {selectedPayroll.payPeriod}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Attendance Summary</h6>
                      <p><strong>Working Days:</strong> {selectedPayroll.workingDays}</p>
                      <p><strong>Present Days:</strong> {selectedPayroll.presentDays}</p>
                      <p><strong>Absent Days:</strong> {selectedPayroll.absentDays || 0}</p>
                      <p><strong>Half Days:</strong> {selectedPayroll.halfDays || 0}</p>
                    </div>
                  </div>
                  
                  <hr/>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card border-success h-100">
                        <div className="card-header bg-success text-white">
                          <h6 className="mb-0">💰 Earnings Breakdown</h6>
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
                          {selectedPayroll.incentive > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Incentive:</span>
                              <span>₹{selectedPayroll.incentive?.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedPayroll.overtimePay > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Overtime:</span>
                              <span>₹{selectedPayroll.overtimePay?.toLocaleString()}</span>
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
                          <h6 className="mb-0">Deductions Breakdown</h6>
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
                              <span>LOP Deduction:</span>
                              <span>₹{selectedPayroll.lopDeduction?.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedPayroll.loanDeduction > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Loan Deduction:</span>
                              <span>₹{selectedPayroll.loanDeduction?.toLocaleString()}</span>
                            </div>
                          )}
                          {selectedPayroll.otherDeductions > 0 && (
                            <div className="d-flex justify-content-between mb-1">
                              <span>Other Deductions:</span>
                              <span>₹{selectedPayroll.otherDeductions?.toLocaleString()}</span>
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
                  
                  <hr/>
                  
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <h6 className="text-muted mb-2">Final Calculation</h6>
                      <div className="mb-2">
                        <code>₹{selectedPayroll.totalEarnings?.toLocaleString()} - ₹{selectedPayroll.totalDeductions?.toLocaleString()} = ₹{selectedPayroll.netPay?.toLocaleString()}</code>
                      </div>
                      <h4 className="text-primary mb-0">Net Salary: ₹{selectedPayroll.netPay?.toLocaleString()}</h4>
                      <small className="text-muted">Total Earnings - Total Deductions = Net Salary</small>
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

        {/* Salary Hike Modal */}
        {showHikeModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">📈 Process Salary Hike</h5>
                  <button type="button" className="btn-close" onClick={() => setShowHikeModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Employee</label>
                    <select 
                      className="form-select"
                      value={hikeData.employeeId}
                      onChange={(e) => setHikeData({...hikeData, employeeId: e.target.value})}
                    >
                      <option value="">Select Employee...</option>
                      {employees.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Gross Salary (₹)</label>
                    <input 
                      type="number"
                      className="form-control"
                      value={hikeData.newSalary}
                      onChange={(e) => setHikeData({...hikeData, newSalary: e.target.value})}
                      placeholder="Enter new salary amount"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Effective Date</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={hikeData.effectiveDate}
                      onChange={(e) => setHikeData({...hikeData, effectiveDate: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reason</label>
                    <select 
                      className="form-select"
                      value={hikeData.reason}
                      onChange={(e) => setHikeData({...hikeData, reason: e.target.value})}
                    >
                      <option value="">Select reason...</option>
                      <option value="Promotion">Promotion</option>
                      <option value="Annual Increment">Annual Increment</option>
                      <option value="Performance Bonus">Performance Bonus</option>
                      <option value="Market Adjustment">Market Adjustment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowHikeModal(false)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={processSalaryHike}
                    disabled={loading}
                  >
                    {loading ? '⏳ Processing...' : '📈 Process Hike'}
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