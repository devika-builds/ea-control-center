import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center - FIXED VERSION
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

// FIX 1: Robust Time Parsing (Handles "9:00AM" without spaces)
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

const TodayView = ({ tasks, events, taskIndex, onSelectTask }) => {
  const makeSlice = (item, widthPct, leftPct) => {
    const start = parseTimeToHours(item.dueTime || item.time);
    const duration = item.duration || 1;
    return {
      ...item,
      top: (start - 8) * 60, // Grid starts at 8 AM
      height: duration * 60,
      width: `calc(${widthPct * 100}% - 12px)`,
      left: `${leftPct * 100}%`,
    };
  };

  // FIX 2: Correct Collision Logic (Prevents infinite side-by-side stacking)
  const computeTaskColumns = (taskList) => {
    const valid = taskList.filter((t) => t.dueTime);
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
      
      // If the next task starts after the cluster's latest end time, start a new row
      if (slice.top >= clusterMaxEnd && currentCluster.length > 0) {
        flushCluster();
      }

      currentCluster.push(task);
      const taskEnd = slice.top + slice.height;
      if (taskEnd > clusterMaxEnd) clusterMaxEnd = taskEnd;
    });

    flushCluster();
    return results;
  };

  const taskSlices = useMemo(() => computeTaskColumns(tasks), [tasks]);

  return (
    <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ 
            position: "absolute", top: i * 60, width: "100%", height: 1, background: COLORS.borderColor 
          }}>
            <span style={{ position: "absolute", left: -45, fontSize: 10, color: COLORS.textSecondary }}>
              {i + 8}:00
            </span>
          </div>
        ))}
        
        {taskSlices.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectTask(s)}
            style={{
              position: "absolute",
              top: s.top,
              height: s.height,
              width: s.width,
              left: s.left,
              background: COLORS.cardBg,
              borderLeft: `4px solid ${s.completed ? COLORS.success : COLORS.accent}`,
              borderRadius: 4,
              padding: "8px 12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              cursor: "pointer",
              marginLeft: 8
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

// Simplified main component for export
const ExecutiveAssistantControlCenter = ({ tasks = [], events = [], notes = [] }) => {
  const [activeTab, setActiveTab] = useState("today");
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", color: COLORS.text, fontFamily: "Inter, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ padding: "40px 24px" }}>
          <h1 style={{ margin: 0 }}>Command Center</h1>
          <nav style={{ marginTop: 20, display: "flex", gap: 10 }}>
            {["today", "week", "calendar"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "8px 16px", borderRadius: 4, border: "none", cursor: "pointer",
                background: activeTab === tab ? COLORS.accent : COLORS.cardBgMuted,
                color: activeTab === tab ? "#fff" : COLORS.text
              }}>{tab.toUpperCase()}</button>
            ))}
          </nav>
        </div>
        {activeTab === "today" && <TodayView tasks={tasks} events={events} onSelectTask={setSelectedTask} />}
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
