import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------  
// Executive Assistant Control Center  
// Single-file React component designed to embed in a portfolio (portfolio.jsx).  
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

// ---------------------------------------------------------------------------  
// Utilities (FIXED: Midnight bug and Collision Logic)
// ---------------------------------------------------------------------------

const TODAY = "2026-04-17";
const DAY_START_HOUR = 8;  
const DAY_END_HOUR = 18;
const HOUR_HEIGHT = 68;
const MAX_COLUMNS = 2;

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

const estimateCompactTaskHeight = (task, columnCount = 1) => {
  const charsPerLine = columnCount === 1 ? 46 : 26;
  const titleLen = (task.title || "").length;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(titleLen / charsPerLine)));
  let h = 56 + titleLines * 18;
  const contextLine = columnCount > 1 ? 42 : 32;
  if (task.status === "blocked") h += contextLine;
  if (task.status === "waiting") h += contextLine;
  return h;
};

// FIXED: Collision-detection with "Flush and Push" logic
const computeTaskColumns = (tasks, heightOverrides = {}) => {
  const valid = tasks.filter((t) => parseTimeToHours(t.dueTime) !== null); 
  const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));
  
  const placements = [];
  let cluster = []; 
  let clusterBottom = 0;
  const CLUSTER_GAP = 8;

  sorted.forEach(task => {
    const idealTop = (parseTimeToHours(task.dueTime) - DAY_START_HOUR) * HOUR_HEIGHT;
    const h = heightOverrides[task.id] || estimateCompactTaskHeight(task, 1);

    if (idealTop >= clusterBottom) {
      cluster = [];
    }

    let col = cluster.findIndex(c => c.bottom <= idealTop);
    if (col === -1 && cluster.length < MAX_COLUMNS) {
      col = cluster.length;
    }

    if (col === -1) {
      const newTop = Math.max(idealTop, clusterBottom + CLUSTER_GAP);
      placements.push({ task, top: newTop, height: h, column: 0, columnCount: 1 });
      cluster = [{ bottom: newTop + h, column: 0 }];
      clusterBottom = newTop + h;
    } else {
      placements.push({ task, top: idealTop, height: h, column: col, columnCount: MAX_COLUMNS });
      if (cluster[col]) {
        cluster[col].bottom = idealTop + h;
      } else {
        cluster.push({ bottom: idealTop + h, column: col });
      }
      clusterBottom = Math.max(clusterBottom, idealTop + h);
    }
  });
  return placements;
};

// ---------------------------------------------------------------------------  
// Component Exports (Abbreviated Sample Data)
// ---------------------------------------------------------------------------

const STATUS_META = {
  "backlog":     { label: "Backlog",     color: COLORS.text, bg: COLORS.cardBgMuted, icon: "○" },
  "in-progress": { label: "In Progress", color: COLORS.text, bg: COLORS.sage, icon: "◐" },
  "waiting":     { label: "Waiting",     color: COLORS.text, bg: COLORS.slateBlue, icon: "◑" },
  "blocked":     { label: "Blocked",     color: COLORS.text, bg: COLORS.critical, icon: "◘" },
  "completed":   { label: "Completed",   color: COLORS.text, bg: "rgba(181, 195, 218, 0.45)", icon: "●" },
};

const TaskCard = ({ task, onSelect, compact }) => {
  const meta = STATUS_META[task.status] || STATUS_META.backlog;
  const isCompleted = task.status === "completed";
  
  return (
    <button
      onClick={() => onSelect?.(task)}
      style={{
        background: isCompleted ? COLORS.cardBgMuted : COLORS.cardBg,
        border: `1px solid ${COLORS.borderColor}`,
        borderLeft: `3px solid ${is
