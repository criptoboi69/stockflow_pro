import React from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const chipBase = 'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors';

const ListFilterBar = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  searchInput,
  filters = null,
  actions = null,
  resultLabel,
  activeChips = [],
  onReset,
  resetLabel = 'Réinitialiser',
  className = '',
}) => {
  return (
    <div className={`space-y-4 rounded-2xl border border-border bg-surface p-4 lg:p-5 shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-full xl:max-w-xl">
          {searchInput || (
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-border bg-input px-10 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2">
          {filters}
          {actions}
          {onReset && (
            <Button
              variant="outline"
              onClick={onReset}
              iconName="RotateCcw"
              iconPosition="left"
              className="text-sm rounded-xl"
            >
              {resetLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-text-muted">{resultLabel}</div>

        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className={`${chipBase} ${chip.variant === 'primary' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-text-primary border-border'}`}
            >
              {chip.icon && <Icon name={chip.icon} size={12} />}
              <span>{chip.label}</span>
              <Icon name="X" size={12} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListFilterBar;
