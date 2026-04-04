import React, { useState } from 'react';
import Button from './Button';
import Icon from '../AppIcon';
import FilterPanel from './FilterPanel';

const CollapsibleFilterPanel = ({
  title = 'Filtres',
  active = false,
  defaultOpen = false,
  children,
  right,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <FilterPanel title={null} right={right} className={className}>
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full justify-between"
        >
          <span className="flex items-center">
            <Icon name="Filter" size={16} className="mr-2" />
            {title} {active ? '(actifs)' : ''}
          </span>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} />
        </Button>
      </div>

      <div className={open ? '' : 'hidden'}>{children}</div>
    </FilterPanel>
  );
};

export default CollapsibleFilterPanel;
