"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function CreateSkill() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    skillName: "",
    category: "General",
    description: "",
    proficiencyLevel: "Beginner",
  });

  const levelOptions = ["Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    fetch("/api/User")
      .then((res) => res.json())
      .then(setEmployees);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      employeeId: form.employeeId,
      skillName: form.skillName,
      category: form.category,
      description: form.description,
      proficiencyLevels: [form.proficiencyLevel], // save as array
    };

    await fetch("/api/skills", {
      method: "POST",
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
            <h1 className="h4 mb-4">Add Skill</h1>
            <form onSubmit={handleSubmit}>
              {/* Employee */}
              <div className="mb-3">
                <label className="form-label">Employee</label>
                <select
                  className="form-select"
                  value={form.employeeId}
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
                  placeholder="Enter skill name"
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
                  placeholder="Enter category"
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
                  placeholder="Enter description"
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

              <button type="submit" className="btn btn-success w-100">
                Save Skill
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
