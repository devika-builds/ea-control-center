import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center - FULL RESTORED & FIXED
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

// --- FIX 1: Robust Time Parsing (Handles "9:00AM" and "9:00 AM") ---
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

  // --- FIX 2: Correct Overlap Logic (No more infinite stacking) ---
  const taskSlices = useMemo(() => {
    const valid = tasks.filter((t) => t.dueTime);
    const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));

    const results = [];
    let currentCluster = [];
    let clusterMaxEnd = -Infinity;

    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      if (currentCluster.length === 1) {
        results.push(makeSlice(currentCluster[0], 1, 0));
      } else {
        const colCount = 2;
        currentCluster.forEach((t, i) => {
          const col = i % colCount;
          results.push(makeSlice(t, 1 / colCount, col / colCount));
        });
      }
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
    <div style={{ padding: 24, flex: 1, overflowY: "auto" }} ref={containerRef}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: i * 60, width: "100%", height: 1, background: COLORS.borderColor }}>
            <span style={{ position: "absolute", left: -45, fontSize: 10, color: COLORS.textSecondary, fontWeight: 600 }}>{i + 8}:00</span>
          </div>
        ))}
        {taskSlices.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectTask(s)}
            style={{
              position: "absolute", top: s.top, height: s.height, width: s.width, left: s.left,
              background: COLORS.cardBg, borderLeft: `4px solid ${s.completed ? COLORS.success : COLORS.accent}`,
              borderRadius: 4, padding: "8px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", cursor: "pointer", marginLeft: 8
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text }}>{s.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{s.dueTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MOCK/STUB COMPONENTS FOR OTHER VIEWS (REPLACE WITH YOUR ORIGINALS) ---
const WeekView = ({ tasks, onSelectTask }) => <div style={{ padding: 40 }}>Week View Content...</div>;
const CalendarView = ({ events }) => <div style={{ padding: 40 }}>Calendar View Content...</div>;
const NotesView = ({ notes }) => <div style={{ padding: 40 }}>Notes View Content...</div>;

const TaskDetail = ({ task, onClose }) => {
  if (!task) return null;
  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 400, background: COLORS.white, borderLeft: `1px solid ${COLORS.borderColor}`, padding: 40, zIndex: 100, boxShadow: "-4px 0 20px rgba(0,0,0,0.05)" }}>
      <button onClick={onClose} style={{ marginBottom: 20 }}>Close</button>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>{task.title}</h2>
      <p style={{ color: COLORS.textSecondary }}>Due: {task.dueTime}</p>
      <div style={{ marginTop: 24, padding: 20, background: COLORS.cardBgMuted, borderRadius: 8 }}>
        <h4 style={{ margin: 0, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Description</h4>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>{task.description || "No description provided."}</p>
      </div>
    </div>
  );
};

// --- MAIN PROJECT COMPONENT ---
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
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.5 }}>Command Center</h1>
            <p style={{ margin: "4px 0 0 0", color: COLORS.textSecondary, fontSize: 14 }}>Manage your executive schedule and tasks.</p>
          </div>
          <div style={{ display: "flex", gap: 8, background: COLORS.cardBgMuted, padding: 4, borderRadius: 8 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: activeTab === t.id ? COLORS.accent : "transparent",
                  color: activeTab === t.id ? "#fff" : COLORS.text,
                  fontWeight: 600, fontSize: 12
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "today" && <TodayView tasks={tasks} events={events} onSelectTask={setSelectedTask} />}
        {activeTab === "week" && <WeekView tasks={tasks} onSelectTask={setSelectedTask} />}
        {activeTab === "calendar" && <CalendarView events={events} />}
        {activeTab === "notes" && <NotesView notes={notes} />}

        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
