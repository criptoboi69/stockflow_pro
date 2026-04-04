import React from 'react';
import Button from './Button';
import { cn } from '../../utils/cn';

const PageHeader = ({
  title,
  subtitle,
  icon = null,
  actionButton,
  actionButtonProps = {},
  secondaryButton,
  secondaryButtonProps = {},
  actions = null,
  className = '',
  innerClassName = '',
}) => {
  return (
    <div className={cn('bg-surface border-b border-border', className)}>
      <div className={cn('max-w-7xl mx-auto px-4 lg:px-6 py-4', innerClassName)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-semibold text-text-primary">{title}</h1>
              {/* subtitle removed */}
            </div>
          </div>

          <div className="flex items-stretch gap-2 flex-col w-full sm:w-auto sm:flex-row sm:items-center sm:flex-wrap sm:justify-end">
            {actions || (
              <>
                {secondaryButton && (
                  <Button variant="outline" size="sm" {...secondaryButtonProps}>
                    {secondaryButton}
                  </Button>
                )}
                {actionButton && (
                  <Button size="sm" {...actionButtonProps}>
                    {actionButton}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
