import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------  
// Executive Assistant Control Center — FULL SYSTEM REBUILD
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
  critical: "#E6D4E1",        
  criticalBorder: "rgba(140, 94, 127, 0.55)",  
  criticalText: "#8C5E7F",    
  sage: "#B5C3DA",            
  sageBorder: "rgba(74, 106, 148, 0.55)",  
  slateBlue: "#C4CDE3",       
  slateBlueBorder: "rgba(107, 127, 171, 0.55)",
};

const FONT_STACK = "'Inter', 'Geist', ui-sans-serif, system-ui, sans-serif";  
const MONO_STACK = "'JetBrains Mono', 'Geist Mono', monospace";

// --- Configuration & Constants ---
const TODAY = "2026-04-17";
const DAY_START_HOUR = 8;  
const DAY_END_HOUR = 18;
const HOUR_HEIGHT = 68;
const MAX_COLUMNS = 2;

// --- Logic Fixes ---

const parseTimeToHours = (timeStr) => {  
  if (!timeStr) return null;  
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);  
  if (!match) return null;  
  let hours = parseInt(match[1], 10);  
  const minutes = parseInt(match[2], 10);  
  const ampm = match[3].toUpperCase();  
  if (ampm === "PM" && hours !== 12) hours += 12;  
  if (ampm === "AM" && hours === 12) hours = 0;  
  return hours + minutes / 60;  
};

const estimateTaskHeight = (task, columnCount = 1) => {
  const charsPerLine = columnCount === 1 ? 46 : 26;
  const titleLen = (task.title || "").length;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(titleLen / charsPerLine)));
  let h = 56 + titleLines * 18;
  if (task.status === "blocked" || task.status === "waiting") h += 32;
  return h;
};

const computeTaskPlacements = (tasks, heightOverrides = {}) => {
  const valid = tasks.filter(t => parseTimeToHours(t.dueTime) !== null);
  const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));
  
  const placements = [];
  let lanes = Array(MAX_COLUMNS).fill(0); // Tracks vertical availability per column
  let clusterBottom = 0;
  const CLUSTER_GAP = 8;

  sorted.forEach(task => {
    const timeValue = parseTimeToHours(task.dueTime);
    const idealTop = (timeValue - DAY_START_HOUR) * HOUR_HEIGHT;
    const h = heightOverrides[task.id] || estimateTaskHeight(task, 1);

    // Find first available lane
    let col = lanes.findIndex(bottom => bottom <= idealTop);

    if (col === -1) {
      // Collision detected: Push below the highest current lane
      const currentMinBottom = Math.min(...lanes);
      const pushTop = Math.max(idealTop, currentMinBottom + CLUSTER_GAP);
      col = lanes.indexOf(currentMinBottom);
      
      placements.push({ task, top: pushTop, height: h, column: col, columnCount: MAX_COLUMNS });
      lanes[col] = pushTop + h;
    } else {
      placements.push({ task, top: idealTop, height: h, column: col, columnCount: MAX_COLUMNS });
      lanes[col] = idealTop + h;
    }
  });
  return placements;
};

// --- Sub-Components ---

const StatusBadge = ({ status }) => {
  const meta = {
    "backlog":     { label: "Backlog",     bg: COLORS.cardBgMuted, color: COLORS.textSecondary },
    "in-progress": { label: "In Progress", bg: COLORS.sage,        color: COLORS.text },
    "waiting":     { label: "Waiting",     bg: COLORS.slateBlue,   color: COLORS.text },
    "blocked":     { label: "Blocked",     bg: COLORS.critical,    color: COLORS.criticalText },
    "completed":   { label: "Completed",   bg: "rgba(107,127,171,0.1)", color: COLORS.textSecondary },
  }[status] || { label: status, bg: COLORS.cardBgMuted, color: COLORS.textSecondary };

  return (
    <span style={{
      fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "2px 6px",
      borderRadius: 4, background: meta.bg, color: meta.color, letterSpacing: 0.5
    }}>
      {meta.label}
    </span>
  );
};

const TaskCard = ({ task, style, isMeasured, onMeasure }) => {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (ref.current && !isMeasured) {
      onMeasure(task.id, ref.current.offsetHeight);
    }
  }, [task.id, isMeasured, onMeasure]);

  const isCompleted = task.status === "completed";

  return (
    <div ref={ref} style={{
      ...style,
      background: isCompleted ? COLORS.cardBgMuted : COLORS.cardBg,
      border: `1px solid ${COLORS.borderColor}`,
      borderLeft: `3px solid ${isCompleted ? COLORS.textSecondary : COLORS.accent}`,
      borderRadius: 6,
      padding: "12px 14px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      opacity: isCompleted ? 0.6 : 1,
