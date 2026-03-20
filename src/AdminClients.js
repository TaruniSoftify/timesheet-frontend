import React, { useState, useEffect } from "react";
import api from "./api";
import ConfirmModal from "./ConfirmModal";

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

function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // New client form state
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', industry: '', is_active: true });

  // Edit client state
  const [editClientId, setEditClientId] = useState(null);
  const [editClientData, setEditClientData] = useState({ name: '', industry: '', is_active: true });

  // Notifications
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: "" });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("clients/");
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return;
    try {
      const res = await api.post("clients/", newClient);
      setClients([...clients, res.data]);
      setIsAdding(false);
      setNewClient({ name: '', industry: '', is_active: true });
      showToast("Client added successfully");
    } catch (err) {
      console.error("Failed to add client", err);
      showToast("Failed to add client. Please try again.", "error");
    }
  };

  const handleDeleteClient = async (id) => {
    setConfirmDelete({ isOpen: true, id, name: "this client" });
  };

  const confirmDeletion = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ isOpen: false, id: null, name: "" });
    try {
      await api.delete(`clients/${id}/`);
      setClients(clients.filter(c => c.id !== id));
      showToast("Client deleted successfully");
    } catch (err) {
      console.error("Failed to delete client", err);
      showToast("Failed to delete client.", "error");
    }
  };

  const handleEditClient = async () => {
    if (!editClientData.name.trim()) return;
    try {
      const res = await api.put(`clients/${editClientId}/`, editClientData);
      setClients(clients.map(p => p.id === editClientId ? { ...res.data, is_active: editClientData.is_active } : p));
      setEditClientId(null);
      showToast("Client updated successfully");
    } catch (err) {
      console.error("Failed to update client", err);
      showToast("Failed to update client. Please try again.", "error");
    }
  };

  const handleToggleStatus = async (client) => {
    const updatedStatus = client.is_active === false ? true : false;
    // Optimistically update UI
    setClients(clients.map(c => c.id === client.id ? { ...c, is_active: updatedStatus } : c));
    try {
      await api.patch(`clients/${client.id}/`, { is_active: updatedStatus });
      showToast(`Client marked as ${updatedStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error("Failed to toggle client status", err);
      // Revert on failure
      setClients(clients.map(c => c.id === client.id ? { ...c, is_active: !updatedStatus } : c));
      showToast("Failed to update status. Please try again.", "error");
    }
  };

  const startEditing = (client) => {
    setEditClientId(client.id);
    setEditClientData({ name: client.name, industry: client.industry, is_active: client.is_active !== false });
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
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '700' }}>Clients</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>{clients.length} total • {clients.filter(c => c.is_active !== false).length} active</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <span style={{ fontSize: '18px', fontWeight: '300', lineHeight: '1' }}>+</span> Add Client
        </button>
      </div>

      <div className="admin-table-container" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="admin-clean-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Industry</th>
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
                    placeholder="Client Name" 
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    autoFocus
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    placeholder="Industry" 
                    value={newClient.industry}
                    onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                  />
                </td>
                <td>
                    <StatusToggle isActive={newClient.is_active} onClick={() => setNewClient({ ...newClient, is_active: !newClient.is_active })} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleAddClient} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-check"></i>
                    </button>
                    <button onClick={() => setIsAdding(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {clients.map(client => (
              editClientId === client.id ? (
                <tr key={client.id} style={{ background: '#f8fafc' }}>
                  <td>
                    <input 
                      type="text" 
                      value={editClientData.name}
                      onChange={(e) => setEditClientData({...editClientData, name: e.target.value})}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                      autoFocus
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={editClientData.industry}
                      onChange={(e) => setEditClientData({...editClientData, industry: e.target.value})}
                      style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', color: '#334155' }}
                    />
                  </td>
                  <td>
                      <StatusToggle isActive={editClientData.is_active} onClick={() => setEditClientData({ ...editClientData, is_active: !editClientData.is_active })} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleEditClient} style={{ background: '#dcfce7', color: '#16a34a', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-check"></i>
                      </button>
                      <button onClick={() => setEditClientId(null)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={client.id}>
                  <td style={{ color: '#334155', fontWeight: '500', fontSize: '14px' }}>{client.name}</td>
                  <td style={{ color: '#94a3b8', fontSize: '14px' }}>{client.industry || 'Technology'}</td>
                  <td>
                    <StatusToggle isActive={client.is_active !== false} onClick={() => handleToggleStatus(client)} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={() => startEditing(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <EditIcon />
                        </button>
                        <button onClick={() => handleDeleteClient(client.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <TrashIcon />
                        </button>
                    </div>
                  </td>
                </tr>
              )
            ))}

            {!loading && clients.length === 0 && !isAdding && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No clients found.</td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to completely delete ${confirmDelete.name}? This action cannot be undone.`}
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: "" })}
      />
    </div>
  );
}

export default AdminClients;
