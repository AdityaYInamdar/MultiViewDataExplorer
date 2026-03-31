import { useMemo, useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDataExplorer } from '../context/DataExplorerContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  CircleDot,
  ChevronDown,
} from 'lucide-react';
import { ChartType } from '../types';

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */

const COLORS = [
  '#8B5CF6', '#6366F1', '#EC4899', '#F43F5E', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#A855F7', '#D946EF', '#F472B6', '#FB923C', '#A3E635',
];

const CHART_OPTIONS: { type: ChartType; icon: React.ReactNode; label: string }[] = [
  { type: 'bar', icon: <BarChart3 size={14} />, label: 'Bar' },
  { type: 'pie', icon: <PieIcon size={14} />, label: 'Pie' },
  { type: 'donut', icon: <CircleDot size={14} />, label: 'Donut' },
];

/* ------------------------------------------------------------------ */
/*  Tooltip                                                            */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-slate-900 dark:text-slate-100">
        {label || payload[0]?.name}
      </p>
      <p className="text-violet-600 dark:text-violet-400 font-mono mt-0.5">
        {payload[0]?.value?.toLocaleString()} records
      </p>
      {payload[0]?.payload?.percentage !== undefined && (
        <p className="text-slate-500 dark:text-slate-400">
          {payload[0].payload.percentage}%
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Graph                                                              */
/* ------------------------------------------------------------------ */

export function GraphView() {
  const {
    state,
    aggregation,
    categoricalFields,
    filteredData,
    setAggregationField,
    setChartType,
  } = useDataExplorer();

  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const fieldBtnRef = useRef<HTMLButtonElement>(null);
  const [fieldMenuPos, setFieldMenuPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (showFieldMenu && fieldBtnRef.current) {
      const rect = fieldBtnRef.current.getBoundingClientRect();
      setFieldMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [showFieldMenu]);

  // Highlighted categories from selected table rows (bonus feature)
  const highlighted = useMemo(() => {
    if (state.selectedRows.size === 0) return new Set<string>();
    const cats = new Set<string>();
    for (const idx of state.selectedRows) {
      const rec = filteredData[idx];
      if (rec) cats.add(String(rec[state.aggregationField] ?? 'Unknown'));
    }
    return cats;
  }, [state.selectedRows, filteredData, state.aggregationField]);

  // Collapse long tails into "Other"
  const chartData = useMemo(() => {
    if (aggregation.length <= 20) return aggregation;
    const top = aggregation.slice(0, 15);
    const rest = aggregation.slice(15);
    const otherCount = rest.reduce((s, e) => s + e.value, 0);
    const total = aggregation.reduce((s, e) => s + e.value, 0);
    return [
      ...top,
      {
        name: 'Other',
        value: otherCount,
        percentage: Math.round((otherCount / total) * 1000) / 10,
      },
    ];
  }, [aggregation]);

  /* --- Empty states --- */

  if (state.sourceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <BarChart3 size={48} strokeWidth={1} />
        <p className="text-sm">Load data to view the graph</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <BarChart3 size={48} strokeWidth={1} />
        <p className="text-sm">No data to visualize</p>
      </div>
    );
  }

  const hasHighlight = highlighted.size > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
        {/* Field selector (bonus: switch aggregation dimension) */}
        <div className="relative">
          <button
            ref={fieldBtnRef}
            onClick={() => setShowFieldMenu(!showFieldMenu)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <span className="text-slate-400">Group by:</span>
            <span className="text-violet-600 dark:text-violet-400">
              {state.aggregationField}
            </span>
            <ChevronDown
              size={12}
              className={`transition-transform ${showFieldMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showFieldMenu && createPortal(
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowFieldMenu(false)}
              />
              <div
                className="fixed w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl p-1.5 z-[9999] animate-slide-down"
                style={{ top: fieldMenuPos.top, left: fieldMenuPos.left }}
              >
                {categoricalFields.map(f => (
                  <button
                    key={f.name}
                    onClick={() => {
                      setAggregationField(f.name);
                      setShowFieldMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
                      f.name === state.aggregationField
                        ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {f.name}
                    {f.uniqueValues && (
                      <span className="text-slate-400 ml-1">
                        ({f.uniqueValues.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>,
            document.body
          )}
        </div>

        {/* Chart type switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
          {CHART_OPTIONS.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${
                state.chartType === type
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title={label}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {state.chartType === 'bar' ? (
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-slate-500 dark:text-slate-400"
                interval={0}
                angle={chartData.length > 6 ? -35 : 0}
                textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                height={chartData.length > 6 ? 80 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-slate-500 dark:text-slate-400"
                tickFormatter={v =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{
                  fill: 'currentColor',
                  className:
                    'text-slate-100/50 dark:text-slate-700/50',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={
                      hasHighlight
                        ? highlighted.has(entry.name)
                          ? 1
                          : 0.25
                        : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={state.chartType === 'donut' ? '55%' : 0}
                outerRadius="80%"
                paddingAngle={chartData.length > 1 ? 2 : 0}
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    opacity={
                      hasHighlight
                        ? highlighted.has(entry.name)
                          ? 1
                          : 0.25
                        : 1
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={(val: string) => (
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {val}
                  </span>
                )}
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
