import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ManagerDashboard.css";

const Sidebar = ({ isOpen, toggleSidebar, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "User";
  const email = localStorage.getItem("email") || "user@example.com";
  const role = localStorage.getItem("role") || "Manager"; // or Admin

  // Get initials for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className={`manager-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon"><i className="fa-regular fa-clock"></i></div>
          <div className="logo-text">
            <h4>Softify</h4>
            <span>Timesheet</span>
          </div>
        </div>
        <button className="close-btn" onClick={toggleSidebar}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">{getInitials(username)}</div>
        <div className="profile-info">
          <h4>{username}</h4>
          <p>{email}</p>
          <span className="role-badge">{role}</span>
        </div>
      </div>

      <div className="sidebar-nav">
        
        {role === "Admin" ? (
          <>
            <button 
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="fa-solid fa-border-all"></i> Overview
            </button>
            <button 
              className={`nav-item ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              <i className="fa-regular fa-folder-open"></i> Projects
            </button>
            <button 
              className={`nav-item ${activeTab === "clients" ? "active" : ""}`}
              onClick={() => setActiveTab("clients")}
            >
              <i className="fa-regular fa-building"></i> Clients
            </button>
            <button 
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <i className="fa-solid fa-user-group"></i> Users
            </button>
          </>
        ) : (
          <>
            <button 
              className={`nav-item ${location.pathname === "/manager-dashboard" ? "active" : ""}`}
              onClick={() => navigate("/manager-dashboard")}
            >
              <i className="fa-solid fa-border-all"></i> Dashboard
            </button>
            <button 
              className={`nav-item ${location.pathname === "/team-timesheets" ? "active" : ""}`}
              onClick={() => navigate("/team-timesheets")}
            >
              <i className="fa-solid fa-clipboard-list"></i> Team Timesheets
            </button>
          </>
        )}

      </div>

      <div className="sidebar-footer">
        <button className="signout-btn" onClick={() => {
            localStorage.clear();
            navigate("/");
        }}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
