import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css"; // ✅ use App.css
import api from "./api"; // ✅ Use our resilient auto-retry API instead of fragile fetch

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message, type = 'success') => {
      setModalMessage(message);
      setToastType(type);
      setTimeout(() => setModalMessage(""), 4000);
  };

  const hasWokenUp = useRef(false);

  useEffect(() => {
    if (location.state && location.state.logoutMessage) {
       showToast(location.state.logoutMessage, 'success');
       window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Tell Render to start booting up the very millisecond the user clicks the Username box!
  const wakeUpServer = () => {
      if (!hasWokenUp.current) {
          hasWokenUp.current = true;
          // Immediately fire a blind opaque request that entirely skips preflight OPTIONS requests
          // This prevents the browser from locking the connection queue for 2 minutes and blocking the actual Login!
          fetch(process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/", { mode: 'no-cors' })
            .catch(() => {}); 
      }
  };

  const handleLogin = () => {
    setIsLoading(true);
    
    // Instead of raw fetch, we boldly use our new 60-second Retry API so it perfectly survives a Sleep Boot cycle without crashing!
    api.post("token/", { username, password })
      .then(res => {
        const data = res.data;
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", username);

        // Fetch User Profile to get Role constraint
        return api.get("current_user/", {
            headers: { "Authorization": `Bearer ${data.access}` }
        });
      })
      .then(res => {
          const userData = res.data;
          // Parse the Role and Department
          const role = userData.profile ? userData.profile.role : "Employee";
          const dept = userData.profile ? userData.profile.department : "";
          const email = userData.email || `${username}@softify.com`;
          
          localStorage.setItem("role", role);
          localStorage.setItem("department", dept);
          localStorage.setItem("email", email);

          showToast("Logged in successfully!", "success");
          
          setTimeout(() => {
              // Role-Based Redirect
              if (role === "Manager") {
                  navigate("/manager-dashboard");
              } else if (role === "Admin") {
                  navigate("/admin-dashboard");
              } else {
                  navigate("/timecards"); // Default Employee
              }
          }, 1000);
      })
      .catch(err => {
          setIsLoading(false);
          showToast("Error: " + err.message, "error");
      });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/SoftifyLogo.png" alt="Softify Logo" className="login-logo" />
        </div>
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please enter your details to sign in.</p>
        </div>
        <form className="login-form-group" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="input-wrapper">
            <i className="fa-regular fa-user input-icon"></i>
            <input
              type="text"
              className="login-input"
              placeholder="Username"
              value={username}
              onFocus={wakeUpServer}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <i className="fa-solid fa-lock input-icon"></i>
            <input
              type="password"
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {modalMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toastType === 'error' ? '#fee2e2' : '#dcfce7',
          color: toastType === 'error' ? '#ef4444' : '#16a34a',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '500',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <i className={`fa-solid ${toastType === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
          {modalMessage}
        </div>
      )}
    </div>
  );
}

export default Login;
