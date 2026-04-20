import React, { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// EXECUTIVE ASSISTANT CONTROL CENTER - THE "ZERO OVERLAP" FIX
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",
  cardBg: "#FAFBFD",
  cardBgMuted: "#EEF1F5",
  text: "#2A3547",
  textSecondary: "#566175",
  borderColor: "rgba(42, 53, 71, 0.14)",
  accent: "#6B7FAB",
  critical: "#E6D4E1",
  criticalText: "#8C5E7F",
};

const HOUR_HEIGHT = 100; // More room for the eye to travel
const DAY_START = 8;
const MAX_COLUMNS = 2;
const CARD_HEIGHT = 110; 
const CLUSTER_GAP = 12;

const SAMPLE_TASKS = [
  { id: "t1", title: "CEO Briefing: Westside Partners", time: "09:00 AM", status: "in-progress" },
  { id: "t2", title: "Reschedule Vendor Meeting", time: "09:15 AM", status: "blocked" },
  { id: "t3", title: "Board Deck Final Review", time: "09:30 AM", status: "waiting" }, // Multiple collisions here
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
      padding: "6px",
      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
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
    let lastBottom = 0;

    sorted.forEach((task) => {
      const naturalTop = (parseTimeToHours(task.time) - DAY_START) * HOUR_HEIGHT;
      
      // Determine if this task needs to be "bumped" because the previous task hasn't finished yet
      // or if it should sit at its natural time slot.
      const actualTop = Math.max(naturalTop, lastBottom);
      
      // For this simple robust fix, we stack them in a single/double alternating flow 
      // to guarantee zero overlapping.
      const p = { 
        task, 
        top: actualTop, 
        column: result.length % 2 === 0 ? 0 : 1, 
        columnCount: 2 
      };

      // Update the "waterline" for the next task
      // If tasks are in the same row (col 0 and col 1), we only update lastBottom after col 1
      if (p.column === 1) {
        lastBottom = actualTop + CARD_HEIGHT + CLUSTER_GAP;
      } else if (sorted.indexOf(task) === sorted.length - 1) {
        // Last task edge case
        lastBottom = actualTop + CARD_HEIGHT + CLUSTER_GAP;
      }

      result.push(p);
    });

    return { placements: result, totalHeight: Math.max(800, lastBottom + 100) };
  }, [tasks]);

  return (
    <div style={{ position: "relative", height: totalHeight, background: COLORS.cardBgMuted, borderRadius: 20, border: `1px solid ${COLORS.borderColor}`, transition: "height 0.5s ease" }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", top: i * HOUR_HEIGHT, width: "100%", borderTop: `1px dashed ${COLORS.borderColor}`, padding: "10px 15px" }}>
          <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{i + DAY_START}:00</span>
        </div>
      ))}
      <div style={{ position: "relative", marginLeft: 60, height: "100%", paddingRight: 10 }}>
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
          <h1 style={{ color: COLORS.text, fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em" }}>System Control</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: 500 }}>Operational Flow • April 17, 2026</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "start" }}>
          <TodayView tasks={SAMPLE_TASKS} />
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 40 }}>
            <div style={{ background: COLORS.accent, color: "#FFF", padding: 28, borderRadius: 24, boxShadow: "0 12px 24px rgba(107, 127, 171, 0.25)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 8, letterSpacing: 1.5 }}>DAILY TARGET</div>
              <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>Resolve 2 Blocked Workflows</div>
            </div>

            <div style={{ background: COLORS.cardBg, padding: 24, borderRadius: 20, border: `1px solid ${COLORS.borderColor}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: COLORS.text }}>Legend</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.textSecondary }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.cardBg, border: `1px solid ${COLORS.borderColor}` }} /> Standard
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.textSecondary }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: COLORS.critical, border: `1px solid ${COLORS.criticalText}` }} /> Blocked / High Priority
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
