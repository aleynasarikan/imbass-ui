import React, { useMemo, useState } from 'react';
import { cn } from '../../lib/utils';

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data?: ActivityDay[];
  year?: number;
  className?: string;
  /** "collab" | "content" — changes label copy */
  metric?: 'collab' | 'content';
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS   = ['Mon', 'Wed', 'Fri'];

/** Generate a plausible year of mock activity — sparse week-patterned with bursts. */
export const generateMockActivity = (year: number): ActivityDay[] => {
  const result: ActivityDay[] = [];
  const start = new Date(year, 0, 1);
  const end   = new Date(year, 11, 31);
  const rand  = mulberry32(year * 9301 + 49297);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    // Weekdays more active than weekends
    const weekend = dow === 0 || dow === 6;
    const base = weekend ? 0.18 : 0.35;
    // Random bursts (campaign windows)
    const burst = rand() < 0.04 ? Math.floor(rand() * 5) + 3 : 0;
    const active = rand() < base;
    const count = burst || (active ? Math.floor(rand() * 3) + 1 : 0);
    result.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      count,
    });
  }
  return result;
};

// Deterministic PRNG so the mock is stable between renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  data, year = new Date().getFullYear(), className, metric = 'collab',
}) => {
  const [hover, setHover] = useState<{ x: number; y: number; day: ActivityDay } | null>(null);

  const activity = useMemo(() => data ?? generateMockActivity(year), [data, year]);

  // Build a grid: 53 columns (weeks) × 7 rows (days). Each cell = ActivityDay | null.
  const grid = useMemo(() => {
    const byDate = new Map(activity.map(a => [a.date, a.count]));
    const cols: Array<Array<ActivityDay | null>> = [];
    const firstDay = new Date(year, 0, 1);
    const offset   = firstDay.getDay(); // 0 Sunday..6 Saturday
    // Start at the Sunday ≤ Jan 1
    const cursor = new Date(year, 0, 1 - offset);

    for (let w = 0; w < 53; w++) {
      const week: Array<ActivityDay | null> = [];
      for (let d = 0; d < 7; d++) {
        const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const inYear = cursor.getFullYear() === year;
        week.push(inYear ? { date: ds, count: byDate.get(ds) ?? 0 } : null);
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(week);
    }
    return cols;
  }, [activity, year]);

  const maxCount = useMemo(() => activity.reduce((m, a) => Math.max(m, a.count), 0) || 1, [activity]);

  // Month labels: show the month label at the first column of that month
  const monthPositions = useMemo(() => {
    const positions: Array<{ col: number; month: string }> = [];
    for (let c = 0; c < grid.length; c++) {
      const firstSun = grid[c][0];
      if (!firstSun) continue;
      const d = new Date(firstSun.date);
      // first column of this month?
      if (d.getDate() <= 7) {
        positions.push({ col: c, month: MONTH_LABELS[d.getMonth()] });
      }
    }
    return positions;
  }, [grid]);

  const total = useMemo(() => activity.reduce((s, a) => s + a.count, 0), [activity]);
  const noun = metric === 'collab' ? 'collaboration' : 'post';
  const nounPlural = metric === 'collab' ? 'collaborations' : 'posts';

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[13px] text-text-soft font-medium">
            <span className="tabular-nums text-text font-semibold">{total}</span>{' '}
            {total === 1 ? noun : nounPlural} in {year}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-sans text-[11px] text-text-mute">
          <span>Less</span>
          <Legend level={0} />
          <Legend level={1} />
          <Legend level={2} />
          <Legend level={3} />
          <Legend level={4} />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="relative inline-block pl-7 pt-4">
          {/* Month labels — absolute so they align with columns */}
          <div className="absolute top-0 left-7 right-0 h-3 pointer-events-none">
            {monthPositions.map(({ col, month }) => (
              <span
                key={`${col}-${month}`}
                className="absolute font-sans text-[10.5px] text-text-mute"
                style={{ left: `${col * (CELL + GAP)}px` }}
              >
                {month}
              </span>
            ))}
          </div>

          {/* Day labels — left */}
          <div className="absolute top-4 left-0 flex flex-col gap-[2px]">
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <span
                key={i}
                className="font-sans text-[10.5px] text-text-mute leading-none"
                style={{ height: `${CELL}px` }}
              >
                {i === 1 && DAY_LABELS[0]}
                {i === 3 && DAY_LABELS[1]}
                {i === 5 && DAY_LABELS[2]}
              </span>
            ))}
          </div>

          {/* Cells grid */}
          <div className="flex gap-[2px]" onMouseLeave={() => setHover(null)}>
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col gap-[2px]">
                {week.map((day, d) => (
                  <Cell
                    key={d}
                    day={day}
                    level={day ? bucketize(day.count, maxCount) : -1}
                    onHover={(rect) => {
                      if (!day) return;
                      setHover({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        day,
                      });
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hover && (
            <div
              className="fixed z-50 -translate-x-1/2 -translate-y-full -mt-2 pointer-events-none"
              style={{ left: hover.x, top: hover.y }}
            >
              <div className="px-2.5 py-1.5 rounded-md bg-[#0d0f13] border border-line-strong text-white text-[11px] font-mono shadow-float whitespace-nowrap">
                <span className="font-semibold">{hover.day.count}</span>{' '}
                <span className="text-text-mute">
                  {hover.day.count === 1 ? noun : nounPlural} on {formatDate(hover.day.date)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CELL = 11;
const GAP  = 2;

const Cell: React.FC<{
  day: ActivityDay | null;
  level: number;
  onHover: (rect: DOMRect) => void;
}> = ({ day, level, onHover }) => {
  if (!day) return <div style={{ width: CELL, height: CELL }} />;
  return (
    <div
      className={cn('rounded-[3px] transition-all cursor-pointer', levelClass(level))}
      style={{ width: CELL, height: CELL }}
      onMouseEnter={(e) => onHover((e.target as HTMLDivElement).getBoundingClientRect())}
      data-date={day.date}
      data-count={day.count}
    />
  );
};

const Legend: React.FC<{ level: number }> = ({ level }) => (
  <span className={cn('rounded-[3px]', levelClass(level))} style={{ width: 10, height: 10 }} />
);

function bucketize(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5)  return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function levelClass(level: number): string {
  switch (level) {
    case 0:  return 'bg-[#22252e] hover:ring-1 hover:ring-line-strong';
    case 1:  return 'bg-iris/25 hover:ring-1 hover:ring-iris/50';
    case 2:  return 'bg-iris/45 hover:ring-1 hover:ring-iris/60';
    case 3:  return 'bg-iris/70 hover:ring-1 hover:ring-iris/80';
    case 4:  return 'bg-iris hover:ring-1 hover:ring-iris';
    default: return 'bg-transparent';
  }
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default ActivityHeatmap;
