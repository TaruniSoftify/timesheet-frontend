import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Projects from "./Projects";
import TimeCards from "./timecards";
import ReportTime from "./reporttime";
import ReviewTime from "./reviewtime";
import ManagerDashboard from "./ManagerDashboard";
import AdminDashboard from "./AdminDashboard";
import TeamTimesheets from "./TeamTimesheets";
import Notifications from "./Notifications";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/timecards" element={<TimeCards />} />
        <Route path="/report/:period" element={<ReportTime />} />
        <Route path="/reviewtime" element={<ReviewTime />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/team-timesheets" element={<TeamTimesheets />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  );
}

export default App;
