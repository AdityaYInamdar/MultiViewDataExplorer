export type DataRecord = Record<string, unknown>;

export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

export interface FieldInfo {
  name: string;
  type: FieldType;
  isCategorical: boolean;
  uniqueValues?: string[];
  min?: number;
  max?: number;
}

export interface FilterState {
  searchQuery: string;
  fieldFilters: Record<string, Set<string>>;
}

export interface AggregationEntry {
  name: string;
  value: number;
  percentage: number;
}

export type ViewMode = 'dashboard' | 'table' | 'graph' | 'json';

export type ChartType = 'bar' | 'pie' | 'donut';

export interface DataExplorerState {
  sourceData: DataRecord[];
  fields: FieldInfo[];
  filterState: FilterState;
  selectedRows: Set<number>;
  aggregationField: string;
  chartType: ChartType;
  viewMode: ViewMode;
  isLoading: boolean;
  datasetName: string;
}

export type DataExplorerAction =
  | { type: 'SET_DATA'; payload: { data: DataRecord[]; name?: string } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FIELD_FILTER'; payload: { field: string; values: Set<string> } }
  | { type: 'CLEAR_FIELD_FILTER'; payload: string }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_SELECTED_ROWS'; payload: Set<number> }
  | { type: 'TOGGLE_ROW_SELECTION'; payload: number }
  | { type: 'SET_AGGREGATION_FIELD'; payload: string }
  | { type: 'SET_CHART_TYPE'; payload: ChartType }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean };
