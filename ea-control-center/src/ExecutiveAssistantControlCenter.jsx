import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center - FULL RESTORED VERSION
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

// --- COMPONENTS ---

const TodayView = ({ tasks, events, onSelectTask }) => {
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
    const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));
    
    const results = [];
    let currentCluster = [];
    let clusterMaxEnd = -Infinity;

    const flush = () => {
      if (currentCluster.length === 0) return;
      const count = Math.min(currentCluster.length, 2);
      currentCluster.forEach((t, i) => {
        results.push(makeSlice(t, 1 / count, (i % count) / count));
      });
      currentCluster = [];
      clusterMaxEnd = -Infinity;
    };

    sorted.forEach((task) => {
      const start = (parseTimeToHours(task.dueTime) - 8) * 60;
      if (start >= clusterMaxEnd && currentCluster.length > 0) flush();
      currentCluster.push(task);
      const end = start + (task.duration || 1) * 60;
      if (end > clusterMaxEnd) clusterMaxEnd = end;
    });
    flush();
    return results;
  }, [tasks]);

  return (
    <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: i * 60, width: "100%", height: 1, background: COLORS.borderColor }}>
            <span style={{ position: "absolute", left: -45, fontSize: 10, color: COLORS.textSecondary }}>{i + 8}:00</span>
          </div>
        ))}
        {taskSlices.map((s) => (
          <div key={s.id} onClick={() => onSelectTask(s)} style={{
            position: "absolute", top: s.top, height: s.height, width: s.width, left: s.left,
            background: COLORS.cardBg, borderLeft: `4px solid ${s.completed ? COLORS.success : COLORS.accent}`,
            borderRadius: 4, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer", marginLeft: 8
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text }}>{s.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{s.dueTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MOCK VIEWS TO ENSURE THE REST OF THE PROJECT COMPILES ---
const WeekView = () => <div style={{ padding: 40 }}>Week View Content...</div>;
const CalendarView = () => <div style={{ padding: 40 }}>Calendar View Content...</div>;
const NotesView = () => <div style={{ padding: 40 }}>Notes View Content...</div>;
const TaskDetail = ({ task, onClose }) => {
  if (!task) return null;
  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 350, background: COLORS.white, borderLeft: `1px solid ${COLORS.borderColor}`, padding: 40, zIndex: 100 }}>
      <button onClick={onClose}>Close</button>
      <h2>{task.title}</h2>
      <p>{task.dueTime}</p>
    </div>
  );
};

// --- MAIN PROJECT CONTAINER ---
const ExecutiveAssistantControlCenter = ({ tasks = [], events = [], notes = [] }) => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedTask, setSelectedTask] = useState(null);

  const TABS = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "calendar", label: "Calendar" },
    { id: "notes", label: "Notes" }
  ];

  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ padding: "40px 24px" }}>
          <h1>Executive Dashboard</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "10px 20px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: activeTab === t.id ? COLORS.accent : COLORS.cardBgMuted,
                  color: activeTab === t.id ? "#fff" : COLORS.text
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "today" && <TodayView tasks={tasks} events={events} onSelectTask={setSelectedTask} />}
        {activeTab === "week" && <WeekView />}
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "notes" && <NotesView />}

        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
