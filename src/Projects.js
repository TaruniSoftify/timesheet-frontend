import React, { useEffect, useState } from "react";

function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
    fetch(`${apiUrl}projects/`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch projects");
        return res.json();
      })
      .then(data => setProjects(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Projects Dashboard</h2>
      <ul>
        {projects.map(p => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default Projects;
