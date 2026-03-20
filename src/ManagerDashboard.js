import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import api from "./api";
import "./ManagerDashboard.css";

function ManagerDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamTimecards = async () => {
      try {
        const res = await api.get("team-timecards/");
        setTimesheets(res.data);
      } catch (err) {
        console.error("Error fetching timesheets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamTimecards();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calculate metrics
  // Assuming 1 timecard = 1 submitter for this reporting period
  const uniqueMembers = new Set(timesheets.map(t => t.employee_username)).size;
  const pendingCount = timesheets.filter(t => t.status === "Submitted").length;
  const approvedCount = timesheets.filter(t => t.status === "Approved").length;
  const rejectedCount = timesheets.filter(t => t.status === "Rejected").length;
  const pendingDocs = timesheets.filter(t => t.status === "Submitted");

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "E";

  return (
    <div className="manager-layout">
      
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="manager-main">
        <Topbar toggleSidebar={toggleSidebar} title="Dashboard" />
        
        <div className="manager-content">
          <div className="page-header">
            <h1>Manager Dashboard</h1>
            <p>Review and approve your team's timesheets</p>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="card-icon blue"><i className="fa-solid fa-user-group"></i></div>
              <div className="card-info">
                <h3>{loading ? "-" : uniqueMembers}</h3>
                <p>Team Members Active</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon yellow"><i className="fa-regular fa-clock"></i></div>
              <div className="card-info">
                <h3>{loading ? "-" : pendingCount}</h3>
                <p>Pending Review</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon green"><i className="fa-regular fa-circle-check"></i></div>
              <div className="card-info">
                <h3>{loading ? "-" : approvedCount}</h3>
                <p>Approved</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="card-icon red"><i className="fa-regular fa-circle-xmark"></i></div>
              <div className="card-info">
                <h3>{loading ? "-" : rejectedCount}</h3>
                <p>Rejected</p>
              </div>
            </div>
          </div>

          <div className="pending-block">
            <div className="pending-header">
              <h3>Pending Approval</h3>
              <div className="badge-count">{pendingCount}</div>
            </div>
            
            <div className="pending-list">
              {loading ? (
                <p style={{ color: '#a0aec0', padding: '10px 0' }}>Loading timesheets...</p>
              ) : pendingDocs.length > 0 ? (
                pendingDocs.map(doc => (
                  <div className="pending-item" key={doc.id}>
                    <div className="item-left">
                      <div className="avatar">{getInitials(doc.employee_name)}</div>
                      <div className="item-details">
                        <h4>{doc.employee_name}</h4>
                        <p>{doc.department} • {doc.period_start} to {doc.period_end} • {doc.total_hours}h</p>
                      </div>
                    </div>
                    <button className="btn-review" onClick={() => navigate('/team-timesheets')}>Review</button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#a0aec0', padding: '10px 0' }}>No pending timesheets.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
