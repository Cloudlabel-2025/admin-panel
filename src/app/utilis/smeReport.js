

export function generateSMEExcel(data, fileName) {
  // Dynamically import xlsx (client-side only)
  import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.book_new();

    const fmtMin  = (m) => m ? `${Math.floor(m / 60)}h ${m % 60}m` : "0h 0m";
    const fmtDT   = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";

    // ── Sheet 1: Summary ──────────────────────────────────────────────────────
    const { summary, startDate, endDate, employeeId } = data;
    const summaryRows = [
      ["SME Work Report"],
      [""],
      ["Employee ID",      employeeId === "all" ? "All SMEs" : employeeId],
      ["Period",           `${startDate}  →  ${endDate}`],
      ["Generated On",     new Date().toLocaleString()],
      [""],
      ["SUMMARY"],
      ["Total Working Days",    summary.totalSessions],
      ["Total Sessions",        summary.totalSessions],
      ["Total Tasks Logged",    summary.totalTasks],
      ["Tasks Completed",       summary.completedTasks],
      ["Task Completion Rate",  summary.totalTasks > 0 ? `${Math.round(summary.completedTasks / summary.totalTasks * 100)}%` : "0%"],
      [""],
      ["HOURS BREAKDOWN"],
      ["Total Duration",        fmtMin(summary.grandTotalDur)],
      ["Total Break / Lunch",   fmtMin(summary.grandTotalBreak)],
      ["Net Working Time",      fmtMin(summary.grandTotalNet)],
      ["Net Working Hours",     `${summary.grandTotalNetHours} hrs`],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 28 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // ── Sheet 2: Daily Sessions ───────────────────────────────────────────────
    const sessionHeaders = [
      "Date", "Employee ID", "Employee Name",
      "Login Time", "Logout Time",
      "Total Duration", "Break Time", "Lunch Time", "Net Working Time",
      "Net Hours", "Productivity %", "Status", "Tasks in Session"
    ];
    const sessionRows = data.sessions.map(s => {
      const totalBreak = (s.totalBreakTime || 0) + (s.totalLunchTime || 0);
      const productivity = s.totalDuration > 0
        ? Math.round((s.netWorkingTime / s.totalDuration) * 100)
        : 0;
      return [
        fmtDate(s.date),
        s.employeeId,
        s.userInfo?.name || s.employeeId,
        fmtDT(s.loginTime),
        s.logoutTime ? fmtDT(s.logoutTime) : "Still Active",
        fmtMin(s.totalDuration),
        fmtMin(s.totalBreakTime || 0),
        fmtMin(s.totalLunchTime || 0),
        fmtMin(s.netWorkingTime),
        +((s.netWorkingTime || 0) / 60).toFixed(2),
        `${productivity}%`,
        s.status.toUpperCase(),
        s.tasks?.length || 0,
      ];
    });

    // Totals row
    sessionRows.push([]);
    sessionRows.push([
      "TOTAL", "", "",
      "", "",
      fmtMin(summary.grandTotalDur),
      fmtMin(data.sessions.reduce((a, s) => a + (s.totalBreakTime || 0), 0)),
      fmtMin(data.sessions.reduce((a, s) => a + (s.totalLunchTime || 0), 0)),
      fmtMin(summary.grandTotalNet),
      summary.grandTotalNetHours,
      "",
      "",
      data.tasks?.length || 0,
    ]);

    const wsSessions = XLSX.utils.aoa_to_sheet([sessionHeaders, ...sessionRows]);
    wsSessions["!cols"] = [
      { wch: 22 }, { wch: 14 }, { wch: 22 },
      { wch: 20 }, { wch: 20 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
      { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSessions, "Daily Sessions");

    // ── Sheet 3: Task Details ─────────────────────────────────────────────────
    const taskHeaders = [
      "Date", "Employee ID", "Employee Name",
      "Task Title", "Description", "Priority", "Status",
      "Start Time", "End Time", "Time Spent (mins)"
    ];
    const taskRows = data.tasks.map(t => [
      fmtDate(t.date),
      t.employeeId,
      t.userInfo?.name || t.employeeId,
      t.title,
      t.description || "",
      (t.priority || "medium").toUpperCase(),
      t.status.replace("-", " ").toUpperCase(),
      t.startTime ? fmtDT(t.startTime) : "—",
      t.endTime   ? fmtDT(t.endTime)   : "—",
      t.timeSpent || 0,
    ]);

    const wsTasks = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]);
    wsTasks["!cols"] = [
      { wch: 22 }, { wch: 14 }, { wch: 22 },
      { wch: 30 }, { wch: 35 }, { wch: 10 }, { wch: 14 },
      { wch: 20 }, { wch: 20 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTasks, "Task Details");

    // ── Sheet 4: Daily Breakdown (per-day totals) ─────────────────────────────
    const dayMap = {};
    for (const s of data.sessions) {
      if (!dayMap[s.date]) dayMap[s.date] = { sessions: [], tasks: [] };
      dayMap[s.date].sessions.push(s);
    }
    for (const t of data.tasks) {
      if (!dayMap[t.date]) dayMap[t.date] = { sessions: [], tasks: [] };
      dayMap[t.date].tasks.push(t);
    }

    const breakdownHeaders = [
      "Date", "Sessions", "Net Working Time", "Net Hours",
      "Break + Lunch", "Tasks Logged", "Tasks Completed", "Productivity %"
    ];
    const breakdownRows = Object.keys(dayMap).sort().map(date => {
      const daySessions = dayMap[date].sessions;
      const dayTasks    = dayMap[date].tasks;
      const net   = daySessions.reduce((a, s) => a + (s.netWorkingTime || 0), 0);
      const brk   = daySessions.reduce((a, s) => a + (s.totalBreakTime || 0) + (s.totalLunchTime || 0), 0);
      const dur   = daySessions.reduce((a, s) => a + (s.totalDuration  || 0), 0);
      const prod  = dur > 0 ? Math.round((net / dur) * 100) : 0;
      const done  = dayTasks.filter(t => t.status === "completed").length;
      return [
        fmtDate(date),
        daySessions.length,
        fmtMin(net),
        +(net / 60).toFixed(2),
        fmtMin(brk),
        dayTasks.length,
        done,
        `${prod}%`,
      ];
    });

    const wsBreakdown = XLSX.utils.aoa_to_sheet([breakdownHeaders, ...breakdownRows]);
    wsBreakdown["!cols"] = [
      { wch: 22 }, { wch: 10 }, { wch: 18 }, { wch: 12 },
      { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBreakdown, "Daily Breakdown");

    XLSX.writeFile(wb, fileName);
  });
}
