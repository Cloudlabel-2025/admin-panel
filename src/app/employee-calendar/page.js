"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function EmployeeCalendarPage() {
  const [holidays, setHolidays] = useState([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchHolidays();
  }, [currentYear, currentMonth]);

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/holiday?year=${currentYear}&month=${currentMonth}`);
      const data = await res.json();
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getUpcomingHolidays = () => {
    const today = new Date();
    return holidays.filter(holiday => new Date(holiday.date) >= today).slice(0, 5);
  };

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Holiday Calendar</h2>
          <div>
            <select 
              className="form-select d-inline-block w-auto me-2"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index + 1}>{month}</option>
              ))}
            </select>
            <select 
              className="form-select d-inline-block w-auto"
              value={currentYear}
              onChange={(e) => setCurrentYear(e.target.value)}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <h5>Holidays - {monthNames[currentMonth - 1]} {currentYear}</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Date</th>
                        <th>Holiday Name</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holidays.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            No holidays found for this month
                          </td>
                        </tr>
                      ) : (
                        holidays.map((holiday) => (
                          <tr key={holiday._id}>
                            <td>{new Date(holiday.date).toLocaleDateString()}</td>
                            <td>{holiday.name}</td>
                            <td>
                              <span className={`badge ${
                                holiday.type === 'Public' ? 'bg-success' :
                                holiday.type === 'Company' ? 'bg-primary' : 'bg-warning'
                              }`}>
                                {holiday.type}
                              </span>
                            </td>
                            <td>{holiday.description || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5>Upcoming Holidays</h5>
                {getUpcomingHolidays().length === 0 ? (
                  <p className="text-muted">No upcoming holidays</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {getUpcomingHolidays().map((holiday) => (
                      <div key={holiday._id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between">
                          <strong>{holiday.name}</strong>
                          <span className={`badge ${
                            holiday.type === 'Public' ? 'bg-success' :
                            holiday.type === 'Company' ? 'bg-primary' : 'bg-warning'
                          }`}>
                            {holiday.type}
                          </span>
                        </div>
                        <small className="text-muted">
                          {new Date(holiday.date).toLocaleDateString()}
                        </small>
                        {holiday.description && (
                          <p className="mb-0 mt-1 small">{holiday.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}