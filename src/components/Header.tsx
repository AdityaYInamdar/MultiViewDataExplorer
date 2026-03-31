import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDataExplorer } from '../context/DataExplorerContext';
import { generateSampleData } from '../utils/generateData';
import {
  Database,
  Upload,
  Moon,
  Sun,
  Layers,
  BarChart3,
  Table2,
  Code2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ViewMode } from '../types';

const VIEW_MODES: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'dashboard', icon: <Layers size={16} />, label: 'Dashboard' },
  { mode: 'table', icon: <Table2 size={16} />, label: 'Table' },
  { mode: 'graph', icon: <BarChart3 size={16} />, label: 'Graph' },
  { mode: 'json', icon: <Code2 size={16} />, label: 'JSON' },
];

export function Header() {
  const { state, setData, setViewMode } = useDataExplorer();
  const [isDark, setIsDark] = useState(true);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [recordCount, setRecordCount] = useState('50000');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useLayoutEffect(() => {
    if (showDataMenu && dataBtnRef.current) {
      const rect = dataBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [showDataMenu]);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) html.classList.remove('dark');
    else html.classList.add('dark');
    setIsDark(!isDark);
  };

  const handleGenerateData = useCallback(() => {
    const count = Math.min(Math.max(parseInt(recordCount) || 1000, 100), 2_000_000);
    setRecordCount(String(count));
    const data = generateSampleData(count);
    setData(data, `Sample Dataset (${count.toLocaleString()} records)`);
    setShowDataMenu(false);
  }, [recordCount, setData]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const data = Array.isArray(json)
            ? json
            : json.data ?? json.records ?? [json];

          if (data.length > 0 && typeof data[0] === 'object') {
            setData(data, file.name);
          } else {
            alert('Invalid JSON format. Expected an array of objects.');
          }
        } catch {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
      setShowDataMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [setData]
  );

  return (
    <header className="glass-panel rounded-none border-x-0 border-t-0 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* ---- Logo ---- */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="accent-gradient p-2 rounded-lg shadow-md shadow-violet-500/20">
              <Database size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                <span className="hidden sm:inline">Multi-View </span>Data
                Explorer
              </h1>
              {state.datasetName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {state.datasetName}
                </p>
              )}
            </div>
          </div>

          {/* ---- Desktop view switcher ---- */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
            {VIEW_MODES.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`view-tab flex items-center gap-1.5 ${
                  state.viewMode === mode
                    ? 'view-tab-active'
                    : 'view-tab-inactive'
                }`}
                title={label}
              >
                {icon}
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ---- Actions ---- */}
          <div className="flex items-center gap-2">
            {/* Data menu */}
            <div className="relative">
              <button
                ref={dataBtnRef}
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="btn-secondary text-xs sm:text-sm"
              >
                <Database size={14} />
                <span className="hidden sm:inline">Data</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showDataMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {showDataMenu && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div
                    className="fixed w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl p-4 z-[9999] animate-slide-down"
                    style={{ top: menuPos.top, right: menuPos.right }}
                  >
                    <div className="space-y-4">
                      {/* Generate */}
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Generate Sample Data
                        </label>
                        <div className="mt-2 flex gap-2">
                          <input
                            type="number"
                            value={recordCount}
                            onChange={e => setRecordCount(e.target.value)}
                            min="100"
                            max="2000000"
                            step="1000"
                            className="input-base flex-1"
                            placeholder="Record count"
                          />
                          <button
                            onClick={handleGenerateData}
                            className="btn-primary whitespace-nowrap"
                          >
                            <Sparkles size={14} />
                            Generate
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          100 – 2,000,000 records
                        </p>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700/50" />

                      {/* Upload */}
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Upload JSON File
                        </label>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 w-full btn-secondary justify-center"
                        >
                          <Upload size={14} />
                          Choose File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn-secondary p-2"
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {/* ---- Mobile view switcher ---- */}
        <div className="flex md:hidden items-center gap-1 mt-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 overflow-x-auto">
          {VIEW_MODES.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`view-tab flex items-center gap-1.5 flex-1 justify-center ${
                state.viewMode === mode
                  ? 'view-tab-active'
                  : 'view-tab-inactive'
              }`}
            >
              {icon}
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
