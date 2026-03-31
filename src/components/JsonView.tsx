import { useMemo, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataExplorer } from '../context/DataExplorerContext';
import { Code2, Copy, Check, Download } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Tokenizer for safe JSON syntax highlighting (no innerHTML)         */
/* ------------------------------------------------------------------ */

interface Token {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'bracket' | 'space';
  text: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Whitespace
    if (/\s/.test(line[i])) {
      let j = i;
      while (j < line.length && /\s/.test(line[j])) j++;
      tokens.push({ type: 'space', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // String (may be key or value)
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++;
        j++;
      }
      j++; // closing quote
      const text = line.slice(i, j);
      const rest = line.slice(j).trimStart();
      tokens.push({ type: rest.startsWith(':') ? 'key' : 'string', text });
      i = j;
      continue;
    }

    // Number
    if (/[-\d]/.test(line[i])) {
      let j = i;
      if (line[j] === '-') j++;
      while (j < line.length && /[\d.eE+\-]/.test(line[j])) j++;
      tokens.push({ type: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Booleans / null
    if (line.slice(i, i + 4) === 'true') {
      tokens.push({ type: 'boolean', text: 'true' });
      i += 4;
      continue;
    }
    if (line.slice(i, i + 5) === 'false') {
      tokens.push({ type: 'boolean', text: 'false' });
      i += 5;
      continue;
    }
    if (line.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'null', text: 'null' });
      i += 4;
      continue;
    }

    // Brackets / punctuation
    tokens.push({ type: 'bracket', text: line[i] });
    i++;
  }

  return tokens;
}

const TOKEN_CLASS: Record<Token['type'], string> = {
  key: 'json-key',
  string: 'json-string',
  number: 'json-number',
  boolean: 'json-boolean',
  null: 'json-null',
  bracket: 'json-bracket',
  space: '',
};

function HighlightedLine({ line }: { line: string }) {
  const tokens = tokenizeLine(line);
  return (
    <>
      {tokens.map((t, i) => (
        <span key={i} className={TOKEN_CLASS[t.type]}>
          {t.text}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  JSON View                                                          */
/* ------------------------------------------------------------------ */

const MAX_DISPLAY = 10_000;

export function JsonView() {
  const { state, filteredData } = useDataExplorer();
  const parentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const isTruncated = filteredData.length > MAX_DISPLAY;

  const jsonLines = useMemo(() => {
    if (filteredData.length === 0) return [];
    const slice = isTruncated
      ? filteredData.slice(0, MAX_DISPLAY)
      : filteredData;
    return JSON.stringify(slice, null, 2).split('\n');
  }, [filteredData, isTruncated]);

  const rowVirtualizer = useVirtualizer({
    count: jsonLines.length + (isTruncated ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 50,
  });

  const handleCopy = useCallback(async () => {
    try {
      const slice = isTruncated
        ? filteredData.slice(0, MAX_DISPLAY)
        : filteredData;
      await navigator.clipboard.writeText(JSON.stringify(slice, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [filteredData, isTruncated]);

  const handleDownload = useCallback(() => {
    const blob = new Blob(
      [JSON.stringify(filteredData, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredData]);

  /* --- Empty states --- */

  if (state.sourceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <Code2 size={48} strokeWidth={1} />
        <p className="text-sm">Load data to view JSON</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
        <Code2 size={48} strokeWidth={1} />
        <p className="text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">
            {jsonLines.length.toLocaleString()} lines
          </span>
          {isTruncated && (
            <span className="badge bg-amber-500/10 text-amber-600 dark:text-amber-400">
              Showing first {MAX_DISPLAY.toLocaleString()} records
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="btn-secondary py-1 px-2 text-xs"
            title="Copy JSON"
          >
            {copied ? (
              <Check size={12} className="text-emerald-500" />
            ) : (
              <Copy size={12} />
            )}
          </button>
          <button
            onClick={handleDownload}
            className="btn-secondary py-1 px-2 text-xs"
            title="Download JSON"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* Virtualized JSON */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto font-mono text-xs leading-5"
      >
        <div
          className="relative"
          style={{ height: rowVirtualizer.getTotalSize() }}
        >
          {rowVirtualizer.getVirtualItems().map(vRow => {
            const isOverflow =
              isTruncated && vRow.index === jsonLines.length;
            return (
              <div
                key={vRow.index}
                className="absolute top-0 left-0 w-full flex"
                style={{
                  height: vRow.size,
                  transform: `translateY(${vRow.start}px)`,
                }}
              >
                <span className="flex-shrink-0 w-14 text-right pr-4 text-slate-400 dark:text-slate-600 select-none">
                  {vRow.index + 1}
                </span>
                <span className="flex-1 whitespace-pre">
                  {isOverflow ? (
                    <span className="text-amber-500">
                      {'// … '}
                      {(
                        filteredData.length - MAX_DISPLAY
                      ).toLocaleString()}{' '}
                      more records truncated
                    </span>
                  ) : (
                    <HighlightedLine line={jsonLines[vRow.index]} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
