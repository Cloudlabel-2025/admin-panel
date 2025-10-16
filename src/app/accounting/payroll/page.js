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
        alert("Payroll generated successfully!");
        setPreviewData(data.payroll);
        fetchPayrolls();
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
          <button className="btn btn-success" onClick={exportPayrolls}>
            📊 Export Report
          </button>
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

                  <button 
                    className="btn btn-primary btn-lg w-100"
                    onClick={generatePayroll}
                    disabled={loading || !selectedEmployee || !payPeriod}
                  >
                    {loading ? "⏳ Generating..." : "🚀 Generate Payroll"}
                  </button>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {previewData && (
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">💰 Payroll Preview</h5>
                  </div>
                  <div className="card-body">
                    <h6>{previewData.employeeName}</h6>
                    <p className="text-muted">{previewData.department} • {previewData.payPeriod}</p>
                    
                    <div className="mb-3">
                      <strong>Earnings:</strong>
                      <ul className="list-unstyled ms-3">
                        <li>Basic: ₹{previewData.basicSalary}</li>
                        <li>HRA: ₹{previewData.hra}</li>
                        <li>Allowances: ₹{previewData.da + previewData.conveyance + previewData.medical}</li>
                        <li>Bonus: ₹{previewData.bonus}</li>
                      </ul>
                      <strong>Total Earnings: ₹{previewData.totalEarnings}</strong>
                    </div>

                    <div className="mb-3">
                      <strong>Deductions (from Total Earnings):</strong>
                      <ul className="list-unstyled ms-3">
                        <li>PF: ₹{previewData.pf}</li>
                        <li>ESI: ₹{previewData.esi}</li>
                        <li>Professional Tax: ₹{previewData.professionalTax || 0}</li>
                        <li>LOP: ₹{previewData.lopDeduction}</li>
                        <li>Loan: ₹{previewData.loanDeduction || 0}</li>
                        <li>Other: ₹{previewData.otherDeductions || 0}</li>
                      </ul>
                      <strong>Total Deductions: ₹{previewData.totalDeductions}</strong>
                    </div>

                    <div className="alert alert-info mb-3">
                      <strong>Calculation:</strong><br/>
                      Total Earnings - Total Deductions = Net Salary
                    </div>

                    <div className="alert alert-success">
                      <h4>Net Salary: ₹{previewData.netPay}</h4>
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
                      <h6>Earnings</h6>
                      <ul className="list-unstyled">
                        <li>Basic Salary: ₹{selectedPayroll.basicSalary}</li>
                        <li>HRA: ₹{selectedPayroll.hra}</li>
                        <li>DA: ₹{selectedPayroll.da}</li>
                        <li>Conveyance: ₹{selectedPayroll.conveyance}</li>
                        <li>Medical: ₹{selectedPayroll.medical}</li>
                        <li>Bonus: ₹{selectedPayroll.bonus || 0}</li>
                        <li>Incentive: ₹{selectedPayroll.incentive || 0}</li>
                        <li>Overtime: ₹{selectedPayroll.overtimePay || 0}</li>
                      </ul>
                      <strong>Total Earnings: ₹{selectedPayroll.totalEarnings}</strong>
                    </div>
                    <div className="col-md-6">
                      <h6>Deductions</h6>
                      <ul className="list-unstyled">
                        <li>PF: ₹{selectedPayroll.pf}</li>
                        <li>ESI: ₹{selectedPayroll.esi}</li>
                        <li>Professional Tax: ₹{selectedPayroll.professionalTax || 0}</li>
                        <li>LOP: ₹{selectedPayroll.lopDeduction || 0}</li>
                        <li>Loan: ₹{selectedPayroll.loanDeduction || 0}</li>
                        <li>Other: ₹{selectedPayroll.otherDeductions || 0}</li>
                      </ul>
                      <strong>Total Deductions: ₹{selectedPayroll.totalDeductions}</strong>
                    </div>
                  </div>
                  
                  <hr/>
                  
                  <div className="text-center">
                    <h4 className="text-success">Net Salary: ₹{selectedPayroll.netPay}</h4>
                    <p className="text-muted">Total Earnings - Total Deductions = Net Salary</p>
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