const computeTaskColumns = (tasks, heightOverrides) => {
  const CLUSTER_GAP = 12; // Gutter between task rows
  const valid = tasks.filter((t) => parseTimeToHours(t.dueTime) != null);
  const sorted = [...valid].sort((a, b) => parseTimeToHours(a.dueTime) - parseTimeToHours(b.dueTime));

  const placements = [];
  let cluster = [];
  let clusterWaterline = 0; // Tracks the physical bottom of the last placed cluster

  // Helper: finalize a cluster and prepare for the next
  const flushCluster = () => {
    if (cluster.length === 0) return;
    const colCount = Math.max(...cluster.map(p => p.column)) + 1;
    cluster.forEach(p => {
      p.columnCount = colCount;
      placements.push(p);
    });
    // Set the new waterline to the bottom of the just-finished cluster
    clusterWaterline = Math.max(...cluster.map(p => p.top + p.height)) + CLUSTER_GAP;
    cluster = [];
  };

  sorted.forEach((task) => {
    const naturalTop = (parseTimeToHours(task.dueTime) - DAY_START_HOUR) * HOUR_HEIGHT;
    // The task starts at its time OR after the last cluster, whichever is later
    const actualTop = Math.max(naturalTop, clusterWaterline);

    // Try to find a free column (0 or 1)
    let targetColumn = -1;
    for (let i = 0; i < MAX_COLUMNS; i++) {
      const isBusy = cluster.some(p => p.column === i && actualTop < (p.top + p.height));
      if (!isBusy) {
        targetColumn = i;
        break;
      }
    }

    // If no columns are free, flush the current cluster and start a new row
    if (targetColumn === -1) {
      flushCluster();
      const bumpedTop = Math.max(naturalTop, clusterWaterline);
      cluster.push({ task, top: bumpedTop, height: 110, column: 0 });
    } else {
      cluster.push({ task, top: actualTop, height: 110, column: targetColumn });
    }
  });

  flushCluster(); // Final flush for the remaining tasks

  const totalHeight = placements.length > 0 
    ? Math.max(...placements.map(p => p.top + p.height)) + 60 
    : HOURS_SPAN * HOUR_HEIGHT;

  return { placements, totalHeight };
};
