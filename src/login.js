import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css"; // ✅ use App.css
import Modal from "./Modal";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
    fetch(`${apiUrl}token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then(res => {
        if (!res.ok) throw new Error("Login failed");
        return res.json();
      })
      .then(data => {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", username);

        // Fetch User Profile to get Role constraint
        const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
        return fetch(`${apiUrl}current_user/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${data.access}`,
                "Content-Type": "application/json"
            }
        });
      })
      .then(res => {
          if (!res.ok) throw new Error("Failed to fetch user profile");
          return res.json();
      })
      .then(userData => {
          // Parse the Role and Department
          const role = userData.profile ? userData.profile.role : "Employee";
          const dept = userData.profile ? userData.profile.department : "";
          
          localStorage.setItem("role", role);
          localStorage.setItem("department", dept);

          // Role-Based Redirect
          if (role === "Manager") {
              navigate("/manager-dashboard");
          } else if (role === "Admin") {
              navigate("/admin-dashboard");
          } else {
              navigate("/timecards"); // Default Employee
          }
      })
      .catch(err => setModalMessage("Error: " + err.message));
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/softifylogo.png" alt="Softify Logo" className="login-logo" />
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
          <button type="submit" className="login-submit-btn">Sign In</button>
        </form>
      </div>
      <Modal message={modalMessage} onClose={() => setModalMessage("")} />
    </div>
  );
}

export default Login;
