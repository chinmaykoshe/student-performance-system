import React from 'react';

export const PageShell = ({ children, maxWidth = 'max-w-[1400px]' }) => (
  <main className={`flex-1 p-6 md:p-10 ${maxWidth} mx-auto w-full space-y-8`}>
    {children}
  </main>
);

export const StatCard = ({ title, value, icon, trend, tone = 'neutral' }) => {
  const toneClass = {
    neutral: 'bg-slate-50 text-slate-900 border-slate-100',
    brand: 'bg-brand-100 text-brand-600 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
  }[tone] || 'bg-slate-50 text-slate-900 border-slate-100';

  return (
    <div className="glass-card flex flex-col justify-between min-h-36">
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        <div className={`p-2 rounded-xl border ${toneClass}`}>{icon}</div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
        {trend && (
          <p className="mt-2 text-xs font-medium text-slate-500">{trend}</p>
        )}
      </div>
    </div>
  );
};

export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Toolbar = ({ children }) => (
  <div className="glass-card p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    {children}
  </div>
);

export const SearchField = ({ value, onChange, placeholder, icon }) => (
  <div className="relative w-full lg:max-w-md">
    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
      {icon}
    </div>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="glass-input w-full rounded-full pl-11 pr-4 py-3"
      placeholder={placeholder}
    />
  </div>
);

export const SelectField = ({ value, onChange, children, className = '' }) => (
  <select
    value={value}
    onChange={onChange}
    className={`glass-input rounded-full py-3 pl-4 pr-10 bg-white ${className}`}
  >
    {children}
  </select>
);

export const PrimaryButton = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(0,0,0,0.45)] transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const SecondaryButton = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const IconButton = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Badge = ({ children, tone = 'neutral', className = '' }) => {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    dark: 'bg-slate-900 text-white',
  }[tone] || 'bg-slate-100 text-slate-600';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${toneClass} ${className}`}>
      {children}
    </span>
  );
};

export const TableCard = ({ children }) => (
  <div className="glass-card p-0 overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex min-h-80 flex-col items-center justify-center text-center px-6">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Modal = ({ title, children, onClose, width = 'max-w-2xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
    <div className={`glass-card relative my-8 w-full ${width} shadow-2xl`}>
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
        aria-label="Close dialog"
      >
        x
      </button>
      <h3 className="mb-6 text-xl font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  </div>
);
