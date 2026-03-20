import React, { useState, useEffect } from "react";
import Navbar from "./navbar";
import { Link, useNavigate } from "react-router-dom";
import api from "./api"; // ✅ Ensure we use the smart auto-refresh interceptor
import "./App.css";
import Modal from "./Modal";

function TimeCards() {

  const [timecards, setTimecards] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);

  const [columns, setColumns] = useState([
    { id: 'period', label: 'Time Card Period', visible: true },
    { id: 'status', label: 'Status', visible: true },
    { id: 'total_hours', label: 'Total Hours', visible: true },
    { id: 'submission_date', label: 'Submission Date', visible: true },
    { id: 'view_summary', label: 'View Summary', visible: true }
  ]);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showReorderMenu, setShowReorderMenu] = useState(false);

  const [selectedSummaryPeriod, setSelectedSummaryPeriod] = useState("");
  const [summaryRows, setSummaryRows] = useState([]);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  // Calculate pagination parameters
  const totalPages = Math.ceil(timecards.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentCards = timecards.slice(startIndex, startIndex + rowsPerPage);

  const openSummaryModal = (period) => {
    setSelectedSummaryPeriod(period);
    setSummaryRows([]);
    setIsSummaryModalOpen(true);
  };

  const getSummaryHeaderDates = () => {
    if (!selectedSummaryPeriod) return [];
    const [startStr] = selectedSummaryPeriod.split(" - ");
    const start = new Date(startStr);
    const headers = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        headers.push(d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }));
    }
    return headers;
  };

  const closeSummaryModal = () => {
    setIsSummaryModalOpen(false);
    setSelectedSummaryPeriod("");
  };

  const navigate = useNavigate();

  const toggleColumnVisibility = (id) => {
    setColumns(columns.map(col => col.id === id ? { ...col, visible: !col.visible } : col));
  };

  const setAllColumnsVisible = () => {
    setColumns(columns.map(col => ({ ...col, visible: true })));
  };

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    if (direction === 'up' && index > 0) {
      [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
    } else if (direction === 'down' && index < newCols.length - 1) {
      [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
    }
    setColumns(newCols);
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown")) {
        setShowActionsMenu(false);
        setShowViewMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


  // Load from localStorage first
  useEffect(() => {
    const saved = localStorage.getItem("timecards");
    if (saved) {
      setTimecards(JSON.parse(saved));
    }
  }, []);


  // Fetch from backend
  const fetchTimecards = () => {
    // We don't need to manually attach the token, our `api.js` interceptor handles it
    api.get("timecards/")
      .then(res => {
        const data = res.data; // Axios stores response JSON in `res.data`
        
        if (Array.isArray(data)) {
          // Reconstruct the `period` string because Django only returns period_start and period_end
          const options = { day: "2-digit", month: "short", year: "numeric" };
          
          const formattedData = data.map(tc => {
            if (tc.period_start && tc.period_end) {
              const start = new Date(tc.period_start);
              const end = new Date(tc.period_end);
              tc.period = `${start.toLocaleDateString("en-GB", options)} - ${end.toLocaleDateString("en-GB", options)}`;
            }
            return tc;
          });

          // Sort by newest first based on the newly attached period string
          const sortedData = formattedData.sort((a, b) => {
            if(!a.period || !b.period) return 0;
            const aDate = new Date(a.period.split(" - ")[0]);
            const bDate = new Date(b.period.split(" - ")[0]);
            return bDate - aDate;
          });

          setTimecards(sortedData);
          localStorage.setItem("timecards", JSON.stringify(sortedData));
        }
      })
      .catch(err => console.error("Error fetching timecards:", err));
  };

  useEffect(() => {
    fetchTimecards(); // Fetch on mount
    
    // Also fetch whenever the user navigates back to this tab/window,
    // ensuring the `total_hours` sum updates instantly after they save `reporttime.js`
    window.addEventListener("focus", fetchTimecards);
    return () => window.removeEventListener("focus", fetchTimecards);
  }, []);

  // --- SUMMARY MODAL LOGIC ---
  useEffect(() => {
    if (isSummaryModalOpen && selectedSummaryPeriod) {
      Promise.all([
        api.get("/timeentries/"),
        api.get("/projects/")
      ]).then(([entriesRes, projectsRes]) => {
            const data = entriesRes.data;
            const projectsData = projectsRes.data;
            if (!Array.isArray(data)) return;

            // Create a lookup map for Project ID -> Name
            const projectMap = {};
            if (Array.isArray(projectsData)) {
              projectsData.forEach(p => {
                projectMap[p.id] = p.name;
              });
            }

            const [startStr] = selectedSummaryPeriod.split(" - ");
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

               const projId = entry.project || "";
               const projName = projectMap[projId] || projId; // Map the ID to the Name!
               const rowKey = `${projId}-${taskVal}-${userNote}-${country}-${client}`;

               if (!groupedRows[rowKey]) {
                   groupedRows[rowKey] = {
                       id: Object.keys(groupedRows).length + 1,
                       country: country,
                       project: projName, // Set the mapped name here
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
            setSummaryRows(restoredRows);
         })
         .catch(err => console.error("Error fetching review entries:", err));
    }
  }, [isSummaryModalOpen, selectedSummaryPeriod]);

  const summaryDailyTotals = summaryRows.length > 0 
    ? summaryRows[0].hours.map((_, idx) =>
        summaryRows.reduce((sum, row) => sum + parseFloat(row.hours[idx] || 0), 0)
      )
    : [0,0,0,0,0,0,0];
  // ---------------------------



  const createTimecard = () => {
    console.log("Selected date:", selectedDate);
    if (!selectedDate) {
      setModalMessage("Please select a date from the calendar first!");
      return;
    }

    const start = new Date(selectedDate);

    const day = start.getDay();
    const diffToMonday = (day === 0 ? -6 : 1 - day);
    start.setDate(start.getDate() + diffToMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options = { day: "2-digit", month: "short", year: "numeric" };

    const period = `${start.toLocaleDateString("en-GB", options)} - ${end.toLocaleDateString("en-GB", options)}`;

    const exists = timecards.some(tc => tc.period === period);

    if (exists) {
      setModalMessage("A timesheet for this week already exists! Please select a differently week.");
      setShowCalendarPopup(false);
      return;
    }

    const formatLocal = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // Save to backend using our auto-refresh interceptor
    api.post("timecards/", {
        period_start: formatLocal(start),
        period_end: formatLocal(end)
    })
    .then(res => {
        const data = res.data;
        console.log("Saved to backend:", data);

        // Fallback to the 'period' we just calculated since the backend API does not return a 'period' string
        const safePeriod = data.period || period;

        // Map the backend data to match the format needed in the frontend table
        const savedCard = {
          id: data.id || Date.now(),
          period: safePeriod,
          status: data.status || "Draft",
          total_hours: data.total_hours || 0,
          submission_date: data.submission_date || ""
        };

        const updated = [...timecards, savedCard].sort((a, b) => {
          const aDate = new Date(a.period.split(" - ")[0]);
          const bDate = new Date(b.period.split(" - ")[0]);
          return bDate - aDate; // newest first
        });

        setTimecards(updated);
        localStorage.setItem("timecards", JSON.stringify(updated));
    })
    .catch(err => {
        if (err.isSilentLogout) return; // Prevent alert from blocking the redirect!
        console.error("Error saving timecard:", err);
        setModalMessage("Failed to create timecard: " + (err.message || "Server Error"));
    });

    setShowCalendarPopup(false);
  };
  const handleExportExcel = () => {
    if (timecards.length === 0) {
      setModalMessage("No timecards to export.");
      return;
    }
    const headers = ["Time Card Period", "Status", "Total Hours", "Submission Date"];
    const rows = timecards.map(tc => [
      `"${tc.period}"`,
      `"${tc.status || "Draft"}"`,
      `"${tc.total_hours}"`,
      `"${tc.submission_date || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timesheets_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div>

      <Navbar username={localStorage.getItem("username")} />

      <div className="timecards-wrapper">
        <div className="timecards-container">

          <h2>Existing Time cards</h2>

        <div className="results-section">

          <div className="actions-bar">

            <div className="dropdown">

              <div
                className={`dropdown-toggle ${showActionsMenu ? "active" : ""}`}
                onClick={() => {
                  setShowActionsMenu(!showActionsMenu);
                  setShowViewMenu(false);
                }}
              >
                Actions ▼
              </div>

              {showActionsMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => setShowCalendarPopup(true)}>Create</div>
                  <div className="dropdown-item" onClick={handleExportExcel}>Export to Excel</div>
                </div>
              )}

            </div>



            <div className="dropdown">

              <div
                className={`dropdown-toggle ${showViewMenu ? "active" : ""}`}
                onClick={() => {
                  setShowViewMenu(!showViewMenu);
                  setShowActionsMenu(false);
                }}
              >
                View ▼
              </div>

              {showViewMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" 
                       onMouseEnter={() => {setShowColumnsMenu(true); setShowReorderMenu(false);}}
                       onMouseLeave={() => setShowColumnsMenu(false)}
                       style={{position: 'relative', display: 'flex', justifyContent: 'space-between'}}>
                    <span>Columns</span>
                    <span>▸</span>
                    {showColumnsMenu && (
                      <div className="nested-dropdown-menu" style={{position: 'absolute', left: '100%', top: '-1px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', minWidth: '200px', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                        <div className="dropdown-item" style={{fontWeight: 'bold', borderBottom: '1px solid #eee', whiteSpace: 'nowrap'}} onClick={(e) => { e.stopPropagation(); setAllColumnsVisible(); }}>Show All</div>
                        {columns.map(col => (
                           <label key={col.id} className="dropdown-item" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                             <input 
                                type="checkbox" 
                                checked={col.visible} 
                                onChange={(e) => { e.stopPropagation(); toggleColumnVisibility(col.id); }} 
                                style={{marginRight: '8px', cursor: 'pointer'}} 
                             />
                             {col.label}
                           </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="dropdown-item" 
                       onMouseEnter={() => {setShowReorderMenu(true); setShowColumnsMenu(false);}}
                       onMouseLeave={() => setShowReorderMenu(false)}
                       style={{position: 'relative', display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap'}}>
                    <span>Reorder Columns...</span>
                    <span>▸</span>
                    {showReorderMenu && (
                      <div className="nested-dropdown-menu" style={{position: 'absolute', left: '100%', top: '-1px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', minWidth: '220px', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}>
                        <div style={{padding: '8px 12px', fontSize: '12px', color: '#666', borderBottom: '1px solid #eee'}}>Move up or down</div>
                        {columns.map((col, idx) => (
                           <div key={col.id} className="dropdown-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} onClick={(e) => e.stopPropagation()}>
                             <span>{col.label}</span>
                             <span>
                               <i className="fa-solid fa-caret-up" style={{cursor: 'pointer', marginRight: '16px', fontSize: '16px', color: idx === 0 ? '#ccc' : '#555'}} onClick={(e) => { e.stopPropagation(); moveColumn(idx, 'up'); }}></i>
                               <i className="fa-solid fa-caret-down" style={{cursor: 'pointer', fontSize: '16px', color: idx === columns.length - 1 ? '#ccc' : '#555'}} onClick={(e) => { e.stopPropagation(); moveColumn(idx, 'down'); }}></i>
                             </span>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>


            <div
              className="icon-button plus-icon"
              onClick={() => setShowCalendarPopup(true)}
              style={{ padding: '0 8px', color: '#555', fontSize: '18px' }}
            >
              <i className="fa-regular fa-calendar-plus" title="Create Time Card"></i>
            </div>

            <div 
              className="icon-button excel-icon" 
              style={{ padding: '0 8px', color: '#555', fontSize: '18px', cursor: 'pointer' }}
              onClick={handleExportExcel}
            >
              <i className="fa-solid fa-table-cells" title="Export to Excel"></i>
            </div>

          </div>



          {showCalendarPopup && (
            <div className="calendar-popup">

              <h3>Create Time Card</h3>

              <input
                type="date"
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              <div className="popup-buttons">
                <button onClick={createTimecard}>OK</button>
                <button onClick={() => setShowCalendarPopup(false)}>Cancel</button>
              </div>

            </div>
          )}



          <table className="timecards-table">

            <thead>
              <tr>
                {columns.filter(col => col.visible).map(col => (
                  <th key={col.id}>{col.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>

              {currentCards.map(tc => (

                <tr key={tc.id}>
                  {columns.filter(col => col.visible).map(col => {
                    switch (col.id) {
                      case 'period':
                        return (
                          <td key={col.id} className="timecard-period">
                            <Link to={`/report/${encodeURIComponent(tc.period)}`}>
                              {tc.period}
                            </Link>
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={col.id}>
                            {tc.status === "Saved" ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" style={{marginRight: '8px', verticalAlign: 'middle'}}>
                                  <rect x="3" y="4" width="16" height="15" rx="2" fill="#e2e8f0" />
                                  <rect x="3" y="4" width="16" height="5" rx="2" fill="#ef4444" />
                                  <rect x="3" y="7" width="16" height="2" fill="#ef4444" />
                                  <circle cx="7" cy="4" r="1.5" fill="#f8fafc" />
                                  <circle cx="15" cy="4" r="1.5" fill="#f8fafc" />
                                  <rect x="6" y="11" width="2" height="2" fill="#94a3b8" />
                                  <rect x="10" y="11" width="2" height="2" fill="#94a3b8" />
                                  <rect x="14" y="11" width="2" height="2" fill="#94a3b8" />
                                  <rect x="6" y="15" width="2" height="2" fill="#94a3b8" />
                                  <rect x="10" y="15" width="2" height="2" fill="#94a3b8" />
                                  <circle cx="16" cy="16" r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                                  <polyline points="16,13 16,16 18,17" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                Saved
                              </div>
                            ) :
                             tc.status === "Submitted" ? <><i className="fa-regular fa-clock" style={{color: '#eab308', marginRight: '6px'}}></i> Submitted</> :
                             tc.status === "Approved" ? <><i className="fa-solid fa-circle-check" style={{color: '#22c55e', marginRight: '6px'}}></i> Approved</> :
                             tc.status === "Rejected" ? <><i className="fa-solid fa-circle-xmark" style={{color: '#ef4444', marginRight: '6px'}}></i> Rejected</> :
                             tc.status || "Draft"}
                          </td>
                        );
                      case 'total_hours':
                        return <td key={col.id}>{tc.total_hours}</td>;
                      case 'submission_date':
                        return <td key={col.id}>{tc.submission_date}</td>;
                      case 'view_summary':
                        return (
                          <td key={col.id}>
                            <button onClick={() => openSummaryModal(tc.period)}>View</button>
                          </td>
                        );
                      default:
                        return <td key={col.id}></td>;
                    }
                  })}
                </tr>

              ))}

            </tbody>

          </table>

          {/* --- PAGINATION CONTROLS --- */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px', gap: '8px' }}>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#4a5568', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <i className="fa-solid fa-chevron-left"></i> Prev
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderRadius: '4px', cursor: 'pointer',
                      background: currentPage === page ? '#0070c0' : 'white',
                      borderColor: currentPage === page ? '#0070c0' : '#e2e8f0',
                      color: currentPage === page ? 'white' : '#4a5568',
                      fontWeight: currentPage === page ? '600' : '400'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#4a5568', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>

            </div>
          )}

        </div>
      </div>
    </div>

      {/* --- INLINE VIEW SUMMARY MODAL --- */}
      {isSummaryModalOpen && (
        <div className="popup-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div className="popup-content" style={{background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px'}}>
              <h3 style={{margin: 0, color: '#2d3748', fontSize: '18px'}}>View Summary: <span style={{fontWeight: 'normal', color: '#4a5568'}}>{selectedSummaryPeriod}</span></h3>
              <button onClick={closeSummaryModal} style={{background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#a0aec0'}}>&times;</button>
            </div>

            {summaryRows.length === 0 ? (
                <div style={{padding: '40px', textAlign: 'center', color: '#718096'}}>
                  <p>Loading or no time entries found for this period.</p>
                </div>
            ) : (
                <div style={{overflowX: 'auto'}}>
                  <table className="time-entry-table" style={{width: '100%'}}>
                    <thead>
                        <tr>
                        <th>Country</th>
                        <th>Project</th>
                        <th>Client</th>
                        <th>Independence<br/>Confirmed</th>
                        {getSummaryHeaderDates().map((d, idx) => (
                            <th key={idx}>{d}</th>
                        ))}
                        </tr>
                    </thead>
                    <tbody>
                        {summaryRows.map((row, idx) => (
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
                    <tfoot style={{background: '#f8fafc', fontWeight: 600}}>
                        <tr>
                            <td>Daily Totals</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            {summaryDailyTotals.map((total, idx) => (
                            <td key={idx}>{total.toFixed(2)}</td>
                            ))}
                        </tr>
                    </tfoot>
                  </table>
                </div>
            )}
            
            <div style={{marginTop: '24px', textAlign: 'right'}}>
                <button onClick={closeSummaryModal} style={{padding: '8px 24px', background: '#0070c0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500}}>Close</button>
            </div>

          </div>
        </div>
      )}

      <Modal message={modalMessage} onClose={() => setModalMessage("")} />
    </div>
  );
}

export default TimeCards;