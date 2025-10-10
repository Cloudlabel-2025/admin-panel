"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";

export default function SkillList() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        setSkills(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this skill?")) return;
    await fetch(`/api/skills/${id}`, { method: "DELETE" });
    setSkills(skills.filter((s) => s._id !== id));
  }

  return (
    <Layout>
      <div className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Skills</h1>
          <Link href="/skills/create" className="btn btn-primary">
            Add Skill
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Employee</th>
                  <th>Skill Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Levels</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((s) => (
                  <tr key={s._id}>
                    <td>{s.employeeId?.name || "N/A"}</td>
                    <td>{s.skillName}</td>
                    <td>{s.category}</td>
                    <td>{s.description}</td>
                    <td>{(s.proficiencyLevels || []).join(", ")}</td>
                    <td className="d-flex gap-2">
                      <Link
                        href={`/skills/${s._id}/edit`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
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
