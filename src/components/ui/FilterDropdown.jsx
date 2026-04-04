import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const normalizeValues = (value, multi) => {
  if (multi) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === '') return [];
    return [value];
  }
  return value ?? '';
};

const FilterDropdown = ({
  label,
  value,
  onChange,
  options = [],
  multi = false,
  placeholder,
  className = '',
  icon = 'ChevronDown',
  buttonIcon = null,
}) => {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(normalizeValues(value, multi));
  const ref = useRef(null);

  useEffect(() => {
    setDraftValue(normalizeValues(value, multi));
  }, [value, multi]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!ref.current?.contains(event.target)) {
        setOpen(false);
        setDraftValue(normalizeValues(value, multi));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, multi]);

  const selectedLabels = useMemo(() => {
    if (multi) {
      const selected = normalizeValues(value, true);
      return options.filter((option) => selected.includes(option.value)).map((option) => option.label);
    }
    return options.find((option) => option.value === value)?.label || '';
  }, [multi, options, value]);

  const buttonLabel = useMemo(() => {
    if (multi) {
      if (!selectedLabels.length) return placeholder || label;
      if (selectedLabels.length === 1) return `${label} : ${selectedLabels[0]}`;
      return `${label} : ${selectedLabels.length} sélectionnés`;
    }
    return value && value !== 'all' ? `${label} : ${selectedLabels}` : (placeholder || label);
  }, [label, multi, placeholder, selectedLabels, value]);

  const hasValue = multi
    ? normalizeValues(value, true).length > 0
    : value !== undefined && value !== null && value !== '' && value !== 'all';

  const toggleOption = (optionValue) => {
    if (!multi) {
      setDraftValue(optionValue);
      return;
    }

    setDraftValue((current) => (
      current.includes(optionValue)
        ? current.filter((item) => item !== optionValue)
        : [...current, optionValue]
    ));
  };

  const handleApply = () => {
    onChange?.(draftValue);
    setOpen(false);
  };

  const handleReset = () => {
    const resetValue = multi ? [] : '';
    setDraftValue(resetValue);
    onChange?.(resetValue);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex min-h-11 w-full md:w-auto items-center justify-between gap-2 rounded-xl border px-3 text-sm font-medium transition-colors ${hasValue ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-background text-text-primary hover:bg-muted'}`}
      >
        {buttonIcon && <Icon name={buttonIcon} size={14} className="shrink-0" />}
        <span className="truncate text-left flex-1 md:max-w-[180px]">{buttonLabel}</span>
        <Icon name={icon} size={14} className={`${open ? 'rotate-180' : ''} transition-transform`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 md:left-auto md:right-0 z-50 mt-2 w-full md:w-72 rounded-2xl border border-border bg-popover p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-text-primary">{label}</div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-text-muted hover:text-text-primary"
            >
              Réinitialiser
            </button>
          </div>

          <div className="space-y-1 max-h-64 overflow-auto pr-1">
            {options.map((option) => {
              const checked = multi
                ? normalizeValues(draftValue, true).includes(option.value)
                : draftValue === option.value;

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted"
                >
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={label}
                    checked={checked}
                    onChange={() => toggleOption(option.value)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text-primary">{option.label}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleApply}>
              Appliquer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
