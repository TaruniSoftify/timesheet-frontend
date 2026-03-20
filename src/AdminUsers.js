import React, { useState, useEffect } from "react";
import api from "./api";
import ConfirmModal from "./ConfirmModal";

const ActiveToggle = () => (
  <svg width="32" height="18" viewBox="0 0 32 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="0.75" width="30.5" height="16.5" rx="8.25" stroke="#10b981" strokeWidth="1.5"/>
    <circle cx="9" cy="9" r="4.25" stroke="#10b981" strokeWidth="1.5"/>
    <circle cx="9" cy="9" r="1.5" fill="#10b981"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New user form state
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'Employee', department: '', manager: '' });

  // Edit user state
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ username: '', email: '', role: 'Employee', department: '', manager: '' });

  // Notifications
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: "" });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("users/");
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim()) {
      showToast("Username and Email are required", "error");
      return;
    }

    // Client-side validation for duplicates (handling missing emails/usernames safely)
    const usernameExists = users.some(u => 
      u.username && newUser.username && u.username.toLowerCase() === newUser.username.toLowerCase()
    );
    const emailExists = users.some(u => 
      u.email && newUser.email && u.email.toLowerCase() === newUser.email.toLowerCase()
    );

    if (usernameExists) {
      showToast("A user with this username already exists", "error");
      return;
    }
    if (emailExists) {
      showToast("A user with this email already exists", "error");
      return;
    }

    try {
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        profile: {
          role: newUser.role,
          department: newUser.department,
          manager_name: newUser.manager || null
        }
      };

      // Optimistic UI Update (Immediate response)
      const tempId = Date.now();
      const optimisticUser = {
        id: tempId,
        username: newUser.username,
        email: newUser.email,
        profile: {
          role: newUser.role,
          department: newUser.department,
          manager_name: newUser.manager || null
        }
      };
      
      setUsers(prev => [optimisticUser, ...prev]);
      setIsAdding(false);
      setNewUser({ username: '', email: '', password: '', role: 'Employee', department: '', manager: '' });
      showToast("User added successfully");

      // Background Network Request
      await api.post("users/", payload);
      fetchUsers(); // Refresh to get true DB id
    } catch (err) {
      console.error("Failed to add user", err);
      // Revert Optimistic Update
      fetchUsers(); 
      if (err.response?.data) {
        const msg = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
         showToast(`Failed to add user: ${msg}`, "error");
      } else {
         showToast("Failed to add user. Please try again.", "error");
      }
    }
  };

  const handleDeleteUser = async (id, username) => {
    setConfirmDelete({ isOpen: true, id, name: username });
  };

  const confirmDeletion = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ isOpen: false, id: null, name: "" });
    try {
        await api.delete(`users/${id}/`);
        setUsers(users.filter(u => u.id !== id));
        showToast("User deleted successfully");
    } catch (err) {
        console.error("Failed to delete user", err);
        showToast("Failed to delete user. Please try again.", "error");
    }
  };

  const handleEditUser = async () => {
      if (!editUserData.username.trim()) return;

      // Duplicate validation
      const usernameExists = users.some(u => 
        u.id !== editUserId && u.username && editUserData.username && 
        u.username.toLowerCase() === editUserData.username.toLowerCase()
      );
      const emailExists = users.some(u => 
        u.id !== editUserId && u.email && editUserData.email && 
        u.email.toLowerCase() === editUserData.email.toLowerCase()
      );

      if (usernameExists) {
        showToast("Username already taken by another user", "error");
        return;
      }
      if (emailExists) {
        showToast("Email already taken by another user", "error");
        return;
      }

      try {
        const payload = {
          username: editUserData.username,
          email: editUserData.email,
          ...(editUserData.password ? { password: editUserData.password } : {}),
          profile: {
            role: editUserData.role,
            department: editUserData.department,
            manager_name: editUserData.manager || null
          }
        };

        // Optimistic UI Update
        const optimisticUpdatedUser = {
           id: editUserId,
           username: editUserData.username,
           email: editUserData.email,
           profile: {
             role: editUserData.role,
             department: editUserData.department,
             manager_name: editUserData.manager || null
           }
        };
        setUsers(prev => prev.map(u => u.id === editUserId ? optimisticUpdatedUser : u));
        setEditUserId(null);
        showToast("User updated successfully");

        // Background Sync
        await api.put(`users/${editUserId}/`, payload);
      } catch (err) {
        console.error("Failed to update user", err);
        fetchUsers(); // Revert
        showToast("Failed to update user. Please try again.", "error");
      }
  };

  const startEditing = (user) => {
      setEditUserId(user.id);
      setEditUserData({
          username: user.username,
          email: user.email,
          password: '',
          role: user.profile?.role || 'Employee',
          department: user.profile?.department || '',
          manager: user.profile?.manager_name || ''
      });
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "U";

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin': return { background: '#f1f5f9', color: '#475569' };
      case 'Manager': return { background: '#e0e7ff', color: '#4f46e5' };
      default: return { background: '#dbeafe', color: '#2563eb' };
    }
  };

  const getManagers = () => {
    // Only return users who have the role of Manager or Admin to populate the Manager dropdowns
    return users.filter(u => u.profile?.role === 'Manager' || u.profile?.role === 'Admin');
  };

  return (
    <div className="admin-subpage">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: toast.type === 'error' ? '#ef4444' : '#16a34a',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '500',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
          {toast.message}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>Users</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{users.length} total • {users.length} active</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <span style={{ fontSize: '18px', fontWeight: '300', lineHeight: '1' }}>+</span> Add User
        </button>
      </div>

      <div className="admin-table-container" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-clean-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Manager</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            
            {isAdding && (
              <tr style={{ background: '#f8fafc', verticalAlign: 'top' }}>
                <td>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    autoFocus
                  />
                </td>
                <td>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155', marginBottom: '8px' }}
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    placeholder="Department" 
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                    style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                  />
                </td>
                <td>
                  <div style={{ position: 'relative', width: '100%', minWidth: '140px' }}>
                    <select 
                      value={newUser.manager} 
                      onChange={(e) => setNewUser({...newUser, manager: e.target.value})}
                      style={{ 
                        boxSizing: 'border-box',
                        width: '100%', 
                        padding: '0 32px 0 12px', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        height: '42px',
                        outline: 'none', 
                        background: 'white', 
                        color: newUser.manager ? '#334155' : '#94a3b8',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select Manager</option>
                      {getManagers().map(m => (
                        <option key={m.id || m.username} value={m.username}>{m.username}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '12px' }}></i>
                  </div>
                </td>
                <td>
                  <div style={{ position: 'relative', width: '100%', minWidth: '120px' }}>
                    <select 
                      value={newUser.role} 
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      style={{ 
                        boxSizing: 'border-box',
                        width: '100%', 
                        padding: '0 32px 0 12px', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px', 
                        fontSize: '14px', 
                        height: '42px',
                        lineHeight: '40px',
                        outline: 'none', 
                        background: 'white', 
                        color: '#334155',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '12px' }}></i>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <button onClick={handleAddUser} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button onClick={() => setIsAdding(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {users.map((user, idx) => (
              editUserId === user.id ? (
                <tr key={user.id || idx} style={{ background: '#f8fafc', verticalAlign: 'top' }}>
                  <td style={{ verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                        {getInitials(user.username)}
                      </div>
                      <input 
                        type="text" 
                        value={editUserData.username}
                        onChange={(e) => setEditUserData({...editUserData, username: e.target.value})}
                        style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                        autoFocus
                      />
                    </div>
                  </td>
                  <td>
                    <input 
                      type="email" 
                      value={editUserData.email}
                      onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                      style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155', marginBottom: '8px' }}
                    />
                    <input 
                      type="password" 
                      placeholder="New Password (optional)" 
                      value={editUserData.password || ""}
                      onChange={(e) => setEditUserData({...editUserData, password: e.target.value})}
                      style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                      title="Leave blank to keep existing password"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={editUserData.department}
                      onChange={(e) => setEditUserData({...editUserData, department: e.target.value})}
                      style={{ boxSizing: 'border-box', width: '100%', minWidth: '120px', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    />
                  </td>
                  <td>
                    <div style={{ position: 'relative', width: '100%', minWidth: '140px' }}>
                      <select 
                        value={editUserData.manager} 
                        onChange={(e) => setEditUserData({...editUserData, manager: e.target.value})}
                        style={{ 
                          boxSizing: 'border-box',
                          width: '100%', 
                          padding: '0 32px 0 12px', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          height: '42px',
                          outline: 'none', 
                          background: 'white', 
                          color: editUserData.manager ? '#334155' : '#94a3b8',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select Manager</option>
                        {getManagers().map(m => (
                          <option key={m.id || m.username} value={m.username}>{m.username}</option>
                        ))}
                      </select>
                      <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '12px' }}></i>
                    </div>
                  </td>
                  <td>
                    <div style={{ position: 'relative', width: '100%', minWidth: '120px' }}>
                      <select 
                        value={editUserData.role} 
                        onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}
                        style={{ 
                          boxSizing: 'border-box',
                          width: '100%', 
                          padding: '0 32px 0 12px', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          fontSize: '14px', 
                          height: '42px',
                          outline: 'none', 
                          background: 'white', 
                          color: '#334155',
                          appearance: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <i className="fa-solid fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: '12px' }}></i>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                      <button onClick={handleEditUser} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button onClick={() => setEditUserId(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={user.id || idx}>
                  <td style={{ color: '#334155', fontWeight: '500', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                        {getInitials(user.username)}
                      </div>
                      {user.username}
                    </div>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '14px' }}>{user.email || `${user.username.toLowerCase()}@softify.com`}</td>
                  <td style={{ color: '#94a3b8', fontSize: '14px' }}>{user.profile?.department || 'N/A'}</td>
                  <td style={{ color: '#94a3b8', fontSize: '14px' }}>{user.profile?.manager_name || 'N/A'}</td>
                  <td>
                    <span style={{ 
                      ...getRoleBadgeStyle(user.profile?.role || 'Employee'), 
                      padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' 
                    }}>
                      {user.profile?.role || 'Employee'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button onClick={() => startEditing(user)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDeleteUser(user.id, user.username)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            ))}

            {!loading && users.length === 0 && !isAdding && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No users found.</td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Confirm Deactivation"
        message={`Are you sure you want to completely deactivate ${confirmDelete.name}? This action cannot be undone.`}
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: "" })}
      />
    </div>
  );
}

export default AdminUsers;
