import React, { useState, useMemo, useCallback } from "react";

// ---------------------------------------------------------------------------
// EXECUTIVE ASSISTANT CONTROL CENTER
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",      // Platinum mist
  cardBg: "#FAFBFD",          // Silk White
  cardBgMuted: "#EEF1F5",     // Cool ash
  text: "#2A3547",            // Navy Ink
  textSecondary: "#566175",   // Mid slate
  borderColor: "rgba(42, 53, 71, 0.14)",
  accent: "#6B7FAB",          // Liberty Blue
  accentDim: "rgba(107, 127, 171, 0.12)",
  critical: "#E6D4E1",        // Soft thistle
  criticalText: "#8C5E7F",    // Deep thistle
  sage: "#B5C3DA",            // Little Boy Blue
  slateBlue: "#C4CDE3",       // Thistle pastel
};

const HOUR_HEIGHT = 80;
const DAY_START = 8;
const MAX_COLUMNS = 2;
const CLUSTER_GAP = 12;

// ---------------------------------------------------------------------------
// DATA & UTILS
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  { id: "t1", title: "CEO Briefing: Westside Partners", time: "09:00 AM", status: "in-progress", category: "research", priority: "high" },
  { id: "t2", title: "Reschedule Vendor Meeting", time: "10:30 AM", status: "blocked", category: "scheduling", priority: "medium" },
  { id: "t3", title: "Board Deck Final Review", time: "11:00 AM", status: "waiting", category: "operations", priority: "high" },
  { id: "t4", title: "Quarterly Expense Audit", time: "01:30 PM", status: "in-progress", category: "finance", priority: "medium" },
];

const parseTimeToHours = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours + minutes / 60;
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const TaskCard = ({ placement, onSelect }) => {
  const { task, top, height, column, columnCount } = placement;
  const isBlocked = task.status === "blocked";

  return (
    <div
      onClick={() => onSelect(task)}
      style={{
        position: "absolute",
        top,
        left: `${(column / columnCount) * 100}%`,
        width: `${(1 / columnCount) * 100}%`,
        height: height - 4,
        padding: "0 6px",
        transition: "all 0.2s ease",
        zIndex: isBlocked ? 1 : 2,
      }}
    >
      <div style={{
        background: isBlocked ? COLORS.critical : COLORS.cardBg,
        border: `1px solid ${isBlocked ? COLORS.criticalText : COLORS.borderColor}`,
        borderRadius: 8,
        height: "100%",
        padding: "12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4 }}>
            {task.time}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.3 }}>
            {task.title}
          </div>
        </div>
        <div style={{ 
          fontSize: 10, 
          textTransform: "uppercase", 
          letterSpacing: 0.5, 
          color: isBlocked ? COLORS.criticalText : COLORS.accent,
          fontWeight: 700
        }}>
          {task.status.replace("-", " ")}
        </div>
      </div>
    </div>
  );
};

const TodayView = ({ tasks, onSelectTask }) => {
  const { placements, totalHeight } = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => parseTimeToHours(a.time) - parseTimeToHours(b.time));
    const result = [];
    let cluster = [];
    let clusterEnd = -Infinity;

    const flush = () => {
      if (!cluster.length) return;
      const colCount = Math.max(...cluster.map(p => p.column)) + 1;
      cluster.forEach(p => {
        p.columnCount = colCount;
        result.push(p);
      });
      cluster = [];
      clusterEnd = -Infinity;
    };

    sorted.forEach(task => {
      const top = (parseTimeToHours(task.time) - DAY_START) * HOUR_HEIGHT;
      if (top >= clusterEnd && cluster.length) flush();

      let col = -1;
      for (let i = 0; i < MAX_COLUMNS; i++) {
        if (!cluster.some(p => p.column === i && top < p.top + p.height)) {
          col = i;
          break;
        }
      }

      const p = { task, top, height: 100, column: col === -1 ? 0 : col };
      if (col === -1) {
        const lastBottom = Math.max(...cluster.map(c => c.top + c.height));
        p.top = lastBottom + CLUSTER_GAP;
        flush(); 
      }
      
      cluster.push(p);
      clusterEnd = Math.max(clusterEnd, p.top + p.height);
    });
    flush();
    return { placements: result, totalHeight: Math.max(800, clusterEnd + 40) };
  }, [tasks]);

  return (
    <div style={{ position: "relative", height: totalHeight, background: COLORS.cardBgMuted, borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.borderColor}` }}>
      {/* Time Grid Lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: i * HOUR_HEIGHT, width: "100%", borderTop: `1px solid ${COLORS.borderColor}`, paddingLeft: 8, fontSize: 10, color: COLORS.textSecondary, paddingTop: 4 }}>
          {i + DAY_START}:00
        </div>
      ))}
      <div style={{ position: "relative", marginLeft: 50, height: "100%" }}>
        {placements.map(p => <TaskCard key={p.task.id} placement={p} onSelect={onSelectTask} />)}
      </div>
    </div>
  );
};

const ExecutiveAssistantControlCenter = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedTask, setSelectedTask] = useState(null);

  const tabs = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "calendar", label: "Calendar" },
    { id: "notes", label: "Internal Notes" }
  ];

  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ color: COLORS.text, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>System Control</h1>
            <p style={{ color: COLORS.textSecondary, fontSize: 14 }}>Operational Dashboard • April 17, 2026</p>
          </div>
          
          <div style={{ display: "flex", background: COLORS.cardBg, padding: 4, borderRadius: 10, border: `1px solid ${COLORS.borderColor}` }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  background: activeTab === t.id ? COLORS.accent : "transparent",
                  color: activeTab === t.id ? "#FFF" : COLORS.textSecondary,
                  transition: "all 0.2s ease"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main View Area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div style={{ minHeight: 600 }}>
            {activeTab === "today" && <TodayView tasks={SAMPLE_TASKS} onSelectTask={setSelectedTask} />}
            {activeTab !== "today" && (
              <div style={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.cardBg, borderRadius: 12, border: `1px solid ${COLORS.borderColor}`, color: COLORS.textSecondary }}>
                {activeTab.toUpperCase()} VIEW IN DEVELOPMENT
              </div>
            )}
          </div>

          {/* Right Sidebar (Bento Style) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: COLORS.accent, color: "#FFF", padding: 24, borderRadius: 16 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8, fontWeight: 600 }}>PRIORITY FOCUS</div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>Finalize Board Deck Review before 11:00 AM</div>
            </div>
            
            <div style={{ background: COLORS.cardBg, padding: 20, borderRadius: 16, border: `1px solid ${COLORS.borderColor}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: COLORS.text }}>Status Overview</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["In Progress", "Waiting", "Blocked"].map(status => (
                  <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: COLORS.textSecondary }}>{status}</span>
                    <span style={{ fontWeight: 700, color: COLORS.text }}>{Math.floor(Math.random() * 5) + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
