import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  DataRecord,
  FieldInfo,
  FilterState,
  DataExplorerState,
  DataExplorerAction,
  ViewMode,
  ChartType,
  AggregationEntry,
} from '../types';
import {
  analyzeFields,
  filterData,
  computeAggregation,
  getDefaultAggregationField,
  getCategoricalFields,
} from '../utils/dataHelpers';

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

const initialFilterState: FilterState = {
  searchQuery: '',
  fieldFilters: {},
};

const initialState: DataExplorerState = {
  sourceData: [],
  fields: [],
  filterState: initialFilterState,
  selectedRows: new Set(),
  aggregationField: '',
  chartType: 'bar',
  viewMode: 'dashboard',
  isLoading: false,
  datasetName: '',
};

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function reducer(
  state: DataExplorerState,
  action: DataExplorerAction
): DataExplorerState {
  switch (action.type) {
    case 'SET_DATA': {
      const fields = analyzeFields(action.payload.data);
      const aggregationField = getDefaultAggregationField(fields);
      return {
        ...state,
        sourceData: action.payload.data,
        fields,
        filterState: initialFilterState,
        selectedRows: new Set(),
        aggregationField,
        isLoading: false,
        datasetName:
          action.payload.name ??
          `Dataset (${action.payload.data.length.toLocaleString()} records)`,
      };
    }
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filterState: { ...state.filterState, searchQuery: action.payload },
        selectedRows: new Set(),
      };
    case 'SET_FIELD_FILTER':
      return {
        ...state,
        filterState: {
          ...state.filterState,
          fieldFilters: {
            ...state.filterState.fieldFilters,
            [action.payload.field]: action.payload.values,
          },
        },
        selectedRows: new Set(),
      };
    case 'CLEAR_FIELD_FILTER': {
      const next = { ...state.filterState.fieldFilters };
      delete next[action.payload];
      return {
        ...state,
        filterState: { ...state.filterState, fieldFilters: next },
        selectedRows: new Set(),
      };
    }
    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        filterState: initialFilterState,
        selectedRows: new Set(),
      };
    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRows: action.payload };
    case 'TOGGLE_ROW_SELECTION': {
      const s = new Set(state.selectedRows);
      if (s.has(action.payload)) s.delete(action.payload);
      else s.add(action.payload);
      return { ...state, selectedRows: s };
    }
    case 'SET_AGGREGATION_FIELD':
      return { ...state, aggregationField: action.payload };
    case 'SET_CHART_TYPE':
      return { ...state, chartType: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Context value                                                      */
/* ------------------------------------------------------------------ */

interface DataExplorerContextValue {
  state: DataExplorerState;
  /** Filtered data — single derived source consumed by every view */
  filteredData: DataRecord[];
  aggregation: AggregationEntry[];
  categoricalFields: FieldInfo[];
  activeFilterCount: number;
  dispatch: React.Dispatch<DataExplorerAction>;
  setSearchQuery: (q: string) => void;
  setFieldFilter: (field: string, values: Set<string>) => void;
  clearFieldFilter: (field: string) => void;
  clearAllFilters: () => void;
  setData: (data: DataRecord[], name?: string) => void;
  setAggregationField: (field: string) => void;
  setChartType: (type: ChartType) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleRowSelection: (index: number) => void;
}

const DataExplorerContext = createContext<DataExplorerContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function DataExplorerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Derived state (memoized) ----

  const filteredData = useMemo(
    () =>
      filterData(
        state.sourceData,
        state.filterState.searchQuery,
        state.filterState.fieldFilters
      ),
    [state.sourceData, state.filterState.searchQuery, state.filterState.fieldFilters]
  );

  const aggregation = useMemo(
    () => computeAggregation(filteredData, state.aggregationField),
    [filteredData, state.aggregationField]
  );

  const categoricalFields = useMemo(
    () => getCategoricalFields(state.fields),
    [state.fields]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (state.filterState.searchQuery.trim()) count++;
    for (const v of Object.values(state.filterState.fieldFilters)) {
      if (v.size > 0) count++;
    }
    return count;
  }, [state.filterState]);

  // ---- Action creators ----

  const setSearchQuery = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.trim() === '') {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    } else {
      searchTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
      }, 150);
    }
  }, []);

  const setFieldFilter = useCallback(
    (field: string, values: Set<string>) =>
      dispatch({ type: 'SET_FIELD_FILTER', payload: { field, values } }),
    []
  );

  const clearFieldFilter = useCallback(
    (field: string) => dispatch({ type: 'CLEAR_FIELD_FILTER', payload: field }),
    []
  );

  const clearAllFilters = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const setData = useCallback(
    (data: DataRecord[], name?: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Yield to let the loading indicator paint
      setTimeout(() => {
        dispatch({ type: 'SET_DATA', payload: { data, name } });
      }, 0);
    },
    []
  );

  const setAggregationField = useCallback(
    (field: string) =>
      dispatch({ type: 'SET_AGGREGATION_FIELD', payload: field }),
    []
  );

  const setChartType = useCallback(
    (type: ChartType) => dispatch({ type: 'SET_CHART_TYPE', payload: type }),
    []
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    []
  );

  const toggleRowSelection = useCallback(
    (index: number) =>
      dispatch({ type: 'TOGGLE_ROW_SELECTION', payload: index }),
    []
  );

  // ---- Stable context value ----

  const value = useMemo<DataExplorerContextValue>(
    () => ({
      state,
      filteredData,
      aggregation,
      categoricalFields,
      activeFilterCount,
      dispatch,
      setSearchQuery,
      setFieldFilter,
      clearFieldFilter,
      clearAllFilters,
      setData,
      setAggregationField,
      setChartType,
      setViewMode,
      toggleRowSelection,
    }),
    [
      state,
      filteredData,
      aggregation,
      categoricalFields,
      activeFilterCount,
      setSearchQuery,
      setFieldFilter,
      clearFieldFilter,
      clearAllFilters,
      setData,
      setAggregationField,
      setChartType,
      setViewMode,
      toggleRowSelection,
    ]
  );

  return (
    <DataExplorerContext.Provider value={value}>
      {children}
    </DataExplorerContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useDataExplorer(): DataExplorerContextValue {
  const ctx = useContext(DataExplorerContext);
  if (!ctx)
    throw new Error('useDataExplorer must be used within DataExplorerProvider');
  return ctx;
}
