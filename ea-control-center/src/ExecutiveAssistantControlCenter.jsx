import React, { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// EXECUTIVE ASSISTANT CONTROL CENTER - DYNAMIC HEIGHT VERSION
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",
  cardBg: "#FAFBFD",
  cardBgMuted: "#EEF1F5",
  text: "#2A3547",
  textSecondary: "#566175",
  borderColor: "rgba(42, 53, 71, 0.14)",
  accent: "#6B7FAB",
  accentDim: "rgba(107, 127, 171, 0.12)",
  critical: "#E6D4E1",
  criticalText: "#8C5E7F",
  sage: "#B5C3DA",
  slateBlue: "#C4CDE3",
};

const HOUR_HEIGHT = 90; // Increased for better readability
const DAY_START = 8;
const MAX_COLUMNS = 2;
const CLUSTER_GAP = 16; 

const SAMPLE_TASKS = [
  { id: "t1", title: "CEO Briefing: Westside Partners", time: "09:00 AM", status: "in-progress", category: "research" },
  { id: "t2", title: "Reschedule Vendor Meeting", time: "09:15 AM", status: "blocked", category: "scheduling" },
  { id: "t3", title: "Board Deck Final Review", time: "09:45 AM", status: "waiting", category: "operations" },
  { id: "t4", title: "Quarterly Expense Audit", time: "01:30 PM", status: "in-progress", category: "finance" },
  { id: "t5", title: "Emergency: Tech Support Sync", time: "01:45 PM", status: "blocked", category: "ops" },
];

const parseTimeToHours = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours + minutes / 60;
};

const TaskCard = ({ placement }) => {
  const { task, top, height, column, columnCount } = placement;
  const isBlocked = task.status === "blocked";

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: `${(column / columnCount) * 100}%`,
        width: `${(1 / columnCount) * 100}%`,
        height: height - 8,
        padding: "0 8px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div style={{
        background: isBlocked ? COLORS.critical : COLORS.cardBg,
        border: `1px solid ${isBlocked ? COLORS.criticalText : COLORS.borderColor}`,
        borderRadius: 10,
        height: "100%",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 12px rgba(42, 53, 71, 0.03)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4 }}>
          {task.time}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, lineHeight: 1.4, flex: 1 }}>
          {task.title}
        </div>
        <div style={{ 
          fontSize: 10, 
          textTransform: "uppercase", 
          letterSpacing: 0.8, 
          color: isBlocked ? COLORS.criticalText : COLORS.accent,
          fontWeight: 800,
          marginTop: 8
        }}>
          {task.status.replace("-", " ")}
        </div>
      </div>
    </div>
  );
};

const TodayView = ({ tasks }) => {
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
    };

    sorted.forEach(task => {
      const naturalTop = (parseTimeToHours(task.time) - DAY_START) * HOUR_HEIGHT;
      
      // If this task starts after the current cluster ends, flush it
      if (naturalTop >= clusterEnd && cluster.length) flush();

      let col = -1;
      for (let i = 0; i < MAX_COLUMNS; i++) {
        if (!cluster.some(p => p.column === i && naturalTop < p.top + p.height)) {
          col = i;
          break;
        }
      }

      const p = { task, top: naturalTop, height: 110, column: col };
      
      // THE FIX: If no columns are free, bump it below the cluster
      if (col === -1) {
        const lastBottom = Math.max(...cluster.map(c => c.top + c.height));
        p.top = lastBottom + CLUSTER_GAP;
        p.column = 0;
        flush(); 
      }
      
      cluster.push(p);
      clusterEnd = Math.max(clusterEnd, p.top + p.height);
    });
    
    flush();
    // Dynamically calculate the container height based on the bottom-most card
    const finalHeight = result.reduce((max, p) => Math.max(max, p.top + p.height), 0);
    return { placements: result, totalHeight: finalHeight + 100 };
  }, [tasks]);

  return (
    <div style={{ 
      position: "relative", 
      height: totalHeight, 
      background: COLORS.cardBgMuted, 
      borderRadius: 16, 
      border: `1px solid ${COLORS.borderColor}`,
      transition: "height 0.4s ease" 
    }}>
      {/* Time Markers */}
      {Array.from({ length: 11 }).map((_, i) => (
        <div key={i} style={{ 
          position: "absolute", 
          top: i * HOUR_HEIGHT, 
          width: "100%", 
          borderTop: `1px solid ${COLORS.borderColor}`, 
          display: "flex",
          alignItems: "flex-start",
          padding: "8px 12px"
        }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{i + DAY_START}:00</span>
        </div>
      ))}
      <div style={{ position: "relative", marginLeft: 60, height: "100%", padding: "0 12px" }}>
        {placements.map(p => <TaskCard key={p.task.id} placement={p} />)}
      </div>
    </div>
  );
};

const ExecutiveAssistantControlCenter = () => {
  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", padding: "60px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ color: COLORS.text, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Control Center</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 15, marginTop: 4 }}>Dynamic Operational Timeline</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>
          <TodayView tasks={SAMPLE_TASKS} />
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: COLORS.accent, color: "#FFF", padding: 24, borderRadius: 20, boxShadow: "0 10px 20px rgba(107, 127, 171, 0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 8, letterSpacing: 1 }}>SYSTEM LOAD</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>5 Active Tasks</div>
              <div style={{ marginTop: 16, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                <div style={{ width: "65%", height: "100%", background: "#FFF", borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
