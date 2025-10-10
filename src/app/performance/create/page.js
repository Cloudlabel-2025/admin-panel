"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/components/Layout";

export default function CreatePerformance() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    reviewPeriod: "",
    reviewer: "",
    goals: [""],
    achievements: [""],
    ratings: {
      communication: 1,
      teamwork: 1,
      problemsolving: 1,
      leadership: 1,
    },
    overall: 1,
    comments: "",
  });

  useEffect(() => {
    fetch("/api/User")
      .then((res) => res.json())
      .then(setEmployees);
  }, []);

  function handleArrayChange(field, index, value) {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  }

  function addField(field) {
    setForm({ ...form, [field]: [...form[field], ""] });
  }

  function removeField(field, index) {
    const updated = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: updated });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch("/api/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/performance");
  }

  return (
    <Layout>
      <div className="container my-4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <h1 className="h4 mb-4 text-center">Add Performance Review</h1>
            <form
              onSubmit={handleSubmit}
              className="bg-white p-4 rounded shadow-sm"
            >
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
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Review Period</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.reviewPeriod}
                    onChange={(e) =>
                      setForm({ ...form, reviewPeriod: e.target.value })
                    }
                    placeholder="e.g. Q3 2025"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Reviewer</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.reviewer}
                    onChange={(e) =>
                      setForm({ ...form, reviewer: e.target.value })
                    }
                    placeholder="e.g. Manager Name"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Goals</label>
                {form.goals.map((g, i) => (
                  <div key={i} className="d-flex mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={g}
                      onChange={(e) =>
                        handleArrayChange("goals", i, e.target.value)
                      }
                      placeholder="Goal"
                    />
                    <button
                      type="button"
                      className="btn btn-danger ms-2"
                      onClick={() => removeField("goals", i)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => addField("goals")}
                >
                  + Add Goal
                </button>
              </div>
              <div className="mb-3">
                <label className="form-label">Achievements</label>
                {form.achievements.map((a, i) => (
                  <div key={i} className="d-flex mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={a}
                      onChange={(e) =>
                        handleArrayChange("achievements", i, e.target.value)
                      }
                      placeholder="Achievement"
                    />
                    <button
                      type="button"
                      className="btn btn-danger ms-2"
                      onClick={() => removeField("achievements", i)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => addField("achievements")}
                >
                  + Add Achievement
                </button>
              </div>
              <h5 className="mt-4">Ratings (1–5)</h5>
              <div className="row">
                {Object.keys(form.ratings).map((key) => (
                  <div key={key} className="col-md-6 mb-3">
                    <label className="form-label text-capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={form.ratings[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ratings: {
                            ...form.ratings,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className="form-label">Overall Score</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-control"
                  value={form.overall}
                  onChange={(e) =>
                    setForm({ ...form, overall: Number(e.target.value) })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Comments</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.comments}
                  onChange={(e) =>
                    setForm({ ...form, comments: e.target.value })
                  }
                  placeholder="Enter comments..."
                />
              </div>

              <button type="submit" className="btn btn-success w-100">
                Save Review
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
