interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 shrink-0">
      <div className="min-w-0 mr-3">
        <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 truncate">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}
