"use client";

import { useEffect, useState } from "react";

export default function PayrollPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [weekendWork, setWeekendWork] = useState(0);
  const [loan, setLoan] = useState(0);
  const [manualLOPDays, setManualLOPDays] = useState(0);
  const [calc, setCalc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function fetchEmployeeData(id) {
    if (!id) return;
    setLoading(true);
    setMessage(null);
    try {
      const empRes = await fetch(`/api/Employee/${id}`);
      const empData = empRes.ok ? await empRes.json() : null;

      const attRes = await fetch(`/api/Attendance?employeeId=${id}`);
      const attData = attRes.ok ? await attRes.json() : null;

      setEmployeeInfo(
        empData ? {
          name: `${empData.firstName} ${empData.lastName}`,
          department: empData.department,
          designation: empData.designation,
          grossSalary: empData.payroll?.salary || 0,
        } : {
          name: id,
          department: "-",
          designation: "-",
          grossSalary: 0,
        }
      );

      setAttendance(
        attData ? {
          presentDays: attData.filter(a => a.status === "Present").length,
          totalWorkingHours: 0,
          expectedWorkingDays: 26,
        } : {
          presentDays: 0,
          totalWorkingHours: 0,
          expectedWorkingDays: 26,
        }
      );

      if (empData?.loan) setLoan(empData.loan);
      setMessage("Data fetched — verify values then generate payroll.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch employee/attendance data.");
    } finally {
      setLoading(false);
    }
  }

  function computePayroll() {
    const gross = Number(employeeInfo?.grossSalary ?? 0);
    const expectedWorkingDays = Number(attendance?.expectedWorkingDays ?? 26);
    const presentDays = Number(attendance?.presentDays ?? 0);

    const basic = round(gross * 0.5);
    const hra = round(gross * 0.2);
    const da = round(gross * 0.15);
    const conveyance = round(gross * 0.1);
    const medical = round(gross * 0.05);
    const bonusVal = Number(bonus || 0);
    const weekendVal = Number(weekendWork || 0);
    const totalEarnings = round(basic + hra + da + conveyance + medical + bonusVal + weekendVal);

    const pf = round(basic * 0.06);
    const esi = gross <= 21000 ? round(gross * 0.0075) : 0;

    const perDaySalary = expectedWorkingDays > 0 ? round(gross / expectedWorkingDays) : 0;
    const computedLOPDays = Math.max(0, expectedWorkingDays - presentDays);
    const lopDays = Number(manualLOPDays) > 0 ? Number(manualLOPDays) : computedLOPDays;
    const lopAmount = round(perDaySalary * lopDays);
    const loanDeduction = Number(loan || 0);
    const totalDeductions = round(pf + esi + lopAmount + loanDeduction);
    const netPay = round(totalEarnings - totalDeductions);

    setCalc({
      gross,
      basic,
      hra,
      da,
      conveyance,
      medical,
      bonus: bonusVal,
      weekendWork: weekendVal,
      totalEarnings,
      pf,
      esi,
      perDaySalary,
      lopDays,
      lopAmount,
      loanDeduction,
      totalDeductions,
      netPay,
      expectedWorkingDays,
      presentDays,
    });
  }

  useEffect(() => {
    if (employeeInfo && attendance) computePayroll();
  }, [employeeInfo, attendance, bonus, weekendWork, loan, manualLOPDays]);

  function round(v) {
    return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
  }

  async function handleGenerate() {
    if (!employeeId) return setMessage("Provide an employee ID first.");
    setLoading(true);
    setMessage(null);
    try {
      const payload = {
        employeeId,
        employeeInfo,
        attendance,
        calculations: calc,
        createdAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/payroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessage("Failed to save payroll: " + err);
      } else {
        setMessage("Payroll generated and saved successfully.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save payroll.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-fluid" style={{ padding: "30px 20px", minHeight: "85vh" }}>
      <h2 className="mb-4 text-center">Payroll Auto Generation</h2>

      <div className="card mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body row align-items-end">
          <div className="col-md-4">
            <label className="form-label">Employee ID</label>
            <input
              type="text"
              className="form-control"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.trim())}
              placeholder="Enter employee ID (e.g., CHC0001)"
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              onClick={() => fetchEmployeeData(employeeId)}
              disabled={loading || !employeeId}
            >
              {loading ? "Fetching..." : "Fetch Data"}
            </button>
          </div>
        </div>
      </div>

      {/* Employee & Attendance Info */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card mb-4" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h5>Employee Info</h5>
              <p>Name: <strong>{employeeInfo?.name ?? "-"}</strong></p>
              <p>Department: <strong>{employeeInfo?.department ?? "-"}</strong></p>
              <p>Designation: <strong>{employeeInfo?.designation ?? "-"}</strong></p>
              <p>Gross Salary: <strong>{employeeInfo?.grossSalary ?? 0}</strong></p>
              <hr />
              <h6>Attendance</h6>
              <p>Present Days: <strong>{attendance?.presentDays ?? 0}</strong></p>
              <p>Expected Working Days: <strong>{attendance?.expectedWorkingDays ?? 26}</strong></p>

              <label className="form-label">Manual LOP Days (optional)</label>
              <input
                type="number"
                className="form-control"
                value={manualLOPDays}
                onChange={(e) => setManualLOPDays(e.target.value)}
              />
            </div>
          </div>

          <div className="card mb-4" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h5>Adjustable Fields</h5>
              <label className="form-label">Bonus</label>
              <input
                type="number"
                className="form-control mb-3"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
              />
              <label className="form-label">Weekend Work Allowance</label>
              <input
                type="number"
                className="form-control mb-3"
                value={weekendWork}
                onChange={(e) => setWeekendWork(e.target.value)}
              />
              <label className="form-label">Loan Deduction</label>
              <input
                type="number"
                className="form-control"
                value={loan}
                onChange={(e) => setLoan(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card" style={{ borderRadius: 12 }}>
            <div className="card-body">
              <h5>Salary Breakdown</h5>
              {calc ? (
                <>
                  <ul>
                    <li>Basic: {calc.basic}</li>
                    <li>HRA: {calc.hra}</li>
                    <li>DA: {calc.da}</li>
                    <li>Conveyance: {calc.conveyance}</li>
                    <li>Medical: {calc.medical}</li>
                    <li>Bonus: {calc.bonus}</li>
                    <li>Weekend Work: {calc.weekendWork}</li>
                    <li><strong>Total Earnings: {calc.totalEarnings}</strong></li>
                  </ul>
                  <h6>Deductions</h6>
                  <ul>
                    <li>PF: {calc.pf}</li>
                    <li>ESI: {calc.esi}</li>
                    <li>LOP: {calc.lopAmount}</li>
                    <li>Loan: {calc.loanDeduction}</li>
                    <li><strong>Total Deductions: {calc.totalDeductions}</strong></li>
                  </ul>
                  <div className="bg-light p-3 rounded mt-3 text-center">
                    <h4>Net Pay: ₹{calc.netPay}</h4>
                  </div>
                  <div className="text-end mt-3">
                    <button className="btn btn-success me-2" onClick={computePayroll}>Recalculate</button>
                    <button className="btn btn-primary" onClick={handleGenerate}>Generate Payroll Slip</button>
                  </div>
                </>
              ) : (
                <p className="text-muted">Enter employee ID and fetch data to view calculations.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
}
