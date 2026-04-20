import React, { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Executive Assistant Control Center
// Single-file React component designed to embed in a portfolio (portfolio.jsx).
// Styling is inline, matching the portfolio's COLORS palette. No external libs.
// ---------------------------------------------------------------------------

// Heritage Silver — Executive Light Mode palette
// Cool register inspired by private-banking stationery: Platinum, Thistle,
// Liberty Blue, Little Boy Blue. Token names preserved from the prior Mineral
// & Paper palette for code stability (sage/slateBlue now hold cool pastels).
const COLORS = {
  // Surfaces
  background: "#E4EAF0",      // Platinum mist — body
  cardBg: "#FAFBFD",          // Silk White — calendar grid / content
  cardBgMuted: "#EEF1F5",     // Cool ash — nested surfaces

  // Typography & borders
  text: "#2A3547",            // Navy Ink — primary text (~12:1 on Silk White)
  textSecondary: "#566175",   // Mid slate — metadata, hints (~5.0:1 on Platinum body, AA)
  borderColor: "rgba(42, 53, 71, 0.14)",
  borderStrong: "rgba(42, 53, 71, 0.32)",

  // Accent (primary / active)
  accent: "#6B7FAB",          // Liberty Blue — dusty periwinkle
  accentDim: "rgba(107, 127, 171, 0.18)",

  // Critical / blocking
  critical: "#E6D4E1",        // Soft thistle tint — backgrounds
  criticalBorder: "rgba(140, 94, 127, 0.55)",
  criticalText: "#8C5E7F",    // Deep thistle for text/icons (~5.07:1 on white)

  // Pastel status tokens — cool register, still AA-compliant with Navy Ink
  sage: "#B5C3DA",            // Little Boy Blue — IN PROGRESS / SCHEDULING (~6.9:1)
  sageBorder: "rgba(74, 106, 148, 0.55)",
  slateBlue: "#C4CDE3",       // Thistle pastel — EXECUTIVE / informational (~7.5:1)
  slateBlueBorder: "rgba(107, 127, 171, 0.55)",

  // Semantic aliases (used throughout legacy code paths)
  success: "#B5C3DA",         // alias → little boy blue
  warning: "#6B7FAB",         // alias → liberty blue
  error: "#8C5E7F",           // alias → deep thistle
};

// Unified font stack — Inter / Geist with tabular-numeral fallback
const FONT_STACK =
  "'Inter', 'Geist', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
const MONO_STACK =
  "'JetBrains Mono', 'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  {
    id: "task-001",
    title: "Reschedule canceled vendor meetings",
    description:
      "CEO canceled Friday afternoon due to family emergency. Need to reschedule with: Acme Corp (2hr meeting), TechVendor Inc (1hr), ServiceCo (30min). Get 3 time slot options from each before confirming with CEO.",
    dueDate: "2026-04-17",
    dueTime: "11:00 AM",
    priority: "high",
    status: "in-progress",
    category: "scheduling",
    blockedBy: [],
    blockingTasks: ["task-005", "task-007"],
    tags: ["Scheduling", "Vendors", "CEO-dependent", "Urgent"],
    progress: { done: 35, estimated: 90 },
  },
  {
    id: "task-002",
    title: "CEO briefing packet for 10am client call",
    description:
      "Prepare briefing for call with Westside Partners (Series B investor follow-up). Include: company financials, last meeting notes, pending decisions list, their recent news clippings.",
    dueDate: "2026-04-17",
    dueTime: "09:30 AM",
    priority: "high",
    status: "in-progress",
    category: "research",
    blockedBy: [],
    blockingTasks: [],
    tags: ["Client", "Investor", "Briefing"],
    progress: { done: 60, estimated: 90 },
  },
  {
    id: "task-003",
    title: "Prepare board meeting agenda",
    description:
      "Compile agenda from CEO, CFO, COO. Format for 2-hour meeting. Need CEO approval before distributing to board.",
    dueDate: "2026-04-18",
    dueTime: "02:00 PM",
    priority: "high",
    status: "waiting",
    category: "executive",
    blockedBy: ["task-006"],
    blockingTasks: [],
    tags: ["Board", "Strategic"],
    waitingOn: "CFO's Q1 numbers via task-006",
  },
  {
    id: "task-005",
    title: "Confirm rescheduled vendor meetings with CEO",
    description:
      "Once you have 3 time slot options from each vendor, present to CEO with your recommendation. Wait for approval before confirming.",
    dueDate: "2026-04-17",
    dueTime: "12:30 PM",
    priority: "high",
    status: "blocked",
    category: "scheduling",
    blockedBy: ["task-001"],
    blockingTasks: ["task-007"],
    tags: ["Scheduling", "CEO-approval"],
  },
  {
    id: "task-006",
    title: "Follow up: CFO Q1 financial review for board",
    description:
      "Check in with CFO on status of Q1 financial review. Needed for board agenda.",
    dueDate: "2026-04-17",
    dueTime: "03:00 PM",
    priority: "high",
    status: "waiting",
    category: "executive",
    blockedBy: [],
    blockingTasks: ["task-003"],
    tags: ["Finance", "Board", "Follow-up"],
    waitingOn: "CFO to deliver Q1 numbers",
    followUpAction: "Slack CFO by 3pm, escalate to CEO if no response by EOD",
  },
  {
    id: "task-007",
    title: "Send calendar invites to vendors (rescheduled meetings)",
    description:
      "Once CEO approves rescheduled times, send calendar invites to Acme, TechVendor, ServiceCo with updated times and Zoom link.",
    dueDate: "2026-04-17",
    dueTime: "01:00 PM",
    priority: "high",
    status: "blocked",
    category: "scheduling",
    blockedBy: ["task-005"],
    blockingTasks: [],
    tags: ["Scheduling", "Calendar"],
  },
  // A few more tasks so the This Week view is interesting
  {
    id: "task-008",
    title: "Expense report reconciliation - March",
    description: "Reconcile CEO's AmEx against receipts for March close.",
    dueDate: "2026-04-20",
    dueTime: "05:00 PM",
    priority: "medium",
    status: "backlog",
    category: "admin",
    blockedBy: [],
    blockingTasks: [],
    tags: ["Finance", "Admin"],
  },
  {
    id: "task-009",
    title: "Book CEO travel to NYC investor meetings",
    description:
      "Flights, hotel (Lotte NY Palace), car service. Dates: Apr 22-24.",
    dueDate: "2026-04-18",
    dueTime: "12:00 PM",
    priority: "high",
    status: "in-progress",
    category: "scheduling",
    blockedBy: [],
    blockingTasks: [],
    tags: ["Travel", "CEO"],
    progress: { done: 20, estimated: 60 },
  },
  {
    id: "task-010",
    title: "Draft Q2 all-hands talking points",
    description: "Pull highlights from Q1 results and Q2 OKRs for CEO review.",
    dueDate: "2026-04-21",
    dueTime: "10:00 AM",
    priority: "medium",
    status: "backlog",
    category: "executive",
    blockedBy: [],
    blockingTasks: [],
    tags: ["All-hands", "Communications"],
  },
];

