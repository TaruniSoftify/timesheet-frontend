import Navbar from "./navbar";
import { useParams } from "react-router-dom";
import "./App.css";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api"; // ✅ Imported Axios auto-refresher
import Modal from "./Modal"; // ✅ Imported custom modal


// ✅ Helper to generate week dates from the clicked period
function getWeekDates(period) {
  if (!period) return [];   // prevent crash if period is missing
  const [startStr] = period.split(" - "); // take first date from "start - end"
  const start = new Date(startStr);
  if (isNaN(start)) return []; // prevent crash if date is invalid

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short"}));
  }
  return dates;
}

function ReportTime() {
  const { period } = useParams(); // ✅ gets the clicked period from URL
  const weekDates = getWeekDates(period);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [countries, setCountries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);


useEffect(() => {
  // 👈 Token is handled automatically by api.js interceptor

  api.get("countries/")
    .then(res => setCountries(Array.isArray(res.data) ? res.data : []))
    .catch(() => setCountries([]));

  api.get("projects/")
    .then(res => setProjects(Array.isArray(res.data) ? res.data : []))
    .catch(() => setProjects([]));

  api.get("clients/")
    .then(res => setClients(Array.isArray(res.data) ? res.data : []))
    .catch(() => setClients([]));
}, []);



  const CACHE_KEY = `timecard_draft_${period}`;
  
  const [rows, setRows] = useState(() => {
    const saved = sessionStorage.getItem(CACHE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [{ id: 1, country: "", project: "", client: "", independence: "", task: "", note: "", hours: Array(7).fill("") }];
  });

  // Automatically save drafts instantly as the user types, so navigating Back and Next is 0-latency
  useEffect(() => {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  }, [rows, CACHE_KEY]);

  // Load existing TimeEntries from
  useEffect(() => {
    if (weekDates.length !== 7 || projects.length === 0) return;

    const token = localStorage.getItem("access_token");

    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api/";
    fetch(`${apiUrl}timeentries/`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;

        // Convert the 7 weekDates string array into comparable YYYY-MM-DD strings format
        const [startStr] = period.split(" - ");
        const start = new Date(startStr);
        const dateStrings = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            let m = '' + (d.getMonth() + 1); let day = '' + d.getDate();
            if (m.length < 2) m = '0' + m; if (day.length < 2) day = '0' + day;
            dateStrings.push([d.getFullYear(), m, day].join('-'));
        }

        // Filter the fetched backend data to only include entries that fall inside this specific week
        const thisWeekEntries = data.filter(entry => dateStrings.includes(entry.date));

        if (thisWeekEntries.length === 0) return; // leave the default blank row

        // Group the entries by project to recreate the rows
        const groupedRows = {};
        
        thisWeekEntries.forEach(entry => {
           const proj = projects.find(p => p.id === entry.project);
           const projName = proj ? proj.name : "";

           // Try to extract country/client from notes if you stored it there (basic parsing)
           let country = "", client = "", indep = "";
           if (entry.notes) {
              const parts = entry.notes.split(", ");
              parts.forEach(p => {
                 if (p.startsWith("Country: ")) country = p.replace("Country: ", "");
                 if (p.startsWith("Client: ")) client = p.replace("Client: ", "");
                 if (p.startsWith("Independence: ")) indep = p.replace("Independence: ", "");
              });
           }
           
           // We'll also store the real Task and Note values since we've now added them as formal fields
           const taskVal = entry.task || "";
           // Using the entry.notes directly, but stripping out our front-end hacky metadata tags to get the pure user note
           let userNote = entry.notes || "";
           userNote = userNote.replace(/Country: [^,]*,? ?/g, '')
                              .replace(/Client: [^,]*,? ?/g, '')
                              .replace(/Independence: [^,]*,? ?/g, '').trim();
           // Strip trailing comma if it got left behind
           if(userNote.endsWith(",")) userNote = userNote.slice(0, -1).trim();

           // Group by Project + Task + Note so identical tasks group together across days
           const rowKey = `${projName}-${taskVal}-${userNote}-${country}-${client}`;
           
           if (!groupedRows[rowKey]) {
               groupedRows[rowKey] = {
                   id: Object.keys(groupedRows).length + 1,
                   dbIds: [], // Track real Django database IDs for instant deletion
                   country: country,
                   project: projName,
                   client: client,
                   independence: indep,
                   task: taskVal,
                   note: userNote,
                   hours: Array(7).fill("")
               };
           }

           // Find which day of the week this entry belongs to (0 to 6)
           const dayIdx = dateStrings.indexOf(entry.date);
           if (dayIdx !== -1) {
               groupedRows[rowKey].hours[dayIdx] = entry.hours;
               // Store the specific database ID associated with this hour block
               groupedRows[rowKey].dbIds.push(entry.id);
           }
        });

        // Update the state with the loaded data!
        const restoredRows = Object.values(groupedRows);
        if (restoredRows.length > 0) {
            setRows(restoredRows);
        }

      })
      .catch(err => console.error("Error fetching existing time entries:", err));
  }, [period, projects]);

  // Update dropdowns
  const updateRow = (idx, field, value) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
  };

  // Update hours for each day

  const updateWeekHours = (rowIdx, dayIdx, value) => {
    const updated = [...rows];
    updated[rowIdx].hours[dayIdx] = value ? parseFloat(value).toFixed(2) : "";
    setRows(updated);
  };

  // Calculate daily totals across all rows
    const getDailyTotals = () => {
    return weekDates.map((_, dayIdx) => {
        let sum = 0;
        rows.forEach(row => {
        if (row.hours[dayIdx]) {
            sum += parseFloat(row.hours[dayIdx]) || 0;
        }
        });
        return sum.toFixed(2); // always show 2 decimals
    });
    };

  // Calculate the grand total of all hours for the week
  const getWeeklyTotal = () => {
      const dailyTotals = getDailyTotals();
      const sum = dailyTotals.reduce((acc, curr) => acc + parseFloat(curr), 0);
      return sum.toFixed(2);
  };


  const addRow = () => {
  const newRow = {
    id: rows.length + 1,
    country: "",
    project: "",
    client: "",
    independence: "",
    task: "",
    note: "",
    hours: Array(7).fill("")
  };
  setRows([...rows, newRow]);
};

  const deleteRow = (idxToRemove) => {
    const rowToDelete = rows[idxToRemove];
    const token = localStorage.getItem("access_token");

    // If it has real DB IDs, issue DELETE requests immediately to the backend
    if (rowToDelete.dbIds && rowToDelete.dbIds.length > 0) {
        rowToDelete.dbIds.forEach(id => {
            api.delete(`/${id}/`) // Assuming the base API for time entries is mapped correctly in our new api.js interceptor or we pass absolute
              .catch(err => console.error("Failed to delete entry", err));
        });
    }

    // Handle removing from UI safely
    if (rows.length === 1) {
       // Just blank out the only row
       const cleared = [...rows];
       cleared[0].hours = Array(7).fill("");
       cleared[0].dbIds = [];
       cleared[0].country = "";
       cleared[0].project = "";
       cleared[0].client = "";
       cleared[0].independence = "";
       cleared[0].task = "";
       cleared[0].note = "";
       setRows(cleared);
       return;
    }

    const updatedRows = rows.filter((_, idx) => idx !== idxToRemove);
    setRows(updatedRows);
  };


