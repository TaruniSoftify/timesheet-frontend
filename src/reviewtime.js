import React, { useState, useEffect } from "react";
import Navbar from "./navbar";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./api"; // Assuming we use the axios instance
import Modal from "./Modal";
import "./App.css";

function ReviewTime() {
  const location = useLocation();
  const navigate = useNavigate();
  const { period } = location.state || { period: "" };
  const initialRows = location.state?.rows || [];

  const [showPopup, setShowPopup] = useState(true);
  const [rows, setRows] = useState(initialRows);
  const [modalConfig, setModalConfig] = useState({ message: "", onConfirm: null });

  const getHeaderDates = () => {
    if (!period) return [];
    const [startStr] = period.split(" - ");
    const start = new Date(startStr);
    const headers = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        headers.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
    }
    return headers;
  };

  useEffect(() => {
    // If rows were not passed through state (e.g. came from "View Summary" in timecards.js), fetch them
    if (rows.length === 0 && period) {
      const token = localStorage.getItem("access_token");
      api.get("/timeentries/")
         .then(res => {
            const data = res.data;
            if (!Array.isArray(data)) return;

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

            const thisWeekEntries = data.filter(entry => dateStrings.includes(entry.date));
            const groupedRows = {};

            thisWeekEntries.forEach(entry => {
               // Fast hack since projects might not be loaded here - use the ID if we have to
               let country = "", client = "", indep = "";
               if (entry.notes) {
                  const parts = entry.notes.split(", ");
                  parts.forEach(p => {
                     if (p.startsWith("Country: ")) country = p.replace("Country: ", "");
                     if (p.startsWith("Client: ")) client = p.replace("Client: ", "");
                     if (p.startsWith("Independence: ")) indep = p.replace("Independence: ", "").replace(/,+$/, '').trim();
                  });
               }

               const taskVal = entry.task || "";
               let userNote = entry.notes || "";
               userNote = userNote.replace(/Country: [^,]*,? ?/g, '')
                                  .replace(/Client: [^,]*,? ?/g, '')
                                  .replace(/Independence: [^,]*,? ?/g, '').trim();
               if(userNote.endsWith(",")) userNote = userNote.slice(0, -1).trim();

               // Use project ID directly as fallback if name resolution isn't available
               const projId = entry.project || "";
               const rowKey = `${projId}-${taskVal}-${userNote}-${country}-${client}`;

               if (!groupedRows[rowKey]) {
                   groupedRows[rowKey] = {
                       id: Object.keys(groupedRows).length + 1,
                       country: country,
                       project: projId, // Ideally name, but we only have ID here right now
                       client: client,
                       independence: indep,
                       task: taskVal,
                       note: userNote,
                       hours: Array(7).fill("")
                   };
               }

               const dayIdx = dateStrings.indexOf(entry.date);
               if (dayIdx !== -1) {
                   groupedRows[rowKey].hours[dayIdx] = entry.hours;
               }
            });

            const restoredRows = Object.values(groupedRows);
            if (restoredRows.length > 0) {
                setRows(restoredRows);
            }
         })
         .catch(err => console.error("Error fetching review entries:", err));
    }
  }, [period, rows.length]);

  // compute totals for each day
    const dailyTotals = rows.length > 0 
    ? rows[0].hours.map((_, idx) =>
      rows.reduce((sum, row) => sum + parseFloat(row.hours[idx] || 0), 0)
    )
    : [0,0,0,0,0,0,0];

  const handleSubmit = () => {
      // Find this specific timecard and patch the status to Submitted
      if (!period) return;
      const [startStr] = period.split(" - ");
      const start = new Date(startStr);
      let m = '' + (start.getMonth() + 1); let day = '' + start.getDate();
      if (m.length < 2) m = '0' + m; if (day.length < 2) day = '0' + day;
      const startIso = [start.getFullYear(), m, day].join('-');
      const today = new Date().toISOString().split('T')[0];

      api.get("/timecards/")
         .then(res => {
             const timecard = res.data.find(tc => tc.period_start === startIso);
             if (timecard) {
                // Compute the sum of all hours across the entire week before submitting
                const grandTotal = dailyTotals.reduce((sum, current) => sum + current, 0);

                return api.patch(`timecards/${timecard.id}/`, { 
                    status: "Submitted",
                    total_hours: grandTotal,
                    submission_date: today
                });
             } else {
                throw new Error("Timecard not found! Did you click Save on the previous screen?");
             }
         })
         .then(() => {
             setModalConfig({
                 message: "Timesheet submitted successfully for Manager approval!",
                 onConfirm: () => navigate("/timecards")
             });
         })
         .catch(err => {
             console.error(err);
             setModalConfig({
                 message: "Error submitting timesheet: " + err.message,
                 onConfirm: () => setModalConfig({ message: "", onConfirm: null })
             });
         });
  };

  return (
    <div>
      <Navbar username={localStorage.getItem("username")} />

      {/* ✅ Top Action Bar */}
      <div className="reporttime-header">
        <h2 className="reporttime-title">Create Time Card: Review Time</h2>
        <div className="reporttime-buttons">
          <button className="header-btn" onClick={() => window.history.back()}>Back</button>
          <button className="header-btn" onClick={handleSubmit}>Submit</button>
          <button className="header-btn cancel-btn" onClick={() => navigate("/timecards")}>Cancel</button>
        </div>
      </div>

      {/* ✅ Popup compliance message */}
      {showPopup && (
        <div className="popup-box">
          <p>
            Please ensure compliance with Independence Policy Section 5.3.2.
            Trading in client securities during and six months after engagement
            is prohibited.
          </p>
          <button onClick={() => setShowPopup(false)}>OK</button>
        </div>
      )}

      <div className="report-time-container">
        <p>Period: {period}</p>

        <h3 className="time-entry-heading">Reported Time</h3>
        <div id="reviewtime-container">
          <table className="time-entry-table">
            <thead>
                <tr>
                <th>Country</th>
                <th>Project</th>
                <th>Client</th>
                {/* <th>Independence Confirmed</th> */}
                <th>Independence<br/>Confirmed</th>
                {getHeaderDates().map((d, idx) => (
                    <th key={idx}>{d}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, idx) => (
                <tr key={idx}>
                    <td>{row.country}</td>
                    <td>{row.project}</td>
                    <td>{row.client}</td>
                    <td>{row.independence}</td>
                    {row.hours.map((h, hIdx) => (
                    <td key={hIdx}>{h || "0.00"}</td>
                    ))}
                </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <td><strong>Daily Totals</strong></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    {dailyTotals.map((total, idx) => (
                    <td key={idx}>{total.toFixed(2)}</td>
                    ))}
                </tr>
            </tfoot>
          </table>
        </div>
        
        {modalConfig.message && (
            <Modal 
                message={modalConfig.message} 
                onClose={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    setModalConfig({ message: "", onConfirm: null });
                }} 
            />
        )}
      </div>
    </div>
  );
}

export default ReviewTime;
