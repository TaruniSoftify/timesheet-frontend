import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

function getInitials(name) {
  if (!name) return "👤";

  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}


function Navbar({ username }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { state: { logoutMessage: "Logged out successfully!" } });
  };

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications if logged in
    api.get("notifications/")
      .then(res => {
          if (Array.isArray(res.data)) {
              setNotifications(res.data.filter(n => !n.is_read));
          }
      })
      .catch(err => console.error("Error fetching notifications:", err));

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      // Also close notifications if clicked outside
      if (!event.target.closest('.notification-wrapper')) {
          setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
      try {
          await api.patch(`notifications/${id}/`, { is_read: true });
          setNotifications(notifications.filter(n => n.id !== id));
      } catch (err) {
          console.error("Failed to mark as read:", err);
      }
  };

  return (
    <div className="navbar">
      {/* <h3 className="navbar-title">Timesheet Portal</h3> */}
      <img
        src="/SoftifyLogo.png"
        alt="Softify Logo"
        className="navbar-logo"
        style={{ 
          height: '42px', 
          width: 'auto',
          objectFit: 'contain', 
          backgroundColor: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '0'
        }}
      />
      <div className="navbar-right">
        <div className="notification-wrapper" style={{ position: 'relative' }}>
            <div 
                className="notification-icon" 
                style={{ fontSize: '20px', color: 'white', cursor: 'pointer', marginRight: '20px', position: 'relative' }}
                onClick={() => navigate('/notifications')}
            >
                <i className="fa-regular fa-bell"></i>
                {notifications.length > 0 && (
                    <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#eab308', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', zIndex: 10, minWidth: '12px', textAlign: 'center' }}>
                        {notifications.length}
                    </span>
                )}
            </div>
        </div>

        <div className="topbar-right" ref={dropdownRef}>
          <div 
            className="topbar-profile" 
            style={{ color: 'white', cursor: 'pointer' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="profile-avatar-small" style={{ backgroundColor: 'white', color: '#007bff' }}>
              {getInitials(username)}
            </div>
            {/* <span className="profile-name" style={{ color: 'white' }}>{username}</span> */}
            {/* <i className="fa-solid fa-chevron-down" style={{ color: 'white' }}></i> */}
          </div>
          
          {dropdownOpen && (
            <div className="profile-dropdown employee-dropdown">
              <div className="dropdown-content" style={{ display: 'block', minWidth: '200px' }}>
                <div style={{ paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '14px', color: '#2d3748' }}>{username}</p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#a0aec0' }}>{localStorage.getItem("role") || "Employee"} • {localStorage.getItem("department") || "N/A"}</p>
                </div>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'white', backgroundColor: '#e53e3e', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '4px', width: '100%', fontWeight: '500' }}>
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
