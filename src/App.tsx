import { useCallback } from 'react';
import {
  DataExplorerProvider,
  useDataExplorer,
} from './context/DataExplorerContext';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TableView } from './components/TableView';
import { GraphView } from './components/GraphView';
import { JsonView } from './components/JsonView';
import { ViewPanel } from './components/ViewPanel';
import { EmptyState } from './components/EmptyState';
import { generateSampleData } from './utils/generateData';
import { Table2, BarChart3, Code2, Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Inner shell (needs context)                                        */
/* ------------------------------------------------------------------ */

function DataExplorerApp() {
  const { state, setData } = useDataExplorer();

  const handleGenerateData = useCallback(() => {
    const data = generateSampleData(50_000);
    setData(data, 'Sample Dataset (50,000 records)');
  }, [setData]);

  /* Loading */
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2
              size={32}
              className="animate-spin text-violet-500 mx-auto mb-3"
            />
            <p className="text-sm text-slate-400">Loading dataset…</p>
          </div>
        </div>
      </div>
    );
  }

  /* No data yet */
  if (state.sourceData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <EmptyState onGenerateData={handleGenerateData} />
      </div>
    );
  }

  /* Determine visible views */
  const showTable =
    state.viewMode === 'dashboard' || state.viewMode === 'table';
  const showGraph =
    state.viewMode === 'dashboard' || state.viewMode === 'graph';
  const showJson =
    state.viewMode === 'dashboard' || state.viewMode === 'json';
  const single = state.viewMode !== 'dashboard';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <FilterBar />

      <main className="flex-1 p-3 sm:p-4 max-w-[1920px] mx-auto w-full">
        {single ? (
          /* ---- Single view ---- */
          <div className="h-[calc(100vh-180px)]">
            {showTable && (
              <ViewPanel
                title="Table View"
                icon={<Table2 size={16} />}
                className="h-full"
              >
                <TableView />
              </ViewPanel>
            )}
            {showGraph && (
              <ViewPanel
                title="Graph View"
                icon={<BarChart3 size={16} />}
                className="h-full"
              >
                <GraphView />
              </ViewPanel>
            )}
            {showJson && (
              <ViewPanel
                title="Raw JSON"
                icon={<Code2 size={16} />}
                className="h-full"
              >
                <JsonView />
              </ViewPanel>
            )}
          </div>
        ) : (
          /* ---- Dashboard ---- */
          <div className="flex flex-col gap-3 sm:gap-4">
            <ViewPanel
              title="Table View"
              icon={<Table2 size={16} />}
              className="h-[45vh] min-h-[300px]"
            >
              <TableView />
            </ViewPanel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <ViewPanel
                title="Graph View"
                icon={<BarChart3 size={16} />}
                className="h-[40vh] min-h-[300px]"
              >
                <GraphView />
              </ViewPanel>
              <ViewPanel
                title="Raw JSON"
                icon={<Code2 size={16} />}
                className="h-[40vh] min-h-[300px]"
              >
                <JsonView />
              </ViewPanel>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <DataExplorerProvider>
      <DataExplorerApp />
    </DataExplorerProvider>
  );
}