const saveTimeEntries = (closeAfterSave = false) => {
  const token = localStorage.getItem("access_token");

  // Calculate the starting date of the week from the period string
  const [startStr] = period.split(" - ");
  const start = new Date(startStr);

  const dateStrings = [];
  for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      let m = '' + (d.getMonth() + 1); let day = '' + d.getDate();
      if (m.length < 2) m = '0' + m; if (day.length < 2) day = '0' + day;
      dateStrings.push([d.getFullYear(), m, day].join('-'));
  }

  const newEntriesPayload = [];

  for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const projectObj = projects.find(p => p.name === row.project);
      let projectId = projectObj ? projectObj.id : null;

      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
          const hour = row.hours[dayIdx];
          if (hour && parseFloat(hour) > 0) {
              if (projectId === null) {
                 setModalMessage(`You entered hours on row ${idx + 1} but did not select a Project. Please select a project before saving.`);
                 setShowModal(true);
                 return; 
              }

              const noteParts = [
                  row.country ? `Country: ${row.country}` : null,
                  row.client ? `Client: ${row.client}` : null,
                  row.independence ? `Independence: ${row.independence}` : null,
                  row.note ? row.note : null
              ].filter(Boolean);

              newEntriesPayload.push({
                  project: projectId,
                  date: dateStrings[dayIdx],
                  hours: parseFloat(hour),
                  task: row.task || "General Task",
                  notes: noteParts.join(", ")
              });
          }
      }
  }

  if (newEntriesPayload.length === 0) {
      setModalMessage("No hours entered to save!");
      setShowModal(true);
      return;
  }

  // Use the blazingly fast pure bulk_save endpoint
  api.post("/timeentries/bulk_save/", {
      dates: dateStrings,
      entries: newEntriesPayload
  })
  .then(res => {
      // Find this specific timecard and patch the Grand Total
      return api.get("/timecards/");
  })
  .then(res => {
      const timecard = res.data.find(tc => tc.period_start === dateStrings[0]);
      if (timecard) {
          return api.patch(`/timecards/${timecard.id}/`, { 
              total_hours: getWeeklyTotal(),
              status: "Saved"
          });
      }
  })
  .then(() => {
      if (closeAfterSave) {
          window.location.href = "/timecards";
      } else {
          setModalMessage("Time entries saved successfully!");
          setShowModal(true);
      }
  })
  .catch(err => {
      console.error("Error saving entries:", err);
      setModalMessage("Error saving: " + err.message);
      setShowModal(true);
  });
};


