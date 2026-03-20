import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

function AdminOverview({ setActiveTab }) {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    activeClients: 0,
    totalHours: 0
  });

  useEffect(() => {
    // We will build a backend endpoint for this or just aggregate it here.
    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
           api.get("debug-users/"), // Temporary hack until we build a real users endpoint
           api.get("projects/"),
           api.get("clients/"),
           api.get("timecards/")
        ]);

        const usersRes = results[0].status === 'fulfilled' ? results[0].value : { data: { users: [], timecards: [] } };
        const projectsRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
        const clientsRes = results[2].status === 'fulfilled' ? results[2].value : { data: [] };
        const timecardsRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };

        let sumHours = 0;
        if(usersRes.data && usersRes.data.timecards) {
            usersRes.data.timecards.forEach(tc => {
                sumHours += parseFloat(tc.total_hours || 0);
            });
        }

        setStats({
          totalUsers: usersRes.data.users ? usersRes.data.users.length : 0,
          activeProjects: projectsRes.data.filter ? projectsRes.data.filter(p => p.isActive !== false && p.is_active !== false).length : 0,
          activeClients: clientsRes.data.filter ? clientsRes.data.filter(c => c.isActive !== false && c.is_active !== false).length : 0,
          totalHours: sumHours
        });
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="admin-overview" style={{ textAlign: 'center', padding: '100px 20px' }}>
         <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '40px', color: '#3b82f6', marginBottom: '20px' }}></i>
         <h3>Loading Admin Dashboard Data...</h3>
         <p style={{color: '#64748b'}}>Pulling fresh records securely...</p>
      </div>
    );
  }

  return (
    <div className="admin-overview">
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p>Manage your company's timesheet data</p>
      </div>

      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        
        <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Total Users</h4>
          <div style={{ color: '#3b82f6', fontSize: '32px', fontWeight: '700' }}>{stats.totalUsers}</div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Active Projects</h4>
          <div style={{ color: '#6366f1', fontSize: '32px', fontWeight: '700' }}>{stats.activeProjects}</div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Active Clients</h4>
          <div style={{ color: '#10b981', fontSize: '32px', fontWeight: '700' }}>{stats.activeClients}</div>
        </div>

        <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>Total Hours Logged</h4>
          <div style={{ color: '#334155', fontSize: '32px', fontWeight: '700' }}>{stats.totalHours}h</div>
        </div>

      </div>

      <div className="admin-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
        
        <div className="action-card" onClick={() => setActiveTab('projects')} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <i className="fa-regular fa-folder-open" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Manage Projects</h3>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Add, edit or deactivate projects used in timesheets</p>
        </div>

        <div className="action-card" onClick={() => setActiveTab('clients')} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <i className="fa-regular fa-building" style={{ color: '#6366f1', fontSize: '20px' }}></i>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Manage Clients</h3>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Control the client list available in entry dropdowns</p>
        </div>

        <div className="action-card" onClick={() => setActiveTab('users')} style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <i className="fa-solid fa-user-plus" style={{ color: '#10b981', fontSize: '20px' }}></i>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Manage Users</h3>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px', lineHeight: '1.5' }}>Add employees, managers, and admins to the system</p>
        </div>

      </div>

    </div>
  );
}

export default AdminOverview;
