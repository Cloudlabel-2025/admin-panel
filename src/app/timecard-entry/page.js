"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";

export default function TimecardPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [timecards, setTimecards] = useState([]);
  const [current, setCurrent] = useState(null);
  const [permission, setPermission] = useState(0); // in hours
  const [reason, setReason] = useState("");
  const [permissionLocked, setPermissionLocked] = useState(false);

  // Helpers
  const getTimeString = () =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const getDateString = () => new Date().toISOString().split("T")[0];
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
    return d.toLocaleDateString("en-GB") + ` (${dayName})`;
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    if (role !== "employee" || !empId) {
      router.push("/");
      return;
    }
    setEmployeeId(empId);
  }, [router]);

  // Fetch all records
  const fetchTimecards = async () => {
    if (!employeeId) return;
    const res = await fetch(`/api/timecard?employeeId=${employeeId}`);
    if (!res.ok) return;
    const data = await res.json();
    setTimecards(data);

    const today = data.find((t) => t.date?.startsWith(getDateString()));
    if (today) {
      setCurrent(today);
      setPermission(Number(today.permission) || 0);
      setReason(today.reason || "");
      if (today.permission && today.reason) {
        setPermissionLocked(true); // disable inputs if already saved
      }
    } else {
      const newEntry = { employeeId, date: getDateString(), logIn: getTimeString() };
      const res2 = await fetch("/api/timecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const data2 = await res2.json();
      if (data2.timecard) {
        setCurrent(data2.timecard);
        setTimecards([data2.timecard, ...data]);
      }
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchTimecards();
    }
  }, [employeeId]);

  // Update record
  const updateTimecard = async (updates) => {
    if (!current?._id) return;
    const res = await fetch("/api/timecard", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: current._id, ...updates }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.timecard) {
      setCurrent(data.timecard);
      setTimecards((prev) =>
        prev.map((t) => (t._id === data.timecard._id ? data.timecard : t))
      );
    }
  };

  // Actions
  const handleLogOut = () => updateTimecard({ logOut: getTimeString() });
  const handleLunchOut = () => {
    if (!current?.lunchOut) updateTimecard({ lunchOut: getTimeString() });
  };
  const handleLunchIn = () => {
    if (current?.lunchOut && !current?.lunchIn) updateTimecard({ lunchIn: getTimeString() });
  };
  const handleSavePermission = () => {
    updateTimecard({ permission, reason });
    setPermissionLocked(true); // disable further edits
  };
  const handleLock = () => updateTimecard({ lockTime: getTimeString() });

  // Hours calculation
  const calcTotalHours = (t) => {
    if (!t.logIn || !t.logOut) return "-";
    const [liH, liM] = t.logIn.split(":").map(Number);
    const [loH, loM] = t.logOut.split(":").map(Number);
    let start = liH * 60 + liM;
    let end = loH * 60 + loM;
    if (end < start) end += 24 * 60;

    let worked = end - start;

    if (t.lunchOut && t.lunchIn) {
      const [lo1, lo2] = t.lunchOut.split(":").map(Number);
      const [li1, li2] = t.lunchIn.split(":").map(Number);
      worked -= li1 * 60 + li2 - (lo1 * 60 + lo2);
    }

    if (t.permission) worked -= Number(t.permission) * 60;

    if (worked < 0) worked = 0; // clamp to prevent negatives

    const hh = String(Math.floor(worked / 60)).padStart(2, "0");
    const mm = String(worked % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const isShort = (t) => {
    const total = calcTotalHours(t);
    if (total === "-") return false;
    const [hh] = total.split(":").map(Number);
    return hh < 8;
  };

  // Export Excel
  const exportReport = () => {
    if (!timecards.length) return;
    const wsData = timecards.map((t) => ({
      Date: formatDate(t.date),
      LogIn: t.logIn || "-",
      LogOut: t.logOut || "-",
      LunchOut: t.lunchOut || "-",
      LunchIn: t.lunchIn || "-",
      Permission: t.permission ? `${t.permission} hr` : "-",
      Reason: t.reason || "-",
      TotalHours: calcTotalHours(t),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Report");
    XLSX.writeFile(wb, "Monthly_Report.xlsx");
  };

  if (!employeeId) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <h1>Timecard</h1>
      <p>
        Employee ID: <b>{employeeId}</b>
      </p>

      <p>LogIn: {current?.logIn || "-"}</p>
      <p>LogOut: {current?.logOut || "-"}</p>

      {/* Lunch Buttons */}
      <div className="mt-3">
        <button className="btn btn-warning me-2" onClick={handleLunchOut} disabled={!!current?.lunchOut}>Lunch Out</button>
        <button className="btn btn-success" onClick={handleLunchIn} disabled={!current?.lunchOut || !!current?.lunchIn}>Lunch In</button>
      </div>
      <p className="mt-2">Lunch Out: {current?.lunchOut || "-"} | Lunch In: {current?.lunchIn || "-"}</p>

      {/* Permission */}
      <div className="mt-3 d-flex gap-2">
        <input type="number" min="0" className="form-control w-auto" value={permission} onChange={(e) => setPermission(Number(e.target.value))} placeholder="Permission (hours)" disabled={permissionLocked} />
        <input type="text" className="form-control w-auto" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} disabled={permissionLocked} />
        <button onClick={handleSavePermission} className="btn btn-primary" disabled={permissionLocked}>Save</button>
      </div>

      {/* Actions */}
      <div className="mt-3 d-flex gap-2">
        <button onClick={handleLogOut} disabled={!!current?.logOut} className="btn btn-danger">LogOut</button>
        <button onClick={exportReport} className="btn btn-success">Export Monthly Report</button>
      </div>

      {/* Monthly Table */}
      <h2 className="mt-4">Monthly Records</h2>
      <table className="table table-bordered mt-2">
        <thead>
          <tr>
            <th>Date</th>
            <th>LogIn</th>
            <th>LogOut</th>
            <th>LunchOut</th>
            <th>LunchIn</th>
            <th>Permission</th>
            <th>Reason</th>
            <th>Total Hours</th>
          </tr>
        </thead>
        <tbody>
          {timecards.map((t) => (
            <tr key={t._id}>
              <td>{formatDate(t.date)}</td>
              <td>{t.logIn || "-"}</td>
              <td>{t.logOut || "-"}</td>
              <td>{t.lunchOut || "-"}</td>
              <td>{t.lunchIn || "-"}</td>
              <td>{t.permission ? `${t.permission} hr` : "-"}</td>
              <td>{t.reason || "-"}</td>
              <td className={isShort(t) ? "text-danger fw-bold" : ""}>{calcTotalHours(t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