const navigate = useNavigate();



  return (
    <div>
      <Navbar username={localStorage.getItem("username")} />

      {/* ✅ Top Action Bar */}
      <div className="reporttime-header">
        <h2 className="reporttime-title">Create Time Card: Report Time</h2>
        {/* <div className="reporttime-buttons">
          <button className="header-btn">Next</button>
          <button className="header-btn">Save</button>
          <button className="header-btn">Save and Close</button>
          <button className="header-btn cancel-btn">Cancel</button>
        </div> */}
        <div className="reporttime-buttons">
            <button className="header-btn" onClick={() => window.location.href="/timecards"}>Back</button>
            {/* <button className="header-btn" onClick={() => saveTimeEntries(false, true)}>Next</button> */}
            <button
            className="header-btn"
            onClick={() => navigate("/reviewtime", { state: { period, rows } })}
            >
            Next
            </button>

            <button className="header-btn" onClick={() => saveTimeEntries(false)}>Save</button>
            <button className="header-btn" onClick={() => saveTimeEntries(true)}>Save and Close</button>
            <button className="header-btn cancel-btn" onClick={() => window.location.href="/timecards"}>Cancel</button>
        </div>

      </div>

      <div className="report-time-container">
        <p>Period: {period}</p>

        {/* Compliance section */}
        <div className="compliance-box">
          <p>
            Please ensure compliance with Independence Policy Section 5 and 5.3-2.
            Non-compliance may result in disciplinary action.
          </p>
        </div>

        {/* ✅ Time Entry Section */}
        <h3 className="time-entry-heading">Time Entry
            {/* <button className="add-row-btn" onClick={addRow}>+</button> */}
            <button className="add-row-btn" onClick={addRow}> Add Row Below </button>
        </h3>
        <table className="time-entry-table">
          <thead>
            <tr>
              <th>S.no</th>
              <th>Country</th>
              <th>Project</th>
              <th>Client</th>
              <th>Independence Confirmed</th>
              <th>Task</th>
              <th>Note</th>
              {weekDates.map((d, idx) => (
                <th key={idx}>{d}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>

                {/* Country dropdown */}
                <td>
                    <select
                       value={row.country}
                       onChange={e => updateRow(idx, "country", e.target.value)}
                    >
                       <option value="">Select</option>
                       {Array.isArray(countries) && countries.map(c => (
                        // <option key={c.id} value={c.id}>{c.full_name}</option>
                        <option key={c.id} value={c.full_name}>{c.full_name}</option>
                        ))}
                    </select> 
                </td>

                {/* Project dropdown */}
                <td>
                  <select
                    value={row.project}
                    onChange={e => updateRow(idx, "project", e.target.value)}
                  >
                    <option value="">Select</option>
                    {Array.isArray(projects) && projects.filter(p => p.is_active !== false || p.name === row.project).map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>

                    ))}
                  </select>
                </td>

                {/* Client dropdown */}
                <td>
                  <select
                    value={row.client}
                    onChange={e => updateRow(idx, "client", e.target.value)}
                  >
                    <option value="">Select</option>
                    {Array.isArray(clients) && clients.filter(cl => cl.is_active !== false || cl.name === row.client).map(cl => (
                    <option key={cl.id} value={cl.name}>{cl.name}</option>

                    ))}
                  </select>
                </td>

                {/* Independence Confirmed */}
                <td>
                  <select
                    value={row.independence}
                    onChange={e => updateRow(idx, "independence", e.target.value)}
                  >
                    <option value="">Select</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </td>

                {/* Task Input */}
                <td>
                  <input 
                    type="text" 
                    value={row.task} 
                    onChange={e => updateRow(idx, "task", e.target.value)} 
                    placeholder="Task name" 
                    style={{ width: '120px' }} 
                  />
                </td>

                {/* Note Input */}
                <td>
                  <input 
                    type="text" 
                    value={row.note} 
                    onChange={e => updateRow(idx, "note", e.target.value)} 
                    placeholder="Optional note" 
                    style={{ width: '150px' }} 
                  />
                </td>

                {/* Week dates with manual hours entry */}
                {weekDates.map((d, dIdx) => (
                  <td key={dIdx}>
                    <input
                      type="number"
                    //   step="0.01"
                      value={row.hours[dIdx]}
                      onChange={e => updateWeekHours(idx, dIdx, e.target.value)}
                      placeholder="hrs"
                    />
                  </td>
                ))}
                
                {/* Delete Row button */}
                <td>
                  <button className="delete-row-btn" onClick={() => deleteRow(idx)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
  <tr>
    {/* Daily Totals label under the # column */}
    <td>Daily Totals</td>

    {/* Empty cells for Country, Project, Client, Independence, Task, Note */}
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td>

    {/* Totals under each day */}
    {getDailyTotals().map((total, idx) => (
      <td key={idx}>{total} hrs</td>
    ))}

    {/* Empty cell for Action column */}
    <td></td>
  </tr>
  <tr>
    {/* Final Weekly Total Row */}
    <td>Total</td>
    <td colSpan="6"></td> {/* Skip Country, Project, Client, Independence, Task, Note */}
    
    {/* Put the Grand Total under the first day, or span it across all days */}
    <td colSpan={7} style={{ textAlign: "right", paddingRight: "10px", fontWeight: "bold" }}>
       {getWeeklyTotal()} hrs
    </td>
    
    {/* Empty cell for Action column */}
    <td></td>
          </tr>
</tfoot>

        </table>
      </div>

      {showModal && (
        <Modal 
          message={modalMessage} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

export default ReportTime;
