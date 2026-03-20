import React, { useState, useEffect } from "react";
import api from "./api";

const StatusToggle = ({ isActive, onClick }) => {
  const color = isActive ? "#10b981" : "#94a3b8";
  const cx = isActive ? 23 : 9;
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: color,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <svg width="32" height="18" viewBox="0 0 32 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.2s' }}>
        <rect x="0.75" y="0.75" width="30.5" height="16.5" rx="8.25" stroke={color} strokeWidth="1.5"/>
        <circle cx={cx} cy="9" r="4.25" stroke={color} strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
        <circle cx={cx} cy="9" r="1.5" fill={color} style={{ transition: 'all 0.2s' }} />
      </svg>
      {isActive ? 'Active' : 'Inactive'}
    </div>
  );
};

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

function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // New project form state
  const [isAdding, setIsAdding] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', code: '', client: '', is_active: true });

  // Edit project state
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({ name: '', code: '', client: '', is_active: true });

  // Notifications
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get("projects/");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      const res = await api.post("projects/", newProject);
      setProjects([...projects, res.data]);
      setIsAdding(false);
      setNewProject({ name: '', code: '', client: '', is_active: true });
      showToast("Project added successfully");
    } catch (err) {
      console.error("Failed to add project", err);
      showToast("Failed to add project. Please try again.", "error");
    }
  };

  const handleDeleteProject = async (id) => {
    if(!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`projects/${id}/`);
      setProjects(projects.filter(p => p.id !== id));
      showToast("Project deleted successfully");
    } catch (err) {
      console.error("Failed to delete project", err);
      showToast("Failed to delete project.", "error");
    }
  };

  const handleEditProject = async () => {
    if (!editProjectData.name.trim()) return;
    try {
      const res = await api.put(`projects/${editProjectId}/`, editProjectData);
      setProjects(projects.map(p => p.id === editProjectId ? { ...res.data, is_active: editProjectData.is_active } : p));
      setEditProjectId(null);
      showToast("Project updated successfully");
    } catch (err) {
      console.error("Failed to update project", err);
      showToast("Failed to update project. Please try again.", "error");
    }
  };

  const handleToggleStatus = async (proj) => {
    const updatedStatus = proj.is_active === false ? true : false;
    // Optimistically update UI
    setProjects(projects.map(p => p.id === proj.id ? { ...p, is_active: updatedStatus } : p));
    try {
      await api.patch(`projects/${proj.id}/`, { is_active: updatedStatus });
      showToast(`Project marked as ${updatedStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error("Failed to toggle project status", err);
      // Revert on failure
      setProjects(projects.map(p => p.id === proj.id ? { ...p, is_active: !updatedStatus } : p));
      showToast("Failed to update status. Please try again.", "error");
    }
  };

  const startEditing = (proj) => {
    setEditProjectId(proj.id);
    setEditProjectData({ name: proj.name, code: proj.code || '', client: proj.client || '', is_active: proj.is_active !== false });
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
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>Projects</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{projects.length} total • {projects.filter(p => p.is_active !== false).length} active</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <span style={{ fontSize: '18px', fontWeight: '300', lineHeight: '1' }}>+</span> Add Project
        </button>
      </div>

      <div className="admin-table-container" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-clean-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Code</th>
              <th>Client</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            
            {isAdding && (
              <tr style={{ background: '#f8fafc' }}>
                <td>
                  <input 
                    type="text" 
                    placeholder="Project Name" 
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    autoFocus
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    placeholder="Project Code" 
                    value={newProject.code}
                    onChange={(e) => setNewProject({...newProject, code: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    placeholder="Client Name" 
                    value={newProject.client}
                    onChange={(e) => setNewProject({...newProject, client: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                  />
                </td>
                <td>
                    <StatusToggle isActive={newProject.is_active} onClick={() => setNewProject({ ...newProject, is_active: !newProject.is_active })} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleAddProject} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button onClick={() => setIsAdding(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {projects.map(proj => (
              editProjectId === proj.id ? (
                <tr key={proj.id} style={{ background: '#f8fafc' }}>
                  <td>
                    <input 
                      type="text" 
                      value={editProjectData.name}
                      onChange={(e) => setEditProjectData({...editProjectData, name: e.target.value})}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                      autoFocus
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={editProjectData.code}
                      onChange={(e) => setEditProjectData({...editProjectData, code: e.target.value})}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={editProjectData.client}
                      onChange={(e) => setEditProjectData({...editProjectData, client: e.target.value})}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    />
                  </td>
                  <td>
                      <StatusToggle isActive={editProjectData.is_active} onClick={() => setEditProjectData({ ...editProjectData, is_active: !editProjectData.is_active })} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleEditProject} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button onClick={() => setEditProjectId(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={proj.id}>
                  <td style={{ color: '#334155', fontWeight: '600', fontSize: '14px' }}>{proj.name}</td>
                  <td style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>{proj.code || 'N/A'}</td>
                  <td style={{ color: '#64748b', fontSize: '14px' }}>{proj.client || 'N/A'}</td>
                  <td>
                    <StatusToggle isActive={proj.is_active !== false} onClick={() => handleToggleStatus(proj)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => startEditing(proj)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <EditIcon />
                        </button>
                        <button onClick={() => handleDeleteProject(proj.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <TrashIcon />
                        </button>
                    </div>
                  </td>
                </tr>
              )
            ))}

            {!loading && projects.length === 0 && !isAdding && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No projects found.</td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminProjects;

