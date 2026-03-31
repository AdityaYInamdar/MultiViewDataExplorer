import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataExplorer } from '../context/DataExplorerContext';
import { formatValue } from '../utils/dataHelpers';
import { Rows3 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Generic badge for categorical values                               */
/* ------------------------------------------------------------------ */

const BADGE_COLORS = [
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
];

function CategoricalBadge({ value }: { value: string }) {
  const hash = value
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return (
    <span className={`badge ${BADGE_COLORS[hash % BADGE_COLORS.length]}`}>
      {value}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Table                                                              */
/* ------------------------------------------------------------------ */

export function TableView() {
  const { state, filteredData, toggleRowSelection } = useDataExplorer();
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    return state.fields.map(f => {
      let width = 140;
      if (f.name === 'id') width = 70;
      else if (f.type === 'number' && !f.isCategorical) width = 110;
      else if (f.isCategorical && f.uniqueValues) {
        const maxLen = Math.max(...f.uniqueValues.map(v => v.length), 0);
        width = Math.max(Math.min(maxLen * 9 + 40, 200), 100);
      } else if (f.type === 'string') {
        const lower = f.name.toLowerCase();
        if (lower.includes('email')) width = 230;
        else if (lower.includes('name')) width = 180;
        else if (lower.includes('description') || lower.includes('comment'))
          width = 260;
      }
      return {
        key: f.name,
        label: f.name,
        type: f.type,
        isCategorical: f.isCategorical,
        width,
      };
    });
  }, [state.fields]);

  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 20,
  });

  const handleRowClick = useCallback(
    (idx: number) => toggleRowSelection(idx),
    [toggleRowSelection]
  );

  /* --- Empty states --- */

  if (state.sourceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <Rows3 size={48} strokeWidth={1} />
        <p className="text-sm">Load data to view the table</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <Rows3 size={48} strokeWidth={1} />
        <p className="text-sm">No records match the current filters</p>
      </div>
    );
  }

  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="overflow-x-auto flex-shrink-0 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex min-w-fit" style={{ width: totalWidth }}>
          {columns.map(col => (
            <div
              key={col.key}
              className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex-shrink-0 select-none"
              style={{ width: col.width, minWidth: col.width }}
            >
              <span className="truncate">{col.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rows (virtualized) */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          className="relative min-w-fit"
          style={{
            height: rowVirtualizer.getTotalSize(),
            width: totalWidth,
          }}
        >
          {rowVirtualizer.getVirtualItems().map(vRow => {
            const record = filteredData[vRow.index];
            const selected = state.selectedRows.has(vRow.index);

            return (
              <div
                key={vRow.index}
                className={`absolute top-0 left-0 flex items-center w-full cursor-pointer transition-colors duration-100 border-b border-slate-100 dark:border-slate-800/50 ${
                  selected
                    ? 'bg-violet-500/10 dark:bg-violet-500/15'
                    : vRow.index % 2 === 0
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                }`}
                style={{
                  height: vRow.size,
                  transform: `translateY(${vRow.start}px)`,
                }}
                onClick={() => handleRowClick(vRow.index)}
              >
                {columns.map(col => {
                  const value = record[col.key];
                  return (
                    <div
                      key={col.key}
                      className="px-3 py-2 text-sm truncate flex-shrink-0"
                      style={{ width: col.width, minWidth: col.width }}
                      title={String(value ?? '')}
                    >
                      {col.isCategorical && typeof value === 'string' ? (
                        <CategoricalBadge value={value} />
                      ) : (
                        <span
                          className={
                            col.type === 'number' ? 'font-mono text-xs' : ''
                          }
                        >
                          {formatValue(value, col.type)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
