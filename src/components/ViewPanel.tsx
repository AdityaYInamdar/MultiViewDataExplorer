import { ReactNode } from 'react';

interface ViewPanelProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  headerExtra?: ReactNode;
}

export function ViewPanel({
  title,
  icon,
  children,
  className = '',
  headerExtra,
}: ViewPanelProps) {
  return (
    <div
      className={`glass-panel flex flex-col overflow-hidden animate-fade-in ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-violet-500">{icon}</span>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        </div>
        {headerExtra}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
