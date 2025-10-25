"use client";
import { useState, useEffect } from "react";
import Layout from "../../components/Layout";

export default function EmployeeList() {
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
      <div className="container-fluid mt-4 px-4">
        <h2 className="text-center mb-4">Employee List</h2>

        {loading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="alert alert-warning text-center">No users found.</div>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-primary">
                  <tr className="text-center">
                    <th style={{ minWidth: '60px' }}>S.no</th>
                    <th style={{ minWidth: '120px' }}>Employee ID</th>
                    <th style={{ minWidth: '120px' }}>First Name</th>
                    <th style={{ minWidth: '120px' }}>Last Name</th>
                    <th style={{ minWidth: '120px' }}>Department</th> 
                    <th style={{ minWidth: '100px' }}>Role</th>
                    <th style={{ minWidth: '200px' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, index) => (
                    <tr key={user._id} className="text-center">
                      <td>{startIndex + index + 1}</td>
                      <td>{user.employeeId}</td>
                      <td>{user.firstName}</td>
                      <td>{user.lastName}</td>
                      <td>{user.department}</td>
                      <td>{user.role}</td>
                      <td>{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="d-flex justify-content-center mt-4">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                      First
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(page)}>
                            {page}
                          </button>
                        </li>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <li key={page} className="page-item disabled"><span className="page-link">...</span></li>;
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                      Last
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            <div className="text-center text-muted mt-2">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of {users.length} employees
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
