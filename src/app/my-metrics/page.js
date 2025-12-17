"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";

export default function MyMetricsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const empId = localStorage.getItem("employeeId");
    if (!role || !empId) {
      router.push("/");
      return;
    }
    setEmployeeId(empId);
    setUserRole(role);
    fetchMetrics(empId, role);
  }, [router]);

  const fetchMetrics = async (empId, role) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/timecard-metrics?employeeId=${empId}&userRole=${role}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Layout><div className="text-center mt-5"><div className="spinner-border" role="status"></div></div></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid p-4">
        <div className="card shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-4">
            <h3 className="mb-0" style={{ color: '#ffffff' }}>
              <i className="bi bi-graph-up me-2" style={{ color: '#d4af37' }}></i>
              My Performance Metrics
            </h3>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-3">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #28a745' }}>
              <div className="card-body text-center">
                <i className="bi bi-clock-history" style={{ fontSize: '3rem', color: '#28a745' }}></i>
                <h2 className="mt-3 mb-0">{metrics?.totalWorkingHours || 0}h</h2>
                <p className="text-muted mb-0">Total Working Hours</p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #ffc107' }}>
              <div className="card-body text-center">
                <i className="bi bi-exclamation-triangle" style={{ fontSize: '3rem', color: '#ffc107' }}></i>
                <h2 className="mt-3 mb-0">{metrics?.lateLoginCount || 0}</h2>
                <p className="text-muted mb-0">Late Logins</p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm h-100" style={{ border: '2px solid #dc3545' }}>
              <div className="card-body text-center">
                <i className="bi bi-pause-circle" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                <h2 className="mt-3 mb-0">{metrics?.breakOveruseCount || 0}</h2>
                <p className="text-muted mb-0">Break Overuse</p>
              </div>
            </div>
          </div>

          {(userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'super-admin' || userRole?.toLowerCase() === 'developer') && (
            <>
              <div className="col-md-3">
                <div className="card shadow-sm h-100" style={{ border: '2px solid #17a2b8' }}>
                  <div className="card-body text-center">
                    <i className="bi bi-box-arrow-left" style={{ fontSize: '3rem', color: '#17a2b8' }}></i>
                    <h2 className="mt-3 mb-0">{metrics?.earlyLogoutCount || 0}</h2>
                    <p className="text-muted mb-0">Early Logouts</p>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="card shadow-sm" style={{ border: '2px solid #6c757d' }}>
                  <div className="card-header" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', borderBottom: '2px solid #d4af37' }}>
                    <h5 className="mb-0 text-white">Idle Gaps Analysis</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <h3>{metrics?.idleGaps || 0}</h3>
                        <p className="text-muted">Total Idle Gaps</p>
                      </div>
                      <div className="col-md-9">
                        {metrics?.idleGapDetails?.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>From</th>
                                  <th>To</th>
                                  <th>Gap (min)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {metrics.idleGapDetails.slice(0, 5).map((gap, idx) => (
                                  <tr key={idx}>
                                    <td>{new Date(gap.date).toLocaleDateString()}</td>
                                    <td>{gap.from}</td>
                                    <td>{gap.to}</td>
                                    <td>{gap.gap}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted">No idle gaps detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
