import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProgressTracker = ({ operation, onClose, onDownload }) => {
  if (!operation) return null;

  const { type, progress, status, results, logs } = operation;

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Icon name="Loader2" size={20} className="text-accent animate-spin" />;
      case 'completed':
        return <Icon name="CheckCircle" size={20} className="text-success" />;
      case 'error':
        return <Icon name="XCircle" size={20} className="text-error" />;
      default:
        return <Icon name="Clock" size={20} className="text-text-muted" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return type === 'import' ? 'Importing products...' : 'Generating export...';
      case 'completed':
        return type === 'import' ? 'Import completed successfully' : 'Export ready for download';
      case 'error':
        return type === 'import' ? 'Import failed' : 'Export failed';
      default:
        return 'Preparing...';
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              {type === 'import' ? 'Import Progress' : 'Export Progress'}
            </h3>
            <p className="text-sm text-text-muted">{getStatusText()}</p>
          </div>
        </div>
        {status === 'completed' || status === 'error' ? (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={16} />
          </Button>
        ) : null}
      </div>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Progress</span>
          <span className="text-sm text-text-muted">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status === 'error' ? 'bg-error' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {/* Results Summary */}
      {results && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-success/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="Check" size={16} className="text-success" />
              <span className="text-sm font-medium text-success">Created</span>
            </div>
            <p className="text-2xl font-bold text-success">{results?.created}</p>
          </div>
          <div className="bg-warning/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="AlertTriangle" size={16} className="text-warning" />
              <span className="text-sm font-medium text-warning">Ignored</span>
            </div>
            <p className="text-2xl font-bold text-warning">{results?.ignored}</p>
          </div>
          <div className="bg-error/10 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Icon name="X" size={16} className="text-error" />
              <span className="text-sm font-medium text-error">Errors</span>
            </div>
            <p className="text-2xl font-bold text-error">{results?.errors}</p>
          </div>
        </div>
      )}
      {/* Activity Log */}
      {logs && logs?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-3">Activity Log</h4>
          <div className="bg-muted rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {logs?.map((log, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-text-muted font-mono text-xs mt-0.5">
                    {log?.timestamp}
                  </span>
                  <span className={`
                    ${log?.level === 'error' ? 'text-error' :
                      log?.level === 'warning'? 'text-warning' : 'text-text-primary'
                    }
                  `}>
                    {log?.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Action Buttons */}
      {status === 'completed' && type === 'export' && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="default"
            iconName="Download"
            iconPosition="left"
            onClick={onDownload}
          >
            Download File
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;