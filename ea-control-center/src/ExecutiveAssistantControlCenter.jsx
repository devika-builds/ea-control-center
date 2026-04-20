import React, { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// EXECUTIVE ASSISTANT CONTROL CENTER - THE "FINAL RESTORATION" FIX
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",      // Platinum mist
  cardBg: "#FAFBFD",          // Silk White
  cardBgMuted: "#EEF1F5",     // Cool ash
  text: "#2A3547",            // Navy Ink
  textSecondary: "#566175",   // Mid slate
  borderColor: "rgba(42, 53, 71, 0.14)",
  accent: "#6B7FAB",          // Liberty Blue
  critical: "#E6D4E1",        // Soft thistle
  criticalText: "#8C5E7F",    // Deep thistle
};

const HOUR_HEIGHT = 100;
const DAY_START = 8;
const CARD_HEIGHT = 120; // Fixed height for consistent stacking
const CLUSTER_GAP = 16;

const SAMPLE_TASKS = [
  { id: "t1", title: "CEO Briefing: Westside Partners", time: "09:00 AM", status: "in-progress" },
  { id: "t2", title: "Reschedule Vendor Meeting", time: "09:15 AM", status: "blocked" },
  { id: "t3", title: "Board Deck Final Review", time: "09:45 AM", status: "waiting" },
  { id: "t4", title: "Quarterly Expense Audit", time: "01:30 PM", status: "in-progress" },
  { id: "t5", title: "Emergency: Tech Support Sync", time: "01:45 PM", status: "blocked" },
];

const parseTimeToHours = (timeStr) => {
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours + minutes / 60;
};

const TaskCard = ({ placement }) => {
  const { task, top, column, columnCount } = placement;
  const isBlocked = task.status === "blocked";

  return (
    <div style={{
      position: "absolute",
      top,
      left: `${(column / columnCount) * 100}%`,
      width: `${(1 / columnCount) * 100}%`,
      height: CARD_HEIGHT,
      padding: "0 8px",
      transition: "all 0.4s ease",
    }}>
      <div style={{
        background: isBlocked ? COLORS.critical : COLORS.cardBg,
        border: `1px solid ${isBlocked ? COLORS.criticalText : COLORS.borderColor}`,
        borderRadius: 12,
        height: "100%",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 12px rgba(42, 53, 71, 0.04)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 4 }}>{task.time}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: isBlocked ? COLORS.criticalText : COLORS.accent, fontWeight: 800 }}>
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
    let currentCluster = [];
    let clusterWaterline = 0; // Tracks the physical bottom of the last placed row

    const flushCluster = () => {
      if (currentCluster.length === 0) return;
      const count = currentCluster.length;
      currentCluster.forEach((p, i) => {
        p.column = i;
        p.columnCount = count;
        result.push(p);
      });
      clusterWaterline = Math.max(...currentCluster.map(p => p.top + CARD_HEIGHT)) + CLUSTER_GAP;
      currentCluster = [];
    };

    sorted.forEach((task) => {
      const naturalTop = (parseTimeToHours(task.time) - DAY_START) * HOUR_HEIGHT;
      const actualTop = Math.max(naturalTop, clusterWaterline);

      // If cluster is full (2 tasks) or this task is significantly later, flush
      if (currentCluster.length === 2 || (currentCluster.length > 0 && actualTop > clusterWaterline + 20)) {
        flushCluster();
      }

      currentCluster.push({ task, top: actualTop });
    });

    flushCluster();
    const finalHeight = result.reduce((max, p) => Math.max(max, p.top + CARD_HEIGHT), 0);
    return { placements: result, totalHeight: Math.max(800, finalHeight + 60) };
  }, [tasks]);

  return (
    <div style={{ position: "relative", height: totalHeight, background: COLORS.cardBgMuted, borderRadius: 20, border: `1px solid ${COLORS.borderColor}` }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: i * HOUR_HEIGHT, width: "100%", borderTop: `1px solid ${COLORS.borderColor}`, padding: "10px 15px", opacity: 0.5 }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{i + DAY_START}:00</span>
        </div>
      ))}
      <div style={{ position: "relative", marginLeft: 60, height: "100%", paddingRight: 8, paddingTop: 10 }}>
        {placements.map(p => <TaskCard key={p.task.id} placement={p} />)}
      </div>
    </div>
  );
};

const ExecutiveAssistantControlCenter = () => {
  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", padding: "40px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: COLORS.text, fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em" }}>Control Center</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>Operational Flow • April 17, 2026</p>
        </div>

        {/* Main Grid Container */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
          
          {/* Left Column: The Timeline */}
          <TodayView tasks={SAMPLE_TASKS} />
          
          {/* Right Column: Bento Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 20 }}>
            <div style={{ background: COLORS.accent, color: "#FFF", padding: 24, borderRadius: 24, boxShadow: "0 10px 20px rgba(107, 127, 171, 0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 8, letterSpacing: 1.2 }}>PRIORITY FOCUS</div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>Finalize Board Deck Review before 11:00 AM</div>
            </div>

            <div style={{ background: COLORS.cardBg, padding: 24, borderRadius: 20, border: `1px solid ${COLORS.borderColor}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: COLORS.text }}>Operational Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{l: "Active", c: COLORS.accent, n: 3}, {l: "Blocked", c: COLORS.criticalText, n: 2}].map(item => (
                  <div key={item.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{item.l} Tasks</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: item.c }}>{item.n}</span>
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
