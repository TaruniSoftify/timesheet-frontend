import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AdminOverview from "./AdminOverview";
import AdminProjects from "./AdminProjects";
import AdminClients from "./AdminClients";
import AdminUsers from "./AdminUsers";
import "./ManagerDashboard.css"; // Reuse existing layout CSS

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "projects": return <AdminProjects />;
      case "clients": return <AdminClients />;
      case "users": return <AdminUsers />;
      case "overview":
      default: return <AdminOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="manager-layout" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <div className="manager-main">
        <Topbar toggleSidebar={toggleSidebar} title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        
        <div className="manager-content" style={{ padding: '32px' }}>
            {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
