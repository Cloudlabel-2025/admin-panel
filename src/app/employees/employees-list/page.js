"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";

export default function EmployeeList() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/Employee");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentUsers = users.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Layout>
      <div className="container-fluid mt-3 mt-md-4 px-2 px-md-4">
        {/* Header Card */}
        <div className="card shadow-sm mb-3 mb-md-4" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37' }}>
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <h2 className="mb-1 fs-4 fs-md-3" style={{ color: '#ffffff', textShadow: '2px 2px 4px rgba(212, 175, 55, 0.3)' }}>
                  <i className="bi bi-people-fill me-2" style={{ color: '#d4af37' }}></i>
                  <span className="d-none d-sm-inline">Employee Directory</span>
                  <span className="d-sm-none">Employees</span>
                </h2>
                <p className="mb-0 small" style={{ color: '#d4af37' }}>Manage and view all employees</p>
              </div>
              <div className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000000', fontSize: '1rem', padding: '8px 16px', border: '2px solid #d4af37' }}>
                {users.length} <span className="d-none d-sm-inline">Employees</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-body text-center py-5">
              <div className="spinner-border" style={{ color: '#d4af37', width: '3rem', height: '3rem' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 mb-0" style={{ color: '#000000' }}>Loading employees...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="card shadow-sm" style={{ border: '2px solid #d4af37' }}>
            <div className="card-body text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '4rem', color: '#d4af37' }}></i>
              <h5 className="mt-3" style={{ color: '#000000' }}>No Employees Found</h5>
              <p className="text-muted">Start by adding employees to your organization</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="card shadow-sm d-none d-lg-block" style={{ border: '2px solid #d4af37' }}>
              <div className="card-body p-0">
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-dark">
                      <tr className="text-center">
                        <th style={{ minWidth: '60px' }}>S.no</th>
                        <th style={{ minWidth: '80px' }}>Photo</th>
                        <th style={{ minWidth: '120px' }}>Employee ID</th>
                        <th style={{ minWidth: '180px' }}>Name</th>
                        <th style={{ minWidth: '120px' }}>Department</th> 
                        <th style={{ minWidth: '100px' }}>Role</th>
                        <th style={{ minWidth: '200px' }}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((user, index) => (
                        <tr key={user._id} className="text-center" style={{ transition: 'all 0.3s ease' }}>
                          <td>
                            <span className="badge" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', color: '#d4af37', border: '1px solid #d4af37', padding: '5px 10px' }}>
                              {startIndex + index + 1}
                            </span>
                          </td>
                          <td>
                            {user.profilePicture ? (
                              <img 
                                src={user.profilePicture} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="rounded-circle"
                                style={{ width: '40px', height: '40px', objectFit: 'cover', border: '2px solid #d4af37', cursor: 'pointer' }}
                                onClick={() => router.push(`/employees/${user.employeeId}`)}
                              />
                            ) : (
                              <div 
                                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', border: '2px solid #d4af37', cursor: 'pointer' }}
                                onClick={() => router.push(`/employees/${user.employeeId}`)}
                              >
                                <i className="bi bi-person-fill" style={{ fontSize: '20px', color: '#999' }}></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <strong onClick={() => router.push(`/employees/${user.employeeId}`)} style={{ color: '#000000', cursor: 'pointer' }}>
                              {user.employeeId}
                            </strong>
                          </td>
                          <td>
                            <span onClick={() => router.push(`/employees/${user.employeeId}`)} style={{ color: '#000000', cursor: 'pointer' }}>
                              {user.firstName} {user.lastName}
                            </span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000000', border: '1px solid #d4af37' }}>
                              {user.department}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-secondary" style={{ border: '1px solid #d4af37' }}>
                              {user.role}
                            </span>
                          </td>
                          <td><small>{user.email}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="d-lg-none">
              {currentUsers.map((user, index) => (
                <div key={user._id} className="card shadow-sm mb-3" style={{ border: '2px solid #d4af37' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="rounded-circle"
                            style={{ width: '50px', height: '50px', objectFit: 'cover', border: '2px solid #d4af37' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '50px', height: '50px', backgroundColor: '#f0f0f0', border: '2px solid #d4af37' }}
                          >
                            <i className="bi bi-person-fill" style={{ fontSize: '24px', color: '#999' }}></i>
                          </div>
                        )}
                        <span className="badge" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', color: '#d4af37', border: '1px solid #d4af37', padding: '6px 12px' }}>
                          #{startIndex + index + 1}
                        </span>
                      </div>
                      <span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000000', border: '1px solid #d4af37' }}>
                        {user.department}
                      </span>
                    </div>
                    <h6 className="mb-2" onClick={() => router.push(`/employees/${user.employeeId}`)} style={{ color: '#000000', cursor: 'pointer' }}>
                      {user.firstName} {user.lastName}
                    </h6>
                    <div className="mb-2">
                      <small className="text-muted">ID:</small> <strong onClick={() => router.push(`/employees/${user.employeeId}`)} style={{ cursor: 'pointer' }}>{user.employeeId}</strong>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Role:</small> 
                      <span className="badge bg-secondary ms-2" style={{ border: '1px solid #d4af37' }}>
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <small className="text-muted">Email:</small>
                      <div className="small text-break">{user.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="card shadow-sm mt-3 mt-md-4" style={{ border: '2px solid #d4af37' }}>
                <div className="card-body p-2 p-md-3">
                  <nav className="d-flex justify-content-center">
                    <ul className="pagination mb-0 flex-wrap">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link px-2 px-md-3" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ border: '1px solid #d4af37', color: '#000000', fontSize: '0.875rem' }}>
                          <i className="bi bi-chevron-double-left"></i> <span className="d-none d-md-inline">First</span>
                        </button>
                      </li>
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link px-2 px-md-3" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} style={{ border: '1px solid #d4af37', color: '#000000', fontSize: '0.875rem' }}>
                          <i className="bi bi-chevron-left"></i> <span className="d-none d-sm-inline">Prev</span>
                        </button>
                      </li>
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button 
                                className="page-link px-2 px-md-3" 
                                onClick={() => setCurrentPage(page)}
                                style={currentPage === page ? 
                                  { background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)', border: '2px solid #d4af37', color: '#d4af37', fontSize: '0.875rem' } : 
                                  { border: '1px solid #d4af37', color: '#000000', fontSize: '0.875rem' }
                                }
                              >
                                {page}
                              </button>
                            </li>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <li key={page} className="page-item disabled"><span className="page-link px-2" style={{ border: '1px solid #d4af37', fontSize: '0.875rem' }}>...</span></li>;
                        }
                        return null;
                      })}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link px-2 px-md-3" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} style={{ border: '1px solid #d4af37', color: '#000000', fontSize: '0.875rem' }}>
                          <span className="d-none d-sm-inline">Next</span> <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link px-2 px-md-3" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={{ border: '1px solid #d4af37', color: '#000000', fontSize: '0.875rem' }}>
                          <span className="d-none d-md-inline">Last</span> <i className="bi bi-chevron-double-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                  <div className="text-center mt-2 mt-md-3">
                    <span className="badge" style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)', color: '#000000', fontSize: '0.8rem', padding: '6px 12px', border: '1px solid #d4af37' }}>
                      <span className="d-none d-sm-inline">Showing </span>{startIndex + 1}-{Math.min(startIndex + itemsPerPage, users.length)} <span className="d-none d-sm-inline">of {users.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .table-hover tbody tr:hover {
          background-color: rgba(212, 175, 55, 0.1) !important;
          border-left: 4px solid #d4af37;
        }
        .page-link:hover {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%) !important;
          color: #000000 !important;
          border-color: #d4af37 !important;
        }
      `}</style>
    </Layout>
  );
}
