import React from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const ViewModeToggle = ({ value, onChange, options = [] }) => {
  return (
    <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-9 w-9 p-0 rounded-lg"
          title={option.label}
        >
          <Icon name={option.icon} size={16} />
        </Button>
      ))}
    </div>
  );
};

export default ViewModeToggle;
