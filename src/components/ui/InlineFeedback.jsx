import React from 'react';
import Icon from '../AppIcon';

const styles = {
  success: 'bg-success/10 border-success/20 text-success',
  error: 'bg-error/10 border-error/20 text-error',
  info: 'bg-info/10 border-info/20 text-info',
  warning: 'bg-warning/10 border-warning/20 text-warning'
};

const icons = {
  success: 'CheckCircle',
  error: 'AlertCircle',
  info: 'Info',
  warning: 'AlertTriangle'
};

const InlineFeedback = ({ type = 'info', message }) => {
  if (!message) return null;

  return (
    <div className={`rounded-lg border p-4 flex items-start gap-3 ${styles[type] || styles.info}`}>
      <Icon name={icons[type] || icons.info} size={18} className="mt-0.5" />
      <div className="text-sm font-medium">{message}</div>
    </div>
  );
};

export default InlineFeedback;
