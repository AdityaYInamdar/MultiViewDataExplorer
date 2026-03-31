import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDataExplorer } from '../context/DataExplorerContext';
import { Search, X, Filter, ChevronDown, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  FieldFilterDropdown                                                */
/* ------------------------------------------------------------------ */

function FieldFilterDropdown({
  fieldName,
  uniqueValues,
  selectedValues,
  onSelectionChange,
  onClear,
}: {
  fieldName: string;
  uniqueValues: string[];
  selectedValues: Set<string>;
  onSelectionChange: (values: Set<string>) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return uniqueValues;
    const lower = search.toLowerCase();
    return uniqueValues.filter(v => v.toLowerCase().includes(lower));
  }, [uniqueValues, search]);

  const toggle = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onSelectionChange(next);
  };

  const isActive = selectedValues.size > 0;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
          isActive
            ? 'bg-violet-500/10 dark:bg-violet-500/20 border-violet-500/30 text-violet-600 dark:text-violet-400'
            : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'
        }`}
      >
        {fieldName}
        {isActive && (
          <span className="bg-violet-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {selectedValues.size}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-2xl p-2 z-[9999] animate-slide-down max-h-64 flex flex-col"
            style={{ top: pos.top, left: pos.left }}
          >
            {uniqueValues.length > 8 && (
              <div className="px-1 pb-2">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="input-base text-xs py-1.5"
                  autoFocus
                />
              </div>
            )}

            <div className="overflow-y-auto flex-1 space-y-0.5">
              {filtered.map(value => (
                <button
                  key={value}
                  onClick={() => toggle(value)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedValues.has(value)
                        ? 'bg-violet-500 border-violet-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selectedValues.has(value) && (
                      <Check size={10} className="text-white" />
                    )}
                  </div>
                  <span className="truncate text-slate-700 dark:text-slate-300">
                    {value}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  No matches
                </p>
              )}
            </div>

            {isActive && (
              <button
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="mt-2 w-full text-xs text-center py-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FilterBar                                                          */
/* ------------------------------------------------------------------ */

export function FilterBar() {
  const {
    state,
    filteredData,
    categoricalFields,
    activeFilterCount,
    setSearchQuery,
    setFieldFilter,
    clearFieldFilter,
    clearAllFilters,
  } = useDataExplorer();

  const [localSearch, setLocalSearch] = useState('');

  // Sync when external clear happens
  useEffect(() => {
    if (state.filterState.searchQuery === '') setLocalSearch('');
  }, [state.filterState.searchQuery]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    setSearchQuery(value);
  };

  if (state.sourceData.length === 0) return null;

  return (
    <div className="glass-panel rounded-none border-x-0 border-t-0">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3">
          {/* Search + stats */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={localSearch}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search across all fields…"
                className="input-base pl-9 pr-8"
              />
              {localSearch && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-mono text-xs">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">
                  {filteredData.length.toLocaleString()}
                </span>
                {' / '}
                {state.sourceData.length.toLocaleString()}
              </span>
              <span className="text-xs">records</span>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
              >
                <X size={12} />
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Field chips */}
          {categoricalFields.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                <Filter size={12} />
                <span>Filters:</span>
              </div>
              {categoricalFields.map(field => (
                <FieldFilterDropdown
                  key={field.name}
                  fieldName={field.name}
                  uniqueValues={field.uniqueValues ?? []}
                  selectedValues={
                    state.filterState.fieldFilters[field.name] ?? new Set()
                  }
                  onSelectionChange={v => setFieldFilter(field.name, v)}
                  onClear={() => clearFieldFilter(field.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
