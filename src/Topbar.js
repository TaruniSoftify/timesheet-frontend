import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./ManagerDashboard.css";

const Topbar = ({ toggleSidebar, title }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Manager";
  const department = localStorage.getItem("department") || "Engineering";

  // Notifications State
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

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "M";
  };

  return (
    <div className="manager-topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <h2 className="topbar-title">{title}</h2>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
          
        {/* Notifications Icon */}
        <div className="notification-wrapper" style={{ position: 'relative', marginRight: '20px' }}>
            <div 
                className="notification-icon" 
                style={{ fontSize: '20px', color: '#555', cursor: 'pointer', position: 'relative' }}
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

        {/* Profile Dropdown Component */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
        <div 
          className="topbar-profile" 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="profile-avatar-small">{getInitials(username)}</div>
          <span className="profile-name">{username}</span>
          <i className="fa-solid fa-chevron-down"></i>
        </div>

        {dropdownOpen && (
          <div className="profile-dropdown">
            <div className="dropdown-user-info">
              <h4>{username}</h4>
              <p>{department}</p>
            </div>
            <button className="dropdown-signout" onClick={() => {
              localStorage.clear();
              navigate("/", { state: { logoutMessage: "Logged out successfully!" } });
            }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
          </div>
        )}
      </div>
     </div>
    </div>
  );
};

export default Topbar;
