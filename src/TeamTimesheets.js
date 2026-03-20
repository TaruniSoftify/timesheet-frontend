import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import api from "./api";
import "./ManagerDashboard.css";
import "./TeamTimesheets.css";
import Modal from "./Modal";

function TeamTimesheets() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedRow, setExpandedRow] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [modalMessage, setModalMessage] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const tabs = ["All", "Submitted", "Approved", "Rejected", "Draft"];

  useEffect(() => {
    fetchTeamTimecards();
  }, []);

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

  const handleAction = async (id, newStatus) => {
    const comment = comments[id] || "";
    if (newStatus === "Rejected" && !comment.trim()) {
      setModalMessage("A comment is required when rejecting a timesheet.");
      return;
    }

    try {
      await api.patch(`team-timecards/${id}/`, { status: newStatus });
      
      // Update local state instead of doing a full refetch for smoother UI
      const updatedCard = timesheets.find(t => t.id === id);
      setTimesheets(timesheets.map(t => t.id === id ? { ...t, status: newStatus } : t));
      setExpandedRow(null); // Collapse the row after action
      
      // Attempt to send a notification to the employee using their username or ID
      if (updatedCard) {
         try {
             // In Django REST, 'user' requires the primary key ID. Since we didn't add it to the serializer, 
             // we fetch the user ID from the debug-users or current_user table. 
             // But wait, the Employee list isn't natively exposed. 
             // We can use a simpler approach: POST to our own endpoint that takes the username if needed.
             // Actually, the new Notification backend requires the User ID. Since we don't have it, 
             // we'll update the backend serializers.py to include 'employee_id' shortly or use standard fetch.
             const notifyPayload = {
                 user: updatedCard.employee_id || updatedCard.employee, 
                 message: `Your timesheet for ${updatedCard.period_start} to ${updatedCard.period_end} was ${newStatus}.${comment ? ` Note: ${comment}` : ''}`
             };
             await api.post('notifications/', notifyPayload);
             console.log("Successfully sent notification", notifyPayload);
         } catch (notifyErr) {
             console.error("Notification dispatch failed:", notifyErr);
             const errorData = notifyErr.response?.data ? JSON.stringify(notifyErr.response.data) : notifyErr.message;
             setModalMessage("Error sending Notification exactly to the employee: " + errorData);
         }
      }

      setModalMessage(`Timesheet successfully ${newStatus.toLowerCase()}.`);
      
    } catch (err) {
        setModalMessage("Error updating timesheet: " + err.message);
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : "E";

  const filteredSheets = activeTab === "All" 
    ? timesheets 
    : timesheets.filter(t => t.status === activeTab);

  const toggleRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const getStatusClass = (status) => {
      if(!status) return "draft";
      return status.toLowerCase();
  };

  return (
    <div className="manager-layout">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="manager-main">
        <Topbar toggleSidebar={toggleSidebar} title="Team Timesheets" />
        
        <div className="manager-content">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1>Team Timesheets</h1>
              <p>View and action your team's submitted work</p>
            </div>
            
            <div className="filter-pills">
              {tabs.map(tab => (
                <button 
                  key={tab}
                  className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="team-list">
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>Loading team timesheets...</div>
            ) : filteredSheets.length === 0 ? (
                 <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>No timesheets found for this filter.</div>
            ) : (
                filteredSheets.map((sheet) => (
                  <React.Fragment key={sheet.id}>
                    {/* Accordion Header */}
                    <div className="team-row">
                      <div className="team-row-header" onClick={() => toggleRow(sheet.id)}>
                        <div className="item-left">
                          <div className="avatar">{getInitials(sheet.employee_name)}</div>
                          <div className="item-details">
                            <h4>{sheet.employee_name}</h4>
                            <p>{sheet.department} • {sheet.period_start} to {sheet.period_end} • {sheet.total_hours}h • {sheet.entries.length} entries</p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className={`status-badge ${getStatusClass(sheet.status)}`}>
                            {sheet.status || "Draft"}
                          </span>
                          {expandedRow === sheet.id && (
                             <i className="fa-solid fa-xmark" style={{ color: '#a0aec0' }}></i>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Expanded Details */}
                    {expandedRow === sheet.id && (
                      <div className="team-row-details">
                        <table className="details-table">
                          <thead>
                            <tr>
                              <th>DATE</th>
                              <th>PROJECT</th>
                              <th>CLIENT</th>
                              <th>TASK</th>
                              <th>HOURS</th>
                              <th>NOTE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Sort entries chronologically by date before rendering */}
                            {[...sheet.entries].sort((a, b) => new Date(a.date) - new Date(b.date)).map((entry) => {
                              // The user appended Country, Client, Independence prefix explicitly to the notes
                              // Let's strip that standard prefix if it exists to clean up the display
                              let cleanNote = entry.notes || "";
                              // Strip system-appended metadata (e.g. "Country: XXX, Client: YYY, Independence: ZZZ, ActualNote")
                              if (cleanNote.includes("Independence:")) {
                                  const indySplit = cleanNote.split(/Independence:\s*[^,]+,\s*/);
                                  cleanNote = indySplit.length > 1 ? indySplit[1].trim() : "";
                              }
                              
                              // If they typed literally nothing, display a dash instead of a blank space
                              if (!cleanNote || cleanNote.trim() === "") {
                                  cleanNote = "-";
                              }

                              return (
                                <tr key={entry.id}>
                                  <td style={{ whiteSpace: 'nowrap' }}>{entry.date}</td>
                                  <td style={{ whiteSpace: 'nowrap' }}>{entry.project || "N/A"}</td>
                                  <td>{entry.client || "N/A"}</td>
                                  <td>{entry.task}</td>
                                  <td className="hours-cell">{Number(entry.hours).toFixed(1)}h</td>
                                  <td className="note-cell">{cleanNote}</td>
                                </tr>
                              );
                            })}
                            {sheet.entries.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#a0aec0' }}>No detailed entries recorded.</td>
                                </tr>
                            )}
                          </tbody>
                        </table>

                        <div className="total-hours-row">
                          <span>Total hours</span>
                          <span>{Number(sheet.total_hours).toFixed(1)}h</span>
                        </div>

                        {sheet.status === "Submitted" && (
                          <div style={{ padding: '0 16px', marginBottom: '16px' }}>
                            <textarea 
                              className="comment-box" 
                              placeholder="Add a comment (required for rejection)..."
                              value={comments[sheet.id] || ""}
                              onChange={e => setComments({...comments, [sheet.id]: e.target.value})}
                            ></textarea>
                            
                            <div className="action-buttons">
                              <button className="btn-approve" onClick={() => handleAction(sheet.id, "Approved")}>
                                <i className="fa-regular fa-circle-check"></i> Approve
                              </button>
                              <button className="btn-reject" onClick={() => handleAction(sheet.id, "Rejected")}>
                                <i className="fa-regular fa-circle-xmark"></i> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))
            )}
          </div>

        </div>
      </div>
      <Modal message={modalMessage} onClose={() => setModalMessage("")} />
    </div>
  );
}

export default TeamTimesheets;
