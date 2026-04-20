import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center
// Single-file React component designed to embed in a portfolio (portfolio.jsx).
// Styling is inline, matching the portfolio's COLORS palette. No external libs.
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#E4EAF0",      // Platinum mist — body
  cardBg: "#FAFBFD",          // Silk White — calendar grid / content
  cardBgMuted: "#EEF1F5",     // Cool ash — nested surfaces
  text: "#2A3547",            // Navy Ink — primary text
  textSecondary: "#566175",   // Mid slate — metadata
  borderColor: "rgba(42, 53, 71, 0.14)",
  borderStrong: "rgba(42, 53, 71, 0.32)",
  accent: "#6B7FAB",          // Liberty Blue — dusty periwinkle
  accentDim: "rgba(107, 127, 171, 0.18)",
  critical: "#E6D4E1",        // Soft thistle tint — backgrounds
  criticalBorder: "rgba(140, 94, 127, 0.55)",
  criticalText: "#8C5E7F",    // Deep thistle for text/icons
  sage: "#B5C3DA",            // Little Boy Blue — IN PROGRESS
  sageBorder: "rgba(74, 106, 148, 0.55)",
  slateBlue: "#C4CDE3",       // Thistle pastel — EXECUTIVE
  slateBlueBorder: "rgba(107, 127, 171, 0.55)",
};

const FONT_STACK = "'Inter', 'Geist', ui-sans-serif, system-ui, sans-serif";
const MONO_STACK = "'JetBrains Mono', 'Geist Mono', monospace";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  {
    id: "task-001",
    title: "Reschedule canceled vendor meetings",
    description: "CEO canceled Friday afternoon. Need to reschedule with Acme, TechVendor, and ServiceCo.",
    dueDate: "2026-04-17",
    dueTime: "11:00 AM",
    priority: "high",
    status: "in-progress",
    category: "scheduling",
    blockingTasks: ["task-005", "task-007"],
    progress: { done: 35, estimated: 90 },
  },
  {
    id: "task-002",
    title: "CEO briefing packet for 10am client call",
    description: "Prepare briefing for Westside Partners call.",
    dueDate: "2026-04-17",
    dueTime: "09:30 AM",
    priority: "high",
    status: "in-progress",
    category: "research",
    progress: { done: 60, estimated: 90 },
  },
  {
    id: "task-005",
    title: "Confirm rescheduled vendor meetings with CEO",
    dueTime: "12:30 PM",
    priority: "high",
    status: "blocked",
    category: "scheduling",
    blockedBy: ["task-001"],
  },
];

// ---------------------------------------------------------------------------
// Utilities & Core Logic
// ---------------------------------------------------------------------------

const TODAY = "2026-04-17";
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const HOUR_HEIGHT = 68;
const MAX_COLUMNS = 2;
const CLUSTER_GAP = 8;

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
  if (task.status === "blocked") h += 32;
  if (task.status === "waiting") h += 32;
  return h;
};

const computeTaskColumns = (tasks, heightOverrides) => {
  const valid = tasks.filter((t) => parseTimeToHours(t.dueTime) != null);
  const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));

  const placements = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const heightFor = (task, columnCount) => heightOverrides?.[task.id] || estimateCompactTaskHeight(task, columnCount);

  const repackCluster = () => {
    if (!cluster.length) return 0;
    const colCount = Math.max(...cluster.map(p => p.column)) + 1;
    let maxBottom = -Infinity;
    cluster.forEach(p => {
      p.height = heightFor(p.task, colCount);
      p.bottom = p.top + p.height;
      p.columnCount = colCount;
      if (p.bottom > maxBottom) maxBottom = p.bottom;
    });
    return maxBottom;
  };

  const flushCluster = () => {
    if (!cluster.length) return 0;
    const bottom = repackCluster();
    placements.push(...cluster);
    cluster = [];
    clusterEnd = -Infinity;
    return bottom;
  };

  sorted.forEach((task) => {
    const naturalTop = (parseTimeToHours(task.dueTime) - DAY_START_HOUR) * HOUR_HEIGHT;
    
    if (naturalTop >= clusterEnd) flushCluster();

    let targetColumn = -1;
    for (let i
