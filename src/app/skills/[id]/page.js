"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import SuccessMessage from "../../components/SuccessMessage";

export default function ViewSkill() {
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      fetch(`/api/skills/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Skill not found");
          return res.json();
        })
        .then((data) => {
          setSkill(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setSuccessMessage("Skill not found");
          setShowSuccess(true);
          setTimeout(() => router.push("/skills"), 2000);
        });
    }
  }, [params.id, router]);

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (!skill) return <Layout><p>Skill not found</p></Layout>;

  return (
    <Layout>
      {showSuccess && (
        <SuccessMessage 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-primary">🎯 Skill Details</h1>
          <button className="btn btn-secondary" onClick={() => router.back()}>
            ← Back
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">{skill.skillName}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>👤 Employee</h6>
                <p>{skill.employeeId?.name || "N/A"}</p>
                
                <h6>📂 Category</h6>
                <p><span className="badge bg-secondary">{skill.category || "Uncategorized"}</span></p>
                
                <h6>📝 Description</h6>
                <p>{skill.description || "No description provided"}</p>
              </div>
              <div className="col-md-6">
                <h6>📊 Proficiency Levels</h6>
                {skill.proficiencyLevels && skill.proficiencyLevels.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {skill.proficiencyLevels.map((level, idx) => (
                      <span key={idx} className="badge bg-success">
                        {level}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No proficiency levels set</p>
                )}
                
                <h6 className="mt-3">📅 Created</h6>
                <p>{skill.createdAt ? new Date(skill.createdAt).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}