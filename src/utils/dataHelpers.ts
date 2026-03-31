import { DataRecord, FieldInfo, FieldType, AggregationEntry } from '../types';

const CATEGORICAL_THRESHOLD = 50;
const SAMPLE_SIZE = 1000;

function inferFieldType(values: unknown[]): FieldType {
  const nonNull = values.filter(v => v !== null && v !== undefined);
  if (nonNull.length === 0) return 'unknown';
  const sample = nonNull.slice(0, 100);

  if (sample.every(v => typeof v === 'number')) return 'number';
  if (sample.every(v => typeof v === 'boolean')) return 'boolean';
  if (
    sample.every(
      v =>
        typeof v === 'string' &&
        /\d{4}[-/]\d{2}[-/]\d{2}/.test(v) &&
        !isNaN(Date.parse(v))
    )
  )
    return 'date';

  return 'string';
}

/**
 * Collects unique string values for a field, bailing out early
 * when the number exceeds the categorical threshold.
 */
function getUniqueValues(
  data: DataRecord[],
  key: string,
  threshold: number
): string[] | null {
  const seen = new Set<string>();
  for (const record of data) {
    seen.add(String(record[key] ?? ''));
    if (seen.size > threshold) return null;
  }
  return [...seen].sort();
}

/**
 * Analyzes the dataset and returns metadata for every field.
 * No assumptions are made about the shape — columns are derived
 * dynamically from the data keys.
 */
export function analyzeFields(data: DataRecord[]): FieldInfo[] {
  if (data.length === 0) return [];

  const sampleData = data.slice(0, SAMPLE_SIZE);
  const keys = Object.keys(data[0]);

  return keys.map(key => {
    const sampleValues = sampleData.map(r => r[key]);
    const type = inferFieldType(sampleValues);

    const info: FieldInfo = {
      name: key,
      type,
      isCategorical: false,
    };

    if (type === 'number') {
      const nums = sampleValues.filter(v => typeof v === 'number') as number[];
      if (nums.length > 0) {
        info.min = Math.min(...nums);
        info.max = Math.max(...nums);

        // Numeric fields with very few distinct values are categorical too
        const uniqueNums = new Set(nums);
        if (uniqueNums.size <= 15) {
          const allUnique = getUniqueValues(data, key, CATEGORICAL_THRESHOLD);
          if (allUnique && allUnique.length >= 2) {
            info.isCategorical = true;
            info.uniqueValues = allUnique;
          }
        }
      }
    } else {
      const allUnique = getUniqueValues(data, key, CATEGORICAL_THRESHOLD);
      if (allUnique && allUnique.length >= 2) {
        info.isCategorical = true;
        info.uniqueValues = allUnique;
      }
    }

    return info;
  });
}

/**
 * Single‑pass filter. Field filters are evaluated first (more
 * selective), then text search across all stringified values.
 */
export function filterData(
  data: DataRecord[],
  searchQuery: string,
  fieldFilters: Record<string, Set<string>>
): DataRecord[] {
  const searchLower = searchQuery.toLowerCase().trim();
  const hasSearch = searchLower.length > 0;
  const activeFieldFilters = Object.entries(fieldFilters).filter(
    ([, v]) => v.size > 0
  );
  const hasFieldFilters = activeFieldFilters.length > 0;

  if (!hasSearch && !hasFieldFilters) return data;

  return data.filter(record => {
    if (hasFieldFilters) {
      for (const [field, allowed] of activeFieldFilters) {
        if (!allowed.has(String(record[field] ?? ''))) return false;
      }
    }

    if (hasSearch) {
      return Object.values(record).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    }

    return true;
  });
}

/**
 * Single‑pass aggregation that counts records per categorical value.
 */
export function computeAggregation(
  data: DataRecord[],
  field: string
): AggregationEntry[] {
  if (data.length === 0 || !field) return [];

  const counts = new Map<string, number>();
  for (const record of data) {
    const value = String(record[field] ?? 'Unknown');
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const total = data.length;
  const entries: AggregationEntry[] = [];
  for (const [name, value] of counts) {
    entries.push({
      name,
      value,
      percentage: Math.round((value / total) * 1000) / 10,
    });
  }

  return entries.sort((a, b) => b.value - a.value);
}

/**
 * Picks a sensible default field for aggregation — prefers
 * categorical fields with 3‑15 unique values.
 */
export function getDefaultAggregationField(fields: FieldInfo[]): string {
  const categorical = fields.filter(
    f => f.isCategorical && f.name !== 'id' && f.name !== 'email'
  );

  if (categorical.length > 0) {
    const ideal = categorical.find(
      f => f.uniqueValues && f.uniqueValues.length >= 3 && f.uniqueValues.length <= 15
    );
    return ideal ? ideal.name : categorical[0].name;
  }

  const fallback = fields.find(f => f.name !== 'id');
  return fallback?.name ?? fields[0]?.name ?? '';
}

export function formatValue(value: unknown, type?: FieldType): string {
  if (value === null || value === undefined) return '—';
  if (type === 'number' && typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export function getCategoricalFields(fields: FieldInfo[]): FieldInfo[] {
  return fields.filter(
    f => f.isCategorical && f.name !== 'id' && f.name !== 'email'
  );
}
