import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// Heritage Silver — Executive Light Mode palette
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
  // Regex handles optional space: "9:00 AM" or "9:00AM"
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
      // Max 2 columns for readability
      const count = Math.min(currentCluster.length, 2);
      currentCluster.forEach((t, i) => {
        results.push(makeSlice(t, 1 / count, (i % count) / count));
      });
      currentCluster = [];
      clusterMaxEnd = -Infinity;
    };

    sorted.forEach((task) => {
      const slice = makeSlice(task, 1, 0);
      // Logic fix: Flush if this task starts after the cluster's latest end point
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
    <div style={{ padding: 24, flex: 1, overflowY: "auto" }} ref={containerRef}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ 
            position: "absolute", top: i * 60, width: "100%", height: 1, 
            background: COLORS.borderColor, display: "flex", alignItems: "center" 
          }}>
            <span style={{ position: "absolute", left: -45, fontSize: 10, color: COLORS.textSecondary, fontWeight: 700 }}>
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
              borderRadius: 4, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", 
              cursor: "pointer", marginLeft: 8, overflow: "hidden"
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 12, color: COLORS.text }}>{s.title}</div>
            <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 2 }}>{s.dueTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ... Include your WeekView, CalendarView, NotesView, and TaskDetail below ...
// (I am assuming these were in your original file - please ensure they remain intact)

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
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "40px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>Command Center</h1>
          <div style={{ display: "flex", gap: 8, background: COLORS.cardBgMuted, padding: 4, borderRadius: 10 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: activeTab === t.id ? COLORS.accent : "transparent",
                  color: activeTab === t.id ? "#fff" : COLORS.text,
                  fontWeight: 700, fontSize: 12
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "today" && <TodayView tasks={tasks} events={events} onSelectTask={setSelectedTask} />}
        {/* Placeholder calls for your other views */}
        {/* {activeTab === "week" && <WeekView ... />} */}
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
