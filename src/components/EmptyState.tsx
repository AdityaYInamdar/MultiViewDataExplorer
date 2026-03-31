import { Database, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onGenerateData: () => void;
}

export function EmptyState({ onGenerateData }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
        <div className="accent-gradient w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/25">
          <Database size={32} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Welcome to{' '}
          <span className="accent-gradient-text">Data Explorer</span>
        </h2>

        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
          Explore your datasets through synchronized table, graph, and JSON
          views. Generate sample data or upload your own JSON file to get
          started.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={onGenerateData} className="btn-primary w-full sm:w-auto">
            <Sparkles size={16} />
            Generate Sample Data
          </button>
          <span className="text-xs text-slate-400">
            or use the Data menu above
          </span>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '📊', label: 'Table View', desc: 'Virtualized rows' },
            { icon: '📈', label: 'Graph View', desc: 'Aggregate charts' },
            { icon: '{ }', label: 'JSON View', desc: 'Raw data' },
          ].map(item => (
            <div key={item.label} className="glass-panel-subtle p-3 rounded-xl">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xs font-medium">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