const SAMPLE_CALENDAR_EVENTS = [
  {
    id: "cal-004",
    title: "Focus Time: Briefing Prep",
    date: "2026-04-17",
    startTime: "08:00 AM",
    endTime: "09:30 AM",
    type: "focus",
    linkedTask: "task-002",
  },
  {
    id: "cal-001",
    title: "CEO Client Call - Westside Partners",
    date: "2026-04-17",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    type: "meeting",
    linkedTask: "task-002",
  },
  {
    id: "cal-002",
    title: "CEO Lunch",
    date: "2026-04-17",
    startTime: "12:00 PM",
    endTime: "01:00 PM",
    type: "personal",
    notes: "Hard stop - do not schedule during this time",
  },
  {
    id: "cal-003",
    title: "Board Meeting",
    date: "2026-04-18",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    type: "meeting",
    linkedTask: "task-003",
  },
];

const SAMPLE_NOTES = [
  {
    id: "note-001",
    title: "Westside Partners Meeting - Apr 17",
    date: "2026-04-17",
    content:
      "Q1 performance exceeded targets (+12% revenue). Series B close targeting May 15. Key milestones: 50 enterprise customers by June, $50M ARR by Sept.",
    actionItems: [
      "Send Q1 deck to investor relations contact",
      "Confirm Series B close date with CFO",
      "Add follow-up call to CEO's calendar week of May 5",
    ],
    linkedTasks: ["task-002"],
    linkedEvents: ["cal-001"],
  },
  {
    id: "note-002",
    title: "CFO Sync - Apr 15",
    date: "2026-04-15",
    content:
      "CFO said Q1 review is 80% done, auditors still reviewing revenue recognition on 2 deals. Committed to sending final numbers by EOD Thursday.",
    actionItems: [
      "Follow up with CFO by 3pm Thursday (see task-006)",
      "Escalate to CEO if numbers aren't in by Friday 9am",
    ],
    linkedTasks: ["task-006", "task-003"],
    linkedEvents: [],
  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const TODAY = "2026-04-17"; // The "perfect day" the spec is built around
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;

// Parse "09:30 AM" or "02:00 PM" into fractional hours (e.g. 14.0)
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

const formatHour = (h) => {
  const hour24 = Math.floor(h);
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:00 ${ampm}`;
};

// Pastel pill pattern — each status pairs a pastel background with Navy Ink text.
// `color` = text/border tone (used for chip outlines); `bg` = fill for solid pills.
// Every meta entry resolves to `{ bg, color }`. Per the global contrast rule,
// `color` is ALWAYS Navy Ink — text never inherits the pastel hue.
// `bg` carries the semantic pastel fill. `iconColor` (optional) lets tiny
// status dots use their tribe color without affecting label legibility.
const STATUS_META = {
  "backlog":     { label: "Backlog",     color: COLORS.text, bg: COLORS.cardBgMuted,              icon: "○", iconColor: COLORS.textSecondary },
  "in-progress": { label: "In Progress", color: COLORS.text, bg: COLORS.sage,                      icon: "◐", iconColor: COLORS.text },
  "waiting":     { label: "Waiting",     color: COLORS.text, bg: COLORS.slateBlue,                 icon: "◑", iconColor: COLORS.text },
  "blocked":     { label: "Blocked",     color: COLORS.text, bg: COLORS.critical,                  icon: "◘", iconColor: COLORS.criticalText },
  "completed":   { label: "Completed",   color: COLORS.text, bg: "rgba(181, 195, 218, 0.45)",      icon: "●", iconColor: COLORS.text },
};

const PRIORITY_META = {
  high:   { label: "HIGH", color: COLORS.text, bg: COLORS.critical },
  medium: { label: "MED",  color: COLORS.text, bg: COLORS.accentDim },
  low:    { label: "LOW",  color: COLORS.text, bg: COLORS.cardBgMuted },
};

// Active / scheduling → Little Boy Blue (sage token); Executive → Thistle
// (slateBlue token). Other categories pick neutral tones that live comfortably
// in the Heritage Silver palette. All text renders in Navy Ink for legibility.
const CATEGORY_META = {
  scheduling: { label: "Scheduling", color: COLORS.text, bg: COLORS.sage },
  executive:  { label: "Executive",  color: COLORS.text, bg: COLORS.slateBlue },
  research:   { label: "Research",   color: COLORS.text, bg: COLORS.accentDim },
  operations: { label: "Ops",        color: COLORS.text, bg: "rgba(181, 195, 218, 0.45)" },
  admin:      { label: "Admin",      color: COLORS.text, bg: COLORS.cardBgMuted },
};

// ---------------------------------------------------------------------------
// Primitive UI helpers
// ---------------------------------------------------------------------------

const Chip = ({ children, bg, color, borderColor }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      padding: "3px 8px",
      borderRadius: 4,
      background: bg || "transparent",
      color: color || COLORS.text,
      border: borderColor ? `1px solid ${borderColor}` : "none",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const SectionTitle = ({ children, right }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    <h3
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.textSecondary,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        margin: 0,
      }}
    >
      {children}
    </h3>
    {right}
  </div>
);

// ---------------------------------------------------------------------------
// Blocking / dependency helpers
// ---------------------------------------------------------------------------

const buildTaskIndex = (tasks) => {
  const index = {};
  tasks.forEach((t) => {
    index[t.id] = t;
  });
  return index;
};

// Given a root task, return the full set of downstream tasks (tasks that will
// slip if this one slips). Used for cascading-impact indicators.
const getDownstreamTaskIds = (rootId, taskIndex) => {
  const visited = new Set();
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop();
    const task = taskIndex[current];
    if (!task) continue;
    (task.blockingTasks || []).forEach((id) => {
      if (!visited.has(id)) {
        visited.add(id);
        stack.push(id);
      }
    });
  }
  return Array.from(visited);
};

// ---------------------------------------------------------------------------
// Task Card (used in timeline, sidebar, and week view)
// ---------------------------------------------------------------------------

const TaskCard = ({ task, taskIndex, onSelect, compact }) => {
  const statusMeta = STATUS_META[task.status] || STATUS_META.backlog;
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const categoryMeta = CATEGORY_META[task.category];

  const isBlocking = (task.blockingTasks || []).length > 0 && task.status !== "completed";
  const isBlocked = task.status === "blocked";
  const isWaiting = task.status === "waiting";
  const isCompleted = task.status === "completed";

  // Left border accent — communicates the task's state at a glance.
  let borderAccent = COLORS.borderStrong;
  if (isBlocking && !isBlocked) borderAccent = COLORS.criticalText;
  else if (isWaiting) borderAccent = COLORS.slateBlue;
  else if (isBlocked) borderAccent = COLORS.criticalText;
  else if (task.status === "in-progress") borderAccent = COLORS.accent;

  const blockedByTasks = (task.blockedBy || []).map((id) => taskIndex[id]).filter(Boolean);
  const blockingTasks = (task.blockingTasks || []).map((id) => taskIndex[id]).filter(Boolean);

  const pct = task.progress
    ? Math.min(100, Math.round((task.progress.done / task.progress.estimated) * 100))
    : null;

  // Render as a real <button> when interactive — gains tab order, Enter/Space
  // activation, focus-visible ring, and SR "button" role. Falls back to a <div>
  // when this card is used in a non-interactive context (e.g., drawer preview).
  const Wrapper = onSelect ? "button" : "div";
  const wrapperProps = onSelect
    ? {
        type: "button",
        onClick: () => onSelect(task),
        className: "eacc-task-card eacc-btn",
        "aria-label": `Task: ${task.title}. ${statusMeta.label}. Due ${task.dueTime}.`,
      }
    : {};
  return (
    <Wrapper
      {...wrapperProps}
      style={{
        background: isCompleted ? COLORS.cardBgMuted : COLORS.cardBg,
        border: `1px solid ${COLORS.borderColor}`,
        borderLeft: `3px solid ${borderAccent}`,
        borderRadius: 6,
        padding: compact ? 10 : 14,
        cursor: onSelect ? "pointer" : "default",
        opacity: isBlocked || isCompleted ? 0.82 : 1,
        position: "relative",
        transition: "transform 120ms ease, box-shadow 120ms ease",
        // Button reset — only needed when rendered as <button>
        font: "inherit",
        color: "inherit",
        textAlign: "left",
        width: "100%",
        display: "block",
      }}
      onMouseEnter={(e) => {
        if (onSelect) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = `0 6px 18px rgba(42, 53, 71, 0.10)`;
        }
      }}
      onMouseLeave={(e) => {
        if (onSelect) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: compact ? 13 : 14,
              color: COLORS.text,
              textDecoration: isCompleted ? "line-through" : "none",
              marginBottom: 4,
              letterSpacing: -0.1,
            }}
          >
            {task.title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            <Chip bg={priorityMeta.bg} color={COLORS.text}>
              {priorityMeta.label}
            </Chip>
            <Chip bg={statusMeta.bg} color={COLORS.text}>
              <span style={{ color: statusMeta.iconColor || COLORS.text }}>{statusMeta.icon}</span>{" "}
              {statusMeta.label}
            </Chip>
            {categoryMeta && (
              <Chip bg={categoryMeta.bg} color={COLORS.text}>
                {categoryMeta.label}
              </Chip>
            )}
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            color: COLORS.textSecondary,
            fontSize: 12,
            whiteSpace: "nowrap",
            fontFamily: MONO_STACK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {task.dueTime}
        </div>
      </div>

      {!compact && task.description && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: COLORS.textSecondary,
            lineHeight: 1.5,
          }}
        >
          {task.description}
        </div>
      )}

      {/* Progress bar for in-progress tasks */}
      {pct !== null && !compact && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              ◐ {task.progress.done}/{task.progress.estimated} min
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
          </div>
          <div style={{ height: 4, background: COLORS.borderColor, borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: COLORS.accent,
                transition: "width 300ms ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Blocking indicator */}
      {isBlocking && !isBlocked && blockingTasks.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 4,
            background: COLORS.critical,
            border: `1px solid ${COLORS.criticalBorder}`,
            fontSize: 11,
            color: COLORS.text,
          }}
        >
          <span style={{ color: COLORS.criticalText, fontWeight: 700 }}>●</span>{" "}
          <span style={{ color: COLORS.text, fontWeight: 700 }}>BLOCKING:</span>{" "}
          {blockingTasks.map((t, i) => (
            <span key={t.id} style={{ color: COLORS.text }}>
              {t.title}
              {i < blockingTasks.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}

      {/* Blocked-by indicator */}
      {isBlocked && blockedByTasks.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 4,
            background: COLORS.cardBgMuted,
            border: `1px dashed ${COLORS.borderStrong}`,
            fontSize: 11,
            color: COLORS.text,
          }}
        >
          <span style={{ fontWeight: 700, color: COLORS.criticalText }}>◘</span>{" "}
          <span style={{ fontWeight: 700, color: COLORS.text }}>Waiting on:</span>{" "}
          {blockedByTasks.map((t, i) => (
            <span key={t.id} style={{ color: COLORS.text }}>
              {t.title}
              {i < blockedByTasks.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}

      {/* Waiting (external) indicator */}
      {isWaiting && (
        <div
          style={{
            marginTop: 10,
            padding: 8,
            borderRadius: 4,
            background: "rgba(122, 154, 171, 0.18)",
            border: `1px solid ${COLORS.slateBlueBorder}`,
            fontSize: 11,
            color: COLORS.text,
          }}
        >
          <div>
            <span style={{ color: COLORS.text, fontWeight: 700 }}>◑</span>{" "}
            <span style={{ color: COLORS.text, fontWeight: 700 }}>WAITING ON:</span>{" "}
            <span style={{ color: COLORS.text }}>{task.waitingOn || "external input"}</span>
          </div>
          {task.followUpAction && (
            <div style={{ marginTop: 6, color: COLORS.text }}>
              <span style={{ fontWeight: 600 }}>→ Follow-up:</span> {task.followUpAction}
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
};

// ---------------------------------------------------------------------------
// Timeline row (calendar event or task block)
// ---------------------------------------------------------------------------

const HOUR_HEIGHT = 68; // px per hour slot
const HOURS_SPAN = DAY_END_HOUR - DAY_START_HOUR;

// Shared horizontal grid lines (each lane renders its own set)
const HourGridLines = () => {
  const lines = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) {
    lines.push(
      <div
        key={h}
        style={{
          position: "absolute",
          top: (h - DAY_START_HOUR) * HOUR_HEIGHT,
          left: 0,
          right: 0,
          borderTop: `1px solid ${COLORS.borderColor}`,
        }}
      />
    );
  }
  return <>{lines}</>;
};

const EventBlock = ({ event }) => {
  const start = parseTimeToHours(event.startTime);
  const end = parseTimeToHours(event.endTime);
  if (start == null || end == null) return null;

  const top = (start - DAY_START_HOUR) * HOUR_HEIGHT;
  const height = Math.max(40, (end - start) * HOUR_HEIGHT - 6);

  // Mineral & Paper tints — each event type gets a pastel wash backed by a
  // stronger border in the same family for anchoring.
  const palette = {
    meeting: {
      bg: "rgba(107, 127, 171, 0.14)",
      border: COLORS.accent,
      chipBg: COLORS.accentDim,
      chipColor: COLORS.text,
      label: "MEETING",
    },
    focus: {
      bg: "rgba(181, 195, 218, 0.28)",
      border: COLORS.sage,
      chipBg: COLORS.sage,
      chipColor: COLORS.text,
      label: "FOCUS",
    },
    personal: {
      bg: "rgba(239, 213, 206, 0.55)",
      border: COLORS.criticalBorder,
      chipBg: COLORS.critical,
      chipColor: COLORS.criticalText,
      label: "HARD STOP",
    },
  }[event.type] || {
    bg: COLORS.cardBgMuted,
    border: COLORS.borderStrong,
    chipBg: COLORS.cardBgMuted,
    chipColor: COLORS.text,
    label: "EVENT",
  };

  return (
    <div
      className="eacc-event"
      style={{
        position: "absolute",
        left: 4,
        right: 4,
        top,
        height,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderLeft: `3px solid ${palette.border}`,
        borderRadius: 6,
        padding: "8px 12px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.text }}>{event.title}</div>
        <Chip bg={palette.chipBg} color={palette.chipColor}>
          {palette.label}
        </Chip>
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.textSecondary,
          marginTop: 4,
          fontFamily: MONO_STACK,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {event.startTime} – {event.endTime}
      </div>
      {event.notes && (
        <div style={{ fontSize: 11, color: COLORS.text, marginTop: 4, fontStyle: "italic", opacity: 0.82 }}>
          {event.notes}
        </div>
      )}
    </div>
  );
};

// Hard cap on side-by-side packing. Beyond 2 columns, cards become unreadable
// (titles wrap word-by-word). A third task that can't fit in a 2-column cluster
// is pushed DOWN below the cluster instead of being squeezed into a third lane.
const MAX_COLUMNS = 2;

// Estimate a compact task card's rendered height so deadline blocks occupy
// an appropriate slice of the timeline even when no explicit duration exists.
// `columnCount` accounts for side-by-side packing: when cards are at 50 %
// width their context lines wrap more, but not as dramatically as at 33 %.
const estimateCompactTaskHeight = (task, columnCount = 1) => {
  // Char budget per line at compact 13px. Softer ramp than the 3-column-era
  // estimator: 46 chars at col=1, ~26 at col=2. Title lines capped at 3.
  const charsPerLine = columnCount === 1 ? 46 : 26;
  const titleLen = (task.title || "").length;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(titleLen / charsPerLine)));

  // Base: header row (title) + chip row + padding.
  let h = 56 + titleLines * 18;

  const isBlocked = task.status === "blocked";
  const isWaiting = task.status === "waiting";
  const isBlocking =
    (task.blockingTasks || []).length > 0 && !isBlocked && task.status !== "completed";

  // Context lines (BLOCKING / WAITING ON / follow-up) wrap a bit more at 50%
  // width but not catastrophically — small penalty only.
  const contextLine = columnCount > 1 ? 42 : 32;

  if (isBlocking) h += contextLine;
  if (isBlocked && (task.blockedBy || []).length > 0) h += contextLine;
  if (isWaiting) {
    h += contextLine;
    if (task.followUpAction) h += columnCount > 1 ? 28 : 22;
  }
  return h;
};

// Collision-detection column assignment with a MAX_COLUMNS=2 hard cap.
//
// Each task occupies a vertical slice from its due-time top to top + estimated
// height. Overlapping tasks pack side-by-side into adjacent columns — but
// never more than MAX_COLUMNS (=2). If a third task would be needed, we
// *flush* the current cluster and start a new one immediately below it, so
// the task moves DOWN the timeline rather than being squeezed into a third
// unreadable lane.
//
// Algorithm:
//   1. Sort tasks by due time (idealTop).
//   2. For each task: if it starts after the current cluster's repacked
//      bottom, flush. Otherwise, try to place it in column 0 or 1.
//   3. If both columns are occupied → flush cluster, bump the task's top to
//      `flushedBottom + gap`, start a fresh cluster at column 0.
//   4. After each insertion, repack the cluster so the next iteration's
//      overlap test uses width-accurate heights.
//
// Returns: { placements: [{ task, top, height, column, columnCount }], totalHeight }
// `heightOverrides` is an optional map of taskId → actual DOM-measured height in px.
// When provided, it takes priority over the estimate — the estimate is only used for
// the very first render (before measurement has happened) and as a fallback for any
// task not yet present in the override map.
const computeTaskColumns = (tasks, heightOverrides) => {
  const valid = tasks.filter((t) => parseTimeToHours(t.dueTime) != null);
  const sorted = [...valid].sort(
    (a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime)
  );

  const CLUSTER_GAP = 8; // vertical gutter between an ejected task and the flushed cluster above

  const heightFor = (task, columnCount) => {
    const measured = heightOverrides && heightOverrides[task.id];
    if (measured != null && measured > 0) return measured;
    return estimateCompactTaskHeight(task, columnCount);
  };

  // Helper: build a slice for the given columnCount. `forcedTop` lets us bump
  // a task below its natural due-time position when it's been ejected.
  const makeSlice = (task, columnCount, forcedTop) => {
    const naturalTop = (parseTimeToHours(task.dueTime) - DAY_START_HOUR) * HOUR_HEIGHT;
    const top = forcedTop != null ? forcedTop : naturalTop;
    const height = heightFor(task, columnCount);
    return { task, top, bottom: top + height, height };
  };

  const placements = [];
  let cluster = []; // [{ task, top, bottom, height, column }]
  let clusterEnd = -Infinity; // max bottom in cluster, AFTER repack

  // Repack: once we know cluster.length and max column, recompute heights
  // with the proper columnCount and refresh bottom/clusterEnd.
  const repackCluster = () => {
    if (!cluster.length) return 0;
    const columnCount = Math.max(...cluster.map((p) => p.column)) + 1;
    let maxBottom = -Infinity;
    cluster.forEach((p) => {
      p.height = heightFor(p.task, columnCount);
      p.bottom = p.top + p.height;
      p.columnCount = columnCount;
      if (p.bottom > maxBottom) maxBottom = p.bottom;
    });
    return maxBottom;
  };

  // Flush returns the cluster's bottom edge so the caller can position
  // anything being ejected just below it.
  const flushCluster = () => {
    if (!cluster.length) return 0;
    const bottom = repackCluster();
    placements.push(...cluster);
    cluster = [];
    clusterEnd = -Infinity;
    return bottom;
  };

  sorted.forEach((task) => {
    const s = makeSlice(task, 1);
    // If this task starts after the current cluster's (repacked) bottom, the
    // previous cluster is complete — flush it.
    if (s.top >= clusterEnd) {
      flushCluster();
    }
    // Find lowest free column within the MAX_COLUMNS cap.
    const columnEnds = {};
    cluster.forEach((p) => {
      columnEnds[p.column] = Math.max(columnEnds[p.column] ?? -Infinity, p.bottom);
    });
    let column = 0;
    while (column < MAX_COLUMNS && (columnEnds[column] ?? -Infinity) > s.top) {
      column += 1;
    }

    if (column < MAX_COLUMNS) {
      // Fits in-cluster at this column.
      cluster.push({ ...s, column });
      clusterEnd = repackCluster();
    } else {
      // All columns occupied → eject: flush this cluster and drop the task
      // into a fresh cluster starting just below the flushed bottom.
      const flushedBottom = flushCluster();
      const bumpedTop = Math.max(s.top, flushedBottom + CLUSTER_GAP);
      const bumped = makeSlice(task, 1, bumpedTop);
      cluster.push({ ...bumped, column: 0 });
      clusterEnd = repackCluster();
    }
  });
  flushCluster();

  const totalHeight = placements.reduce((m, p) => Math.max(m, p.bottom), 0);
  return { placements, totalHeight };
};

// Renders a single task card into its assigned column. Uses calc() so the
// N cards in a cluster evenly divide the lane width, minus a small gutter.
// The wrapper is allowed to grow to its natural content height; `cardRef` lets
// the parent lane measure the true rendered height and feed it back into the
// column-assignment pass so cards never overlap.
const TaskColumnBlock = ({ task, taskIndex, onSelect, top, column, columnCount, cardRef }) => {
  const gapPx = 6;
  const widthCalc = `calc((100% - ${gapPx * (columnCount - 1)}px) / ${columnCount})`;
  const leftCalc = `calc((${widthCalc} + ${gapPx}px) * ${column})`;

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        top,
        left: leftCalc,
        width: widthCalc,
      }}
    >
      {columnCount > 1 && (
        <div
          aria-hidden="true"
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: COLORS.textSecondary,
            opacity: 0.75,
            marginBottom: 2,
            fontFamily: MONO_STACK,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {column + 1}/{columnCount}
        </div>
      )}
      <TaskCard task={task} taskIndex={taskIndex} onSelect={onSelect} compact />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Task timeline lane with two-pass DOM measurement
// ---------------------------------------------------------------------------
//
// On first render we lay out cards using estimated heights from
// `estimateCompactTaskHeight`. After React commits the DOM, `useLayoutEffect`
// measures each card's actual `offsetHeight`, stores them in state, and the
// component re-renders with `computeTaskColumns` now using the measurements.
// This happens before paint, so the user never sees the unmeasured pass —
// but it guarantees that no card overlaps a neighbour or overflows the lane,
// regardless of how much BLOCKING/WAITING/follow-up content a card contains.
//
// Guard against oscillation: only call setState when at least one measurement
// differs from the current record by more than 2px.
const TaskTimelineLane = ({ todaysTasks, taskIndex, onSelectTask, baseHeight, emptyLabel }) => {
  const [measured, setMeasured] = useState({});
  const cardRefs = useRef(new Map());

  const stack = useMemo(
    () => computeTaskColumns(todaysTasks, measured),
    [todaysTasks, measured]
  );

  const laneHeight = Math.max(baseHeight, stack.totalHeight + 8);

  useLayoutEffect(() => {
    const next = {};
    let changed = false;
    cardRefs.current.forEach((el, taskId) => {
      if (!el) return;
      const h = el.offsetHeight;
      if (h > 0) {
        next[taskId] = h;
        const prev = measured[taskId];
        if (prev == null || Math.abs(prev - h) > 2) changed = true;
      }
    });
    // Drop measurements for tasks no longer rendered.
    Object.keys(measured).forEach((k) => {
      if (!(k in next)) changed = true;
    });
    if (changed) setMeasured(next);
    // Depending on stack.placements keeps this effect in sync with layout.
  }, [stack.placements, measured]);

  return (
    <div style={{ position: "relative", height: laneHeight }}>
      <HourGridLines />
      {stack.placements.map((p) => (
        <TaskColumnBlock
          key={p.task.id}
          task={p.task}
          taskIndex={taskIndex}
          onSelect={onSelectTask}
          top={p.top}
          column={p.column}
          columnCount={p.columnCount}
          cardRef={(el) => {
            if (el) cardRefs.current.set(p.task.id, el);
            else cardRefs.current.delete(p.task.id);
          }}
        />
      ))}
      {stack.placements.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 8,
            fontSize: 11,
            color: COLORS.textSecondary,
            fontStyle: "italic",
          }}
        >
          {emptyLabel || "No task deadlines today."}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Blocking Alert (top of Today view)
// ---------------------------------------------------------------------------

const BlockingAlert = ({ alertTask, downstreamCount, minutesRemaining }) => {
  if (!alertTask) return null;
  const timeText =
    minutesRemaining == null
      ? "due today"
      : minutesRemaining < 0
      ? `${Math.abs(minutesRemaining)} min overdue`
      : minutesRemaining < 60
      ? `${minutesRemaining} min remaining`
      : `${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m remaining`;

  return (
    <div
      className="eacc-alert"
      style={{
        background: COLORS.critical,
        border: `1px solid ${COLORS.criticalBorder}`,
        borderLeft: `4px solid ${COLORS.criticalText}`,
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1, color: COLORS.criticalText, fontWeight: 700 }}>◆</div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: COLORS.text,
            textTransform: "uppercase",
          }}
        >
          Blocking Alert
        </div>
        <div style={{ fontSize: 14, color: COLORS.text, marginTop: 4 }}>
          <strong>{alertTask.title}</strong>{" "}
          <span style={{ fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums", color: COLORS.text, opacity: 0.72 }}>
            (due {alertTask.dueTime})
          </span>{" "}
          blocks{" "}
          <strong style={{ color: COLORS.text, textDecoration: `underline ${COLORS.criticalText}` }}>
            {downstreamCount} downstream {downstreamCount === 1 ? "task" : "tasks"}
          </strong>
          .
        </div>
        <div style={{ fontSize: 12, color: COLORS.text, marginTop: 4 }}>
          Only{" "}
          <strong
            style={{
              color: COLORS.text,
              fontFamily: MONO_STACK,
              fontVariantNumeric: "tabular-nums",
              textDecoration: `underline ${COLORS.criticalText}`,
            }}
          >
            {timeText}
          </strong>{" "}
          — if this slips, the entire vendor rescheduling chain slides to tomorrow.
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Today View
// ---------------------------------------------------------------------------

const TodayView = ({ tasks, events, taskIndex, onSelectTask }) => {
  const todaysTasks = useMemo(() => tasks.filter((t) => t.dueDate === TODAY), [tasks]);
  const todaysEvents = useMemo(() => events.filter((e) => e.date === TODAY), [events]);

  const counts = useMemo(() => {
    const c = { "in-progress": 0, waiting: 0, blocked: 0, completed: 0, backlog: 0 };
    todaysTasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
    });
    return c;
  }, [todaysTasks]);

  // Alert: the task with the most downstream impact due today
  const alert = useMemo(() => {
    let best = null;
    todaysTasks.forEach((t) => {
      if (t.status === "completed") return;
      const downstream = getDownstreamTaskIds(t.id, taskIndex);
      if (downstream.length === 0) return;
      if (!best || downstream.length > best.downstream.length) {
        best = { task: t, downstream };
      }
    });
    return best;
  }, [todaysTasks, taskIndex]);

  // Simulated "now" – the spec is set to Apr 17, 2026; we pin ~09:55am for demo.
  const simulatedNowHours = 9 + 55 / 60;

  let minutesRemaining = null;
  if (alert) {
    const due = parseTimeToHours(alert.task.dueTime);
    if (due != null) minutesRemaining = Math.round((due - simulatedNowHours) * 60);
  }

  // Overdue / at-risk for sidebar
  const atRisk = useMemo(() => {
    return todaysTasks.filter((t) => {
      if (t.status === "completed") return false;
      const due = parseTimeToHours(t.dueTime);
      if (due == null) return false;
      return due <= simulatedNowHours + 0.5 && t.status !== "completed";
    });
  }, [todaysTasks, simulatedNowHours]);

  const waitingTasks = todaysTasks.filter((t) => t.status === "waiting");

  return (
    <div>
      {/* Header strip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>
            Thursday, April 17, 2026
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
            {counts["in-progress"] || 0} in-progress · {counts.waiting || 0} waiting · {counts.blocked || 0} blocked · {counts.completed || 0} completed
          </div>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
          Simulated time:{" "}
          <span
            style={{
              color: COLORS.text,
              fontFamily: MONO_STACK,
              fontVariantNumeric: "tabular-nums",
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 3,
              border: `1px solid ${COLORS.accent}`,
              background: COLORS.accentDim,
            }}
          >
            9:55 AM
          </span>
        </div>
      </div>

      <BlockingAlert
        alertTask={alert?.task}
        downstreamCount={alert?.downstream.length || 0}
        minutesRemaining={minutesRemaining}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.2fr) minmax(260px, 1fr)",
          gap: 16,
        }}
      >
        {/* Timeline */}
        <div
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: 8,
            padding: 16,
          }}
        >
          <SectionTitle>Timeline — 8 AM to 6 PM</SectionTitle>

          {/* Lane headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr 1fr",
              gap: 8,
              marginBottom: 6,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              color: COLORS.textSecondary,
            }}
          >
            <div />
            <div>Calendar</div>
            <div>Task Deadlines</div>
          </div>

          {(() => {
            const stack = computeTaskColumns(todaysTasks);
            const baseHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT + 8;
            const laneHeight = Math.max(baseHeight, stack.totalHeight + 8);

            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr 1fr",
                  gap: 8,
                }}
              >
                {/* Hour labels */}
                <div style={{ position: "relative", height: laneHeight }}>
                  {Array.from(
                    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
                    (_, i) => {
                      const h = DAY_START_HOUR + i;
                      const ampm = h >= 12 ? "PM" : "AM";
                      const hour12 = h % 12 === 0 ? 12 : h % 12;
                      return (
                        <div
                          key={h}
                          style={{
                            position: "absolute",
                            top: i * HOUR_HEIGHT - 6,
                            right: 6,
                            fontSize: 10,
                            fontFamily: MONO_STACK,
                            fontVariantNumeric: "tabular-nums",
                            color: COLORS.textSecondary,
                            letterSpacing: 0.4,
                          }}
                        >
                          {hour12} {ampm}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Events lane */}
                <div
                  style={{
                    position: "relative",
                    height: laneHeight,
                    borderRight: `1px dashed ${COLORS.borderColor}`,
                    paddingRight: 4,
                  }}
                >
                  <HourGridLines />
                  {todaysEvents.map((e) => (
                    <EventBlock key={e.id} event={e} />
                  ))}
                  {todaysEvents.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 8,
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontStyle: "italic",
                      }}
                    >
                      No events scheduled.
                    </div>
                  )}
                </div>

                {/* Task deadlines lane */}
                <div style={{ position: "relative", height: laneHeight }}>
                  <HourGridLines />
                  {stack.placements.map((p) => (
                    <TaskColumnBlock
                      key={p.task.id}
                      task={p.task}
                      taskIndex={taskIndex}
                      onSelect={onSelectTask}
                      top={p.top}
                      height={p.height}
                      column={p.column}
                      columnCount={p.columnCount}
                    />
                  ))}
                  {stack.placements.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 8,
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontStyle: "italic",
                      }}
                    >
                      No task deadlines today.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <SectionTitle>At Risk / Overdue</SectionTitle>
            {atRisk.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Nothing at risk right now — nice.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {atRisk.map((t) => (
                  <TaskCard key={t.id} task={t} taskIndex={taskIndex} compact onSelect={onSelectTask} />
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: 8,
              padding: 16,
            }}
          >
            <SectionTitle>Waiting On Others</SectionTitle>
            {waitingTasks.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                No open "waiting" items today.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {waitingTasks.map((t) => (
                  <TaskCard key={t.id} task={t} taskIndex={taskIndex} compact onSelect={onSelectTask} />
                ))}
              </div>
            )}
          </div>

          <QuickAdd />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Quick Add (sidebar)
// ---------------------------------------------------------------------------

const QuickAdd = () => {
  const [text, setText] = useState("");
  const [flash, setFlash] = useState(false);

  const submit = useCallback(() => {
    if (!text.trim()) return;
    setFlash(true);
    setText("");
    setTimeout(() => setFlash(false), 900);
  }, [text]);

  return (
    <div
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${flash ? COLORS.success : COLORS.borderColor}`,
        borderRadius: 8,
        padding: 16,
        transition: "border-color 300ms ease",
      }}
    >
      <SectionTitle>Quick Add</SectionTitle>
      <label htmlFor="eacc-quick-add-input" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}>
        Quick add task
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          id="eacc-quick-add-input"
          aria-label="Quick add task"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Email John re: contract"
          style={{
            flex: 1,
            background: COLORS.background,
            border: `1px solid ${COLORS.borderStrong}`,
            borderRadius: 4,
            color: COLORS.text,
            padding: "10px 12px",
            fontSize: 13,
            outline: "none",
            minHeight: 44,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = COLORS.borderStrong)}
        />
        <button
          type="button"
          className="eacc-quickadd-btn eacc-btn"
          onClick={submit}
          style={{
            background: COLORS.accentDim,
            color: COLORS.text,
            border: `1px solid ${COLORS.accent}`,
            borderRadius: 4,
            padding: "10px 18px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(42, 53, 71, 0.12)",
            minHeight: 44,
          }}
        >
          Add
        </button>
      </div>
      {flash && (
        <div style={{ fontSize: 11, color: COLORS.text, marginTop: 8, fontWeight: 600 }}>
          ✓ Added to backlog
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// This Week view — bottleneck detection
// ---------------------------------------------------------------------------

const WEEK_DAYS = [
  { key: "2026-04-17", label: "Thu", dateLabel: "Apr 17" },
  { key: "2026-04-18", label: "Fri", dateLabel: "Apr 18" },
  { key: "2026-04-19", label: "Sat", dateLabel: "Apr 19" },
  { key: "2026-04-20", label: "Mon", dateLabel: "Apr 20" },
  { key: "2026-04-21", label: "Tue", dateLabel: "Apr 21" },
];

const WeekView = ({ tasks, taskIndex, onSelectTask }) => {
  const byDay = useMemo(() => {
    const map = {};
    WEEK_DAYS.forEach((d) => (map[d.key] = []));
    tasks.forEach((t) => {
      if (map[t.dueDate]) map[t.dueDate].push(t);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (parseTimeToHours(a.dueTime) || 0) - (parseTimeToHours(b.dueTime) || 0))
    );
    return map;
  }, [tasks]);

  const maxCount = Math.max(1, ...Object.values(byDay).map((d) => d.length));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>
            This Week
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
            Bird's-eye view — spot bottlenecks and redistribute work.
          </div>
        </div>
      </div>

      {/* Bottleneck bar chart */}
      <div
        style={{
          background: COLORS.cardBg,
          border: `1px solid ${COLORS.borderColor}`,
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <SectionTitle>Load by Day</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${WEEK_DAYS.length}, 1fr)`, gap: 12 }}>
          {WEEK_DAYS.map((d) => {
            const count = byDay[d.key].length;
            const overloaded = count >= 5;
            return (
              <div key={d.key} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 6 }}>
                  {d.label} {d.dateLabel}
                </div>
                <div
                  style={{
                    height: 70,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      height: `${(count / maxCount) * 100}%`,
                      background: overloaded ? COLORS.criticalText : COLORS.accent,
                      borderRadius: 3,
                      minHeight: count > 0 ? 6 : 0,
                      transition: "height 300ms ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: COLORS.text,
                    fontWeight: 700,
                    marginTop: 6,
                  }}
                >
                  {count} {count === 1 ? "task" : "tasks"}
                </div>
                {overloaded && (
                  <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2, fontWeight: 600, letterSpacing: 0.4 }}>
                    <span style={{ color: COLORS.criticalText }}>◆</span> Overloaded
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day-by-day list */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${WEEK_DAYS.length}, minmax(0, 1fr))`, gap: 12 }}>
        {WEEK_DAYS.map((d) => (
          <div
            key={d.key}
            style={{
              background: COLORS.cardBg,
              border: `1px solid ${COLORS.borderColor}`,
              borderRadius: 8,
              padding: 12,
              minHeight: 200,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: `1px solid ${COLORS.borderColor}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{d.label}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{d.dateLabel}</div>
            </div>
            {byDay[d.key].length === 0 ? (
              <div style={{ fontSize: 11, color: COLORS.textSecondary, fontStyle: "italic" }}>
                No tasks
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {byDay[d.key].map((t) => (
                  <TaskCard key={t.id} task={t} taskIndex={taskIndex} compact onSelect={onSelectTask} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Calendar view
// ---------------------------------------------------------------------------

const CalendarView = ({ events, tasks, taskIndex }) => {
  const byDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      map[e.date] = map[e.date] || [];
      map[e.date].push(e);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (parseTimeToHours(a.startTime) || 0) - (parseTimeToHours(b.startTime) || 0))
    );
    return map;
  }, [events]);

  const dates = Object.keys(byDate).sort();

  // Available slots (naive): on TODAY, surface the gaps between events inside 8am-6pm
  const availableSlotsToday = useMemo(() => {
    const todaysEvents = (byDate[TODAY] || []).slice().sort(
      (a, b) => parseTimeToHours(a.startTime) - parseTimeToHours(b.startTime)
    );
    const slots = [];
    let cursor = DAY_START_HOUR;
    todaysEvents.forEach((e) => {
      const s = parseTimeToHours(e.startTime);
      const end = parseTimeToHours(e.endTime);
      if (s > cursor + 0.25) slots.push({ start: cursor, end: s });
      cursor = Math.max(cursor, end);
    });
    if (cursor < DAY_END_HOUR) slots.push({ start: cursor, end: DAY_END_HOUR });
    return slots.filter((s) => s.end - s.start >= 0.5);
  }, [byDate]);

  const formatSlotTime = (h) => {
    const hr24 = Math.floor(h);
    const min = Math.round((h - hr24) * 60);
    const ampm = hr24 >= 12 ? "PM" : "AM";
    const hr12 = hr24 % 12 === 0 ? 12 : hr24 % 12;
    return `${hr12}:${min.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>Calendar</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
          Meetings, focus time, and schedulable gaps.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {dates.map((date) => (
            <div
              key={date}
              style={{
                background: COLORS.cardBg,
                border: `1px solid ${COLORS.borderColor}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <SectionTitle>{date === TODAY ? `Today — ${date}` : date}</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {byDate[date].map((e) => {
                  const typePalette = {
                    meeting: { accent: COLORS.accent, chipBg: COLORS.accentDim, chipColor: COLORS.text },
                    focus: { accent: COLORS.sage, chipBg: COLORS.sage, chipColor: COLORS.text },
                    personal: { accent: COLORS.criticalBorder, chipBg: COLORS.critical, chipColor: COLORS.criticalText },
                  }[e.type] || { accent: COLORS.borderStrong, chipBg: COLORS.cardBgMuted, chipColor: COLORS.text };
                  const linked = e.linkedTask ? taskIndex[e.linkedTask] : null;
                  return (
                    <div
                      key={e.id}
                      style={{
                        borderLeft: `3px solid ${typePalette.accent}`,
                        background: COLORS.cardBgMuted,
                        border: `1px solid ${COLORS.borderColor}`,
                        padding: "10px 12px",
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontWeight: 600, color: COLORS.text }}>{e.title}</div>
                        <div
                          style={{
                            color: COLORS.textSecondary,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            fontFamily: MONO_STACK,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {e.startTime} – {e.endTime}
                        </div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: COLORS.textSecondary, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <Chip bg={typePalette.chipBg} color={typePalette.chipColor}>
                          {e.type.toUpperCase()}
                        </Chip>
                        {linked && (
                          <span>
                            ↳ Linked task: <span style={{ color: COLORS.text }}>{linked.title}</span>
                          </span>
                        )}
                      </div>
                      {e.notes && (
                        <div style={{ fontSize: 11, color: COLORS.text, marginTop: 4, fontStyle: "italic", opacity: 0.82 }}>
                          {e.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: 8,
            padding: 16,
            height: "fit-content",
          }}
        >
          <SectionTitle>Available Slots — Today</SectionTitle>
          {availableSlotsToday.length === 0 ? (
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              No open slots today.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {availableSlotsToday.map((slot, i) => {
                const duration = slot.end - slot.start;
                const durationLabel =
                  duration >= 1
                    ? `${Math.floor(duration)}h${duration % 1 ? ` ${Math.round((duration % 1) * 60)}m` : ""}`
                    : `${Math.round(duration * 60)}m`;
                return (
                  <div
                    key={i}
                    style={{
                      border: `1px dashed ${COLORS.accent}`,
                      borderRadius: 4,
                      padding: "8px 10px",
                      background: COLORS.accentDim,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        color: COLORS.text,
                        fontWeight: 600,
                        fontFamily: MONO_STACK,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatSlotTime(slot.start)} – {formatSlotTime(slot.end)}
                    </div>
                    <div style={{ color: COLORS.textSecondary, marginTop: 2 }}>
                      {durationLabel} open — schedulable
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Notes view
// ---------------------------------------------------------------------------

const NotesView = ({ notes, tasks, events, taskIndex }) => {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text }}>Notes</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
          Meeting notes with extracted action items and linked work.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {notes.map((n) => {
          const linkedTasks = (n.linkedTasks || []).map((id) => taskIndex[id]).filter(Boolean);
          const linkedEvents = (n.linkedEvents || [])
            .map((id) => events.find((e) => e.id === id))
            .filter(Boolean);
          return (
            <div
              key={n.id}
              style={{
                background: COLORS.cardBg,
                border: `1px solid ${COLORS.borderColor}`,
                borderRadius: 8,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{n.title}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{n.date}</div>
              </div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 1.55 }}>
                {n.content}
              </div>

              {n.actionItems && n.actionItems.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textSecondary,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                      borderLeft: `3px solid ${COLORS.accent}`,
                      paddingLeft: 8,
                    }}
                  >
                    Action Items
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: COLORS.text, fontSize: 13, lineHeight: 1.6 }}>
                    {n.actionItems.map((ai, i) => (
                      <li key={i}>{ai}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(linkedTasks.length > 0 || linkedEvents.length > 0) && (
                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {linkedTasks.map((t) => (
                    <Chip key={t.id} bg={COLORS.accentDim} color={COLORS.text}>
                      ↳ {t.title}
                    </Chip>
                  ))}
                  {linkedEvents.map((e) => (
                    <Chip key={e.id} bg={COLORS.sage} color={COLORS.text}>
                      ◐ {e.title}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Task Detail Drawer
// ---------------------------------------------------------------------------

const TaskDetail = ({ task, taskIndex, onClose }) => {
  const closeBtnRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Remember who opened us, move focus to Close button, and restore on unmount.
  useEffect(() => {
    if (!task) return undefined;
    previouslyFocusedRef.current = typeof document !== "undefined" ? document.activeElement : null;
    // Defer to next tick so the button exists in the DOM before focusing.
    const id = setTimeout(() => {
      if (closeBtnRef.current) closeBtnRef.current.focus();
    }, 0);
    return () => {
      clearTimeout(id);
      if (
        previouslyFocusedRef.current &&
        typeof previouslyFocusedRef.current.focus === "function"
      ) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [task]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!task) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose && onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;
  const blockedByTasks = (task.blockedBy || []).map((id) => taskIndex[id]).filter(Boolean);
  const blockingTasks = (task.blockingTasks || []).map((id) => taskIndex[id]).filter(Boolean);
  const downstreamIds = getDownstreamTaskIds(task.id, taskIndex);
  const downstream = downstreamIds.map((id) => taskIndex[id]).filter(Boolean);

  const priorityMeta = PRIORITY_META[task.priority] || { label: task.priority, bg: COLORS.cardBgMuted, color: COLORS.text };
  const statusMeta = STATUS_META[task.status] || { label: task.status, icon: "●", bg: COLORS.cardBgMuted, color: COLORS.text };
  const categoryMeta = CATEGORY_META[task.category];

  const titleId = `eacc-detail-title-${task.id}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(42, 53, 71, 0.35)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 100%)",
          height: "100%",
          background: COLORS.cardBg,
          borderLeft: `1px solid ${COLORS.borderColor}`,
          padding: 24,
          overflowY: "auto",
          boxShadow: "-12px 0 32px rgba(42, 53, 71, 0.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.textSecondary,
                letterSpacing: 1,
                textTransform: "uppercase",
                fontFamily: MONO_STACK,
              }}
            >
              {task.id}
            </div>
            <div id={titleId} style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, marginTop: 4 }}>
              {task.title}
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="eacc-close eacc-btn"
            onClick={onClose}
            aria-label="Close task details"
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.borderStrong}`,
              color: COLORS.text,
              borderRadius: 4,
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              minHeight: 44,
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          <Chip bg={priorityMeta.bg} color={COLORS.text}>
            {priorityMeta.label}
          </Chip>
          <Chip bg={statusMeta.bg} color={COLORS.text}>
            <span style={{ color: statusMeta.iconColor || COLORS.text }}>{statusMeta.icon}</span>{" "}
            {statusMeta.label}
          </Chip>
          {categoryMeta && (
            <Chip bg={categoryMeta.bg} color={COLORS.text}>
              {categoryMeta.label}
            </Chip>
          )}
          <Chip bg={COLORS.cardBgMuted} color={COLORS.textSecondary}>
            <span style={{ fontFamily: MONO_STACK, fontVariantNumeric: "tabular-nums" }}>
              Due {task.dueDate} · {task.dueTime}
            </span>
          </Chip>
        </div>

        <p style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6, marginTop: 16 }}>
          {task.description}
        </p>

        {blockedByTasks.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <SectionTitle>Blocked By</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blockedByTasks.map((t) => (
                <TaskCard key={t.id} task={t} taskIndex={taskIndex} compact />
              ))}
            </div>
          </div>
        )}

        {blockingTasks.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <SectionTitle>Directly Blocks</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blockingTasks.map((t) => (
                <TaskCard key={t.id} task={t} taskIndex={taskIndex} compact />
              ))}
            </div>
          </div>
        )}

        {downstream.length > blockingTasks.length && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 6,
              background: COLORS.accentDim,
              border: `1px solid ${COLORS.accent}`,
              fontSize: 12,
              color: COLORS.text,
            }}
          >
            <div style={{ color: COLORS.text, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>
              ◆ Cascading Impact
            </div>
            If this slips, <strong>{downstream.length}</strong> task{downstream.length === 1 ? "" : "s"} downstream will slide too:
            <div style={{ marginTop: 6, color: COLORS.textSecondary }}>
              {downstream.map((t) => t.title).join(" → ")}
            </div>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {task.tags.map((tag) => (
              <Chip key={tag} bg={COLORS.cardBgMuted} color={COLORS.textSecondary}>
                #{tag}
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TABS = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "calendar", label: "Calendar" },
  { id: "notes", label: "Notes" },
];

const ExecutiveAssistantControlCenter = () => {
  const [activeTab, setActiveTab] = useState("today");
  const [tasks] = useState(SAMPLE_TASKS);
  const [events] = useState(SAMPLE_CALENDAR_EVENTS);
  const [notes] = useState(SAMPLE_NOTES);
  const [selectedTask, setSelectedTask] = useState(null);

  const taskIndex = useMemo(() => buildTaskIndex(tasks), [tasks]);

  return (
    <div
      style={{
        background: COLORS.background,
        fontFamily: FONT_STACK,
        color: COLORS.text,
        padding: 28,
        minHeight: 720,
      }}
    >
      {/* Interaction polish — palette locked, motion only */}
      <style>{`
        .eacc-btn {
          transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 120ms ease, box-shadow 150ms ease;
        }
        .eacc-btn:active { transform: scale(0.98); }
        .eacc-btn:focus-visible {
          outline: 2px solid #6B7FAB;
          outline-offset: 2px;
        }
        .eacc-tab:hover:not(.eacc-tab-active) {
          background: rgba(107,127,171,0.08) !important;
          color: #2A3547 !important;
          border-color: rgba(107,127,171,0.35) !important;
        }
        .eacc-quickadd-btn:hover {
          background: rgba(107,127,171,0.30) !important;
          box-shadow: 0 2px 6px rgba(42,53,71,0.10), 0 0 0 3px rgba(107,127,171,0.12);
        }
        .eacc-close:hover {
          background: #EEF1F5 !important;
          color: #2A3547 !important;
          border-color: rgba(42,53,71,0.32) !important;
        }
        .eacc-event {
          transition: transform 180ms cubic-bezier(.2,.7,.2,1), box-shadow 180ms ease, border-color 150ms ease;
          will-change: transform;
        }
        .eacc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(42,53,71,0.10);
        }
        .eacc-alert {
          transition: box-shadow 220ms ease, border-color 180ms ease;
        }
        .eacc-alert:hover {
          box-shadow: 0 6px 18px rgba(140,94,127,0.22);
        }
        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .eacc-btn, .eacc-event, .eacc-alert {
            transition: none !important;
          }
          .eacc-event:hover { transform: none !important; }
        }
      `}</style>
    <div
      style={{
        background: COLORS.cardBg,
        color: COLORS.text,
        fontFamily: FONT_STACK,
        padding: 24,
        borderRadius: 12,
        border: `1px solid ${COLORS.borderColor}`,
        boxShadow: "0 1px 2px rgba(42, 53, 71, 0.04), 0 8px 24px rgba(42, 53, 71, 0.06)",
        minHeight: 640,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, borderLeft: `3px solid ${COLORS.accent}`, paddingLeft: 8 }}>
            Portfolio Piece
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            Executive Assistant Control Center
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, maxWidth: 640 }}>
            Not a task list — a system that models EA reality: blocking dependencies, waiting
            states, time-boxed days, and cascading downstream impact.
          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="View"
          style={{
            display: "inline-flex",
            background: COLORS.cardBg,
            border: `1px solid ${COLORS.borderColor}`,
            borderRadius: 8,
            padding: 4,
          }}
        >
          {TABS.map((t) => {
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`eacc-tab eacc-btn ${selected ? "eacc-tab-active" : ""}`}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: selected ? COLORS.accentDim : "transparent",
                  color: selected ? COLORS.text : COLORS.text,
                  border: selected ? `1px solid ${COLORS.accent}` : "1px solid transparent",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  minHeight: 44,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "today" && (
        <TodayView
          tasks={tasks}
          events={events}
          taskIndex={taskIndex}
          onSelectTask={setSelectedTask}
        />
      )}
      {activeTab === "week" && (
        <WeekView tasks={tasks} taskIndex={taskIndex} onSelectTask={setSelectedTask} />
      )}
      {activeTab === "calendar" && (
        <CalendarView events={events} tasks={tasks} taskIndex={taskIndex} />
      )}
      {activeTab === "notes" && (
        <NotesView notes={notes} tasks={tasks} events={events} taskIndex={taskIndex} />
      )}

      <TaskDetail task={selectedTask} taskIndex={taskIndex} onClose={() => setSelectedTask(null)} />
    </div>
    </div>
  );
};

export default ExecutiveAssistantControlCenter;
