"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function EditSkill() {
  const { id } = useParams();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(null);
  const levelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    fetch("/api/User")
      .then((res) => res.json())
      .then(setEmployees);

    fetch(`/api/skills/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...data,
          proficiencyLevel: data.proficiencyLevels?.[0] || "Beginner",
        });
      });
  }, [id]);

  if (!form) return <p className="p-6">Loading...</p>;

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      proficiencyLevels: [form.proficiencyLevel], // store single value inside array
    };

    await fetch(`/api/skills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    router.push("/skills");
  }

  return (
    <Layout>
      <div className="container my-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <h1 className="h4 mb-4">Edit Skill</h1>
            <form onSubmit={handleSubmit}>
              {/* Employee */}
              <div className="mb-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Name */}
              <div className="mb-3">
                <label className="form-label">Skill Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.skillName}
                  onChange={(e) =>
                    setForm({ ...form, skillName: e.target.value })
                  }
                  required
                />
              </div>

              {/* Category */}
              <div className="mb-3">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* Proficiency Level Dropdown */}
              <div className="mb-3">
                <label className="form-label">Proficiency Level</label>
                <select
                  className="form-select"
                  value={form.proficiencyLevel}
                  onChange={(e) =>
                    setForm({ ...form, proficiencyLevel: e.target.value })
                  }
                >
                  {levelOptions.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Update Skill
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
