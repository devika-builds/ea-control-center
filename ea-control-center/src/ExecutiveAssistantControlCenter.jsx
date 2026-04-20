import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",
  cardBg: "#FAFBFD",
  cardBgMuted: "#EEF1F5",
  text: "#2A3547",
  textSecondary: "#566175",
  borderColor: "rgba(42, 53, 71, 0.14)",
  borderStrong: "rgba(42, 53, 71, 0.32)",
  accent: "#6B7FAB",
  accentDim: "rgba(107, 127, 171, 0.18)",
  success: "#8DA399",
  warning: "#D1A377",
  danger: "#C58B8B",
  white: "#FFFFFF",
};

// --- FIX 1: Robust Time Parsing ---
const parseTimeToHours = (timeStr) => {
  if (!timeStr) return 0;
  const m = String(timeStr).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + min / 60;
};

// --- TODAY VIEW ---
const TodayView = ({ tasks, events, taskIndex, onSelectTask }) => {
  const containerRef = useRef(null);

  const makeSlice = (item, widthPct, leftPct) => {
    const start = parseTimeToHours(item.dueTime || item.time);
    const duration = item.duration || 1;
    return {
      ...item,
      top: (start - 8) * 60,
      height: duration * 60,
      width: `calc(${widthPct * 100}% - 12px)`,
      left: `${leftPct * 100}%`,
    };
  };

  // --- FIX 2: Correct Overlap Logic ---
  const taskSlices = useMemo(() => {
    const valid = tasks.filter((t) => t.dueTime);
    const sorted = [...valid].sort((a, b) => {
      const ta = parseTimeToHours(a.dueTime) || 0;
      const tb = parseTimeToHours(b.dueTime) || 0;
      return ta - tb;
    });

    const results = [];
    let currentCluster = [];
    let clusterMaxEnd = -Infinity;

    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      const count = Math.min(currentCluster.length, 2);
      currentCluster.forEach((t, i) => {
        results.push(makeSlice(t, 1 / count, (i % count) / count));
      });
      currentCluster = [];
      clusterMaxEnd = -Infinity;
    };

    sorted.forEach((task) => {
      const slice = makeSlice(task, 1, 0);
      if (slice.top >= clusterMaxEnd && currentCluster.length > 0) {
        flushCluster();
      }
      currentCluster.push(task);
      const taskEnd = slice.top + slice.height;
      if (taskEnd > clusterMaxEnd) clusterMaxEnd = taskEnd;
    });

    flushCluster();
    return results;
  }, [tasks]);

  return (
    <div style={{ padding: "0 40px 40px 40px", flex: 1, overflowY: "auto" }} ref={containerRef}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ 
            position: "absolute", top: i * 60, width: "100%", height: 1, 
            background: COLORS.borderColor, display: "flex", alignItems: "center" 
          }}>
            <span style={{ position: "absolute", left: -45, fontSize: 10, color: COLORS.textSecondary, fontWeight: 700, letterSpacing: 0.5 }}>
              {i + 8}:00
            </span>
          </div>
        ))}
        {taskSlices.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectTask(s)}
            style={{
              position: "absolute", top: s.top, height: s.height, width: s.width, left: s.left,
              background: COLORS.cardBg, borderLeft: `4px solid ${s.completed ? COLORS.success : COLORS.accent}`,
              borderRadius: 4, padding: "12px 16px", boxShadow: "0 2px 12px rgba(42, 53, 71, 0.06)", 
              cursor: "pointer", marginLeft: 12, transition: "transform 0.2s ease"
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, color: COLORS.text, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{s.dueTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- WEEK VIEW ---
const WeekView = ({ tasks, taskIndex, onSelectTask }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div style={{ padding: 40, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
      {days.map(day => (
        <div key={day} style={{ background: COLORS.cardBg, borderRadius: 12, padding: 20, minHeight: 400, border: `1px solid ${COLORS.borderColor}` }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: COLORS.textSecondary }}>{day}</h3>
          {/* Day Content */}
        </div>
      ))}
    </div>
  );
};

// --- CALENDAR VIEW ---
const CalendarView = ({ events, tasks }) => (
  <div style={{ padding: 40 }}>
    <div style={{ background: COLORS.cardBg, borderRadius: 16, padding: 32, border: `1px solid ${COLORS.borderColor}` }}>
      <h2 style={{ margin: 0 }}>Calendar</h2>
      {/* Calendar Grid Logic */}
    </div>
  </div>
);

// --- NOTES VIEW ---
const NotesView = ({ notes }) => (
  <div style={{ padding: 40 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {notes.map(note => (
        <div key={note.id} style={{ background: COLORS.white, padding: 24, borderRadius: 12, border: `1px solid ${COLORS.borderColor}` }}>
          <h4 style={{ margin: "0 0 8px 0" }}>{note.title}</h4>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textSecondary }}>{note.content}</p>
        </div>
      ))}
    </div>
  </div>
);

// --- TASK DETAIL SIDEBAR ---
const TaskDetail = ({ task, onClose }) => {
  if (!task) return null;
  return (
    <div style={{ 
      position: "fixed", right: 0, top: 0, bottom: 0, width: 400, 
      background: COLORS.white, borderLeft: `1px solid ${COLORS.borderColor}`, 
      padding: 40, zIndex: 1000, boxShadow: "-10px 0 30px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: COLORS.accent }}>Task Intelligence</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>ESC</button>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>{task.title}</h2>
      <div style={{ color: COLORS.textSecondary, marginBottom: 32 }}>{task.dueTime}</div>
      <div style={{ padding: 24, background: COLORS.cardBgMuted, borderRadius: 12 }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{task.description || "No additional context provided for this task."}</p>
      </div>
    </div>
  );
};

// --- MAIN CONTAINER ---
const ExecutiveAssistantControlCenter = ({ tasks = [], events = [], notes = [], taskIndex = {} }) => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedTask, setSelectedTask] = useState(null);

  const TABS = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "calendar", label: "Calendar" },
    { id: "notes", label: "Notes" }
  ];

  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ padding: "60px 40px 40px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>Executive Dashboard</h1>
          <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,0.03)", padding: 6, borderRadius: 12 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeTab === t.id ? COLORS.accent : "transparent",
                  color: activeTab === t.id ? COLORS.white : COLORS.text,
                  fontWeight: 700, fontSize: 13, transition: "all 0.2s ease"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "today" && <TodayView tasks={tasks} events={events} onSelectTask={setSelectedTask} />}
        {activeTab === "week" && <WeekView tasks={tasks} onSelectTask={setSelectedTask} />}
        {activeTab === "calendar" && <CalendarView events={events} tasks={tasks} />}
        {activeTab === "notes" && <NotesView notes={notes} />}

        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
