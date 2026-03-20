import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./App.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "Employee";

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("notifications/");
      if (Array.isArray(res.data)) {
        setNotifications(res.data.filter(n => !n.is_read));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/`, { is_read: true });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const goBack = () => {
    if (role === "Manager") navigate("/team-timesheets"); // Or manager-dashboard
    else if (role === "Admin") navigate("/admin-dashboard");
    else navigate("/timecards");
  };

  return (
    <div style={{ backgroundColor: "#f4f7f6", minHeight: "100vh", padding: "40px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "20px" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", color: "#007bff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
             <i className="fa-solid fa-arrow-left"></i> Back
          </button>
          <h2 style={{ margin: 0, color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
             <i className="fa-regular fa-bell"></i> Notifications
          </h2>
          <div style={{ width: "60px" }}></div> {/* Placeholder for centering */}
        </div>

        {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px", color: "#888", backgroundColor: "#f9fbfd", borderRadius: "8px" }}>
                <i className="fa-regular fa-bell-slash" style={{ fontSize: "40px", marginBottom: "15px", color: "#ccc" }}></i>
                <h3>All Caught Up!</h3>
                <p>You have no new notifications.</p>
            </div>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {notifications.map(n => (
                    <div key={n.id} style={{ 
                        padding: "20px", 
                        borderLeft: "4px solid #007bff", 
                        backgroundColor: "#f9fbfd", 
                        borderRadius: "4px", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxWidth: "80%" }}>
                            {n.message.includes(". Note: ") ? (
                                <>
                                    <div style={{ fontSize: "16px", color: "#333", fontWeight: "500", lineHeight: "1.4" }}>
                                        {n.message.split(". Note: ")[0]}.
                                    </div>
                                    <div style={{ fontSize: "14px", color: "#555", fontStyle: "italic", background: "#f0f4f8", padding: "8px 12px", borderRadius: "4px", marginTop: "4px", borderLeft: "3px solid #0070c0" }}>
                                        <strong>Note:</strong> {n.message.split(". Note: ")[1]}
                                    </div>
                                </>
                            ) : (
                                <span style={{ fontSize: "16px", color: "#333", fontWeight: "500", lineHeight: "1.4" }}>{n.message}</span>
                            )}
                            <span style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={() => markAsRead(n.id)} 
                            style={{ 
                                background: "white", 
                                border: "1px solid #007bff", 
                                color: "#007bff", 
                                padding: "8px 16px", 
                                borderRadius: "4px", 
                                cursor: "pointer", 
                                fontWeight: "bold",
                                transition: "all 0.2s"
                            }}
                            onMouseOver={(e) => { e.target.style.background = "#007bff"; e.target.style.color = "white"; }}
                            onMouseOut={(e) => { e.target.style.background = "white"; e.target.style.color = "#007bff"; }}
                        >
                            <i className="fa-solid fa-check"></i> Mark Read
                        </button>
                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  );
}

export default Notifications;
