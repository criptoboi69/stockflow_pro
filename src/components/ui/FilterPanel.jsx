import React from 'react';

const FilterPanel = ({ title = 'Filtres', subtitle, right, children, className = '' }) => {
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 lg:p-6 ${className}`.trim()}>
      {(title || subtitle || right) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h3 className="text-sm lg:text-base font-medium text-text-primary">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-xs lg:text-sm text-text-muted">{subtitle}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}
      {children}
    </div>
  );
};

export default FilterPanel;
