import React, { useState, useMemo, useRef } from "react";

const COLORS = {
  background: "#E4EAF0",
  cardBg: "#FAFBFD",
  cardBgMuted: "#EEF1F5",
  text: "#2A3547",
  textSecondary: "#566175",
  borderColor: "rgba(42, 53, 71, 0.14)",
  accent: "#6B7FAB",
  success: "#8DA399",
};

const parseTimeToHours = (timeStr) => {
  if (!timeStr) return 0;
  // This regex handles "9:00 AM", "9:00AM", "09:00am" etc.
  const m = String(timeStr).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + min / 60;
};

const TodayView = ({ tasks = [] }) => {
  const computeSlices = (taskList) => {
    const sorted = [...taskList].sort((a, b) => 
      parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime)
    );

    const results = [];
    let clusterMaxEnd = -Infinity;
    let currentCluster = [];

    const flush = () => {
      if (currentCluster.length === 0) return;
      const width = 1 / Math.min(currentCluster.length, 2);
      currentCluster.forEach((t, i) => {
        const start = parseTimeToHours(t.dueTime);
        results.push({
          ...t,
          top: (start - 8) * 60,
          height: (t.duration || 1) * 60,
          width: `calc(${width * 100}% - 12px)`,
          left: `${(i % 2) * width * 100}%`,
        });
      });
      currentCluster = [];
      clusterMaxEnd = -Infinity;
    };

    sorted.forEach((task) => {
      const start = (parseTimeToHours(task.dueTime) - 8) * 60;
      if (start >= clusterMaxEnd && currentCluster.length > 0) flush();
      currentCluster.push(task);
      const end = start + (task.duration || 1) * 60;
      if (end > clusterMaxEnd) clusterMaxEnd = end;
    });
    flush();
    return results;
  };

  const slices = useMemo(() => computeSlices(tasks), [tasks]);

  return (
    <div style={{ padding: "20px 40px", flex: 1, overflowY: "auto", background: COLORS.cardBg }}>
      <div style={{ position: "relative", height: 960, borderLeft: `1px solid ${COLORS.borderColor}` }}>
        {Array.from({ length: 13 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", top: i * 60, width: "100%", height: 1, background: COLORS.borderColor }}>
            <span style={{ position: "absolute", left: -45, fontSize: 11, color: COLORS.textSecondary }}>{i + 8}:00</span>
          </div>
        ))}
        {slices.map((s) => (
          <div key={s.id} style={{
            position: "absolute", top: s.top, height: s.height, width: s.width, left: s.left,
            background: COLORS.cardBgMuted, borderLeft: `4px solid ${COLORS.accent}`,
            borderRadius: 4, padding: 10, marginLeft: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{s.title}</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>{s.dueTime}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ExecutiveAssistantControlCenter({ tasks = [] }) {
  return (
    <div style={{ background: COLORS.background, minHeight: "100vh", padding: 20 }}>
      <h1 style={{ color: COLORS.text }}>Command Center</h1>
      <TodayView tasks={tasks} />
    </div>
  );
}
