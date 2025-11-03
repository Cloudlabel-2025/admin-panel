"use client";

import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function MySkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    const empId = localStorage.getItem("employeeId");
    setEmployeeId(empId);
    if (empId) {
      fetchMySkills(empId);
    }
  }, []);

  const fetchMySkills = async (empId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/skills`);
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        setSkills([]);
        return;
      }
      const data = await res.json();
      console.log('All skills:', data);
      console.log('Current employeeId:', empId);
      if (data.error) {
        console.error('API returned error:', data.error);
        setSkills([]);
        return;
      }
      // Filter skills where employeeId matches the User's employeeId field
      const filteredSkills = Array.isArray(data) ? data.filter(skill => {
        console.log('Checking skill:', skill.skillName, 'employeeId:', skill.employeeId);
        // Check if employeeId is populated (object) or just an ID
        if (typeof skill.employeeId === 'object' && skill.employeeId !== null) {
          return skill.employeeId.employeeId === empId;
        }
        return false;
      }) : [];
      console.log('Filtered skills:', filteredSkills);
      setSkills(filteredSkills);
    } catch (err) {
      console.error("Error fetching skills:", err);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (levels) => {
    if (!levels || levels.length === 0) return 'secondary';
    const highestLevel = levels[levels.length - 1];
    if (highestLevel?.toLowerCase().includes('expert') || highestLevel?.toLowerCase().includes('advanced')) return 'success';
    if (highestLevel?.toLowerCase().includes('intermediate')) return 'warning';
    return 'info';
  };

  return (
    <Layout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="text-primary mb-1">
              🎯 My Skills
            </h1>
            <small className="text-muted">View your skills and proficiency levels</small>
          </div>
          <div className="badge bg-info fs-6">
            {skills.length} Skills
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">🎯 My Skills Overview</h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading your skills...</p>
              </div>
            ) : skills.length === 0 ? (
              <div className="text-center py-5">
                <div style={{fontSize: '3rem'}}>🎯</div>
                <p className="text-muted mt-2 mb-0">
                  No skills found. Skills will appear here when added by your administrator.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>🎯 Skill Name</th>
                      <th>📂 Category</th>
                      <th>📝 Description</th>
                      <th>📊 Proficiency</th>
                      <th>📅 Added Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map((skill) => (
                      <tr key={skill._id} style={{cursor: 'pointer'}} onClick={() => window.location.href = `/my-skills/${skill._id}`}>
                        <td>
                          <div className="fw-semibold text-primary">{skill.skillName}</div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{skill.category || 'Uncategorized'}</span>
                        </td>
                        <td>
                          <small className="text-muted">{skill.description || '—'}</small>
                        </td>
                        <td>
                          {(skill.proficiencyLevels || []).length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {skill.proficiencyLevels.map((level, idx) => (
                                <span key={idx} className={`badge bg-${getProficiencyColor(skill.proficiencyLevels)} text-white`}>
                                  {level}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : '—'}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}