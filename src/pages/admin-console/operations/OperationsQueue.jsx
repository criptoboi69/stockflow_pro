import React from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Icon from '../../../components/AppIcon';

const OperationsQueue = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Opérations"
        subtitle="File d'attente et historique des opérations bulk"
      />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="text-center py-12">
          <Icon name="Activity" size={48} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-primary font-medium">File d'attente des opérations</p>
          <p className="text-sm text-text-muted mt-1">(À implémenter)</p>
        </div>
      </div>
    </div>
  );
};

export default OperationsQueue;
