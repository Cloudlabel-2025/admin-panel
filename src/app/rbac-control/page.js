"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

export default function RBACControlPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const modules = {
    "Management": {
      "Dashboard": ["view"],
      "Employee Management": ["view", "create", "edit", "delete"],
      "Projects": ["view", "create", "edit", "delete"],
      "Attendance": ["view", "create", "edit", "delete"],
      "Performance": ["view", "create", "edit", "delete"],
      "Skills": ["view", "create", "edit", "delete"],
      "Documents": ["view", "create", "edit", "delete"]
    },
    "Accounting": {
      "Transactions": ["view", "create", "edit", "delete"],
      "Budgeting": ["view", "create", "edit", "delete"],
      "Petty Cash": ["view", "create", "edit", "delete"],
      "Inventory": ["view", "create", "edit", "delete"],
      "Payroll": ["view", "create", "edit", "delete"],
      "Fund Transfer": ["view", "create", "edit", "delete"]
    },
    "Sales & Purchase": {
      "Invoice Management": ["view", "create", "edit", "delete"],
      "Purchase Orders": ["view", "create", "edit", "delete"],
      "Purchase Invoices": ["view", "create", "edit", "delete"]
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/User');
      const data = await response.json();
      const formattedUsers = data.map(user => ({
        id: user._id,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0],
        email: user.email,
        role: user.role
      }));
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    await fetchUserPermissions(user.id);
  };

  const fetchUserPermissions = async (userId) => {
    try {
      const response = await fetch(`/api/rbac?userId=${userId}`);
      const userPermissions = await response.json();
      
      if (Object.keys(userPermissions).length === 0) {
        // No permissions set, use role-based defaults
        const user = users.find(u => u.id === userId);
        const defaultPermissions = getDefaultPermissionsByRole(user.role);
        setPermissions(defaultPermissions);
      } else {
        setPermissions(userPermissions);
      }
    } catch (error) {
      console.error("Error fetching user permissions:", error);
    }
  };

  const getDefaultPermissionsByRole = (role) => {
    const rolePermissions = {};
    
    Object.keys(modules).forEach(module => {
      rolePermissions[module] = {};
      Object.keys(modules[module]).forEach(subModule => {
        rolePermissions[module][subModule] = {};
        modules[module][subModule].forEach(action => {
          // Set permissions based on role
          if (role === 'super-admin' || role === 'Super-admin' || role === 'developer') {
            rolePermissions[module][subModule][action] = true;
          } else if (role === 'admin') {
            rolePermissions[module][subModule][action] = action !== 'delete';
          } else if (role === 'Team-Lead' || role === 'Team-admin') {
            rolePermissions[module][subModule][action] = module === 'Management' && action !== 'delete';
          } else {
            // For Employee, Intern, and other roles - no default permissions
            rolePermissions[module][subModule][action] = false;
          }
        });
      });
    });
    
    return rolePermissions;
  };

  const handlePermissionChange = (module, subModule, action, checked) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [subModule]: {
          ...prev[module][subModule],
          [action]: checked
        }
      }
    }));
  };

  const savePermissions = async () => {
    try {
      const response = await fetch('/api/rbac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          permissions: permissions
        })
      });
      
      if (response.ok) {
        alert("Permissions saved successfully!");
      } else {
        throw new Error('Failed to save permissions');
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("Error saving permissions. Please try again.");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: "400px"}}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-4 py-3">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="mb-1">🔐 RBAC Control</h2>
            <p className="text-muted mb-0">Manage user permissions and access control</p>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Users</h5>
              </div>
              <div className="card-body p-3">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="fas fa-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-body p-0">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id}
                    className={`p-3 border-bottom cursor-pointer ${selectedUser?.id === user.id ? 'bg-light' : ''}`}
                    onClick={() => handleUserSelect(user)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                        <i className="fas fa-user text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-semibold">{user.name}</div>
                        <small className="text-muted">{user.email}</small>
                        <div>
                          <span className="badge bg-secondary">{user.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && searchTerm && (
                  <div className="p-4 text-center text-muted">
                    <i className="fas fa-search fa-2x mb-2"></i>
                    <div>No users found matching "{searchTerm}"</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-8">
            {selectedUser ? (
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Permissions for {selectedUser.name}</h5>
                    <small className="opacity-75">{selectedUser.email}</small>
                  </div>
                  <button className="btn btn-light btn-sm" onClick={savePermissions}>
                    <i className="fas fa-save me-1"></i> Save
                  </button>
                </div>
                <div className="card-body">
                  {/* Current Access Summary */}
                  <div className="mb-4">
                    <h6 className="text-success mb-3">
                      <i className="fas fa-check-circle me-2"></i>
                      Current Access Summary
                    </h6>
                    <div className="row">
                      {Object.keys(modules).map(module => {
                        const moduleAccess = Object.keys(modules[module]).filter(subModule => 
                          modules[module][subModule].some(action => 
                            permissions[module]?.[subModule]?.[action]
                          )
                        );
                        
                        if (moduleAccess.length === 0) return null;
                        
                        return (
                          <div key={module} className="col-md-4 mb-2">
                            <div className="bg-success bg-opacity-10 border border-success rounded p-2">
                              <small className="fw-semibold text-success">{module}</small>
                              <div className="mt-1">
                                {moduleAccess.map(subModule => {
                                  const actions = modules[module][subModule].filter(action => 
                                    permissions[module]?.[subModule]?.[action]
                                  );
                                  return (
                                    <div key={subModule} className="small text-muted">
                                      {subModule}: {actions.join(', ')}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <hr />

                  {/* Permission Management */}
                  <h6 className="text-primary mb-3">
                    <i className="fas fa-cog me-2"></i>
                    Modify Permissions
                  </h6>
                  
                  {Object.keys(modules).map(module => {
                    const hasAnyAccess = Object.keys(modules[module]).some(subModule => 
                      modules[module][subModule].some(action => 
                        permissions[module]?.[subModule]?.[action]
                      )
                    );
                    
                    return (
                      <div key={module} className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                          <h6 className={`mb-0 me-2 ${
                            hasAnyAccess ? 'text-success' : 'text-primary'
                          }`}>
                            <i className={`fas fa-folder me-2 ${
                              hasAnyAccess ? 'text-success' : 'text-primary'
                            }`}></i>
                            {module}
                          </h6>
                          {hasAnyAccess && (
                            <span className="badge bg-success">Active</span>
                          )}
                        </div>
                        <div className="row">
                          {Object.keys(modules[module]).map(subModule => {
                            const hasSubModuleAccess = modules[module][subModule].some(action => 
                              permissions[module]?.[subModule]?.[action]
                            );
                            
                            return (
                              <div key={subModule} className="col-lg-6 mb-3">
                                <div className={`border rounded p-3 ${
                                  hasSubModuleAccess ? 'border-success bg-success bg-opacity-5' : 'border-secondary'
                                }`}>
                                  <div className="d-flex align-items-center mb-2">
                                    <h6 className={`mb-0 me-2 ${
                                      hasSubModuleAccess ? 'text-success' : 'text-dark'
                                    }`}>{subModule}</h6>
                                    {hasSubModuleAccess && (
                                      <i className="fas fa-check-circle text-success"></i>
                                    )}
                                  </div>
                                  <div className="d-flex flex-wrap gap-2">
                                    {modules[module][subModule].map(action => (
                                      <div key={action} className="form-check">
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`${module}-${subModule}-${action}`}
                                          checked={permissions[module]?.[subModule]?.[action] || false}
                                          onChange={(e) => handlePermissionChange(module, subModule, action, e.target.checked)}
                                        />
                                        <label className="form-check-label text-capitalize" htmlFor={`${module}-${subModule}-${action}`}>
                                          {action}
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <i className="fas fa-users fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Select a user to manage permissions</h5>
                  <p className="text-muted">Choose a user from the list to configure their access rights</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}