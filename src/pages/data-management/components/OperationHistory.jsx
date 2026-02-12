import React, { useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const OperationHistory = ({ operations = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icon name='CheckCircle' size={16} className='text-success' />;
      case 'error':
        return <Icon name='XCircle' size={16} className='text-error' />;
      case 'processing':
        return <Icon name='Loader2' size={16} className='text-accent animate-spin' />;
      default:
        return <Icon name='Clock' size={16} className='text-text-muted' />;
    }
  };

  const getTypeIcon = (type) =>
    type === 'import' ? <Icon name='Upload' size={16} className='text-primary' /> : <Icon name='Download' size={16} className='text-accent' />;

  const filteredHistory = useMemo(
    () =>
      operations.filter((item) => {
        const target = `${item?.filename || ''} ${item?.user || ''}`.toLowerCase();
        const matchesSearch = target.includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || item?.type === filterType;
        return matchesSearch && matchesFilter;
      }),
    [operations, searchTerm, filterType]
  );

  return (
    <div className='bg-card rounded-2xl border border-border p-6 card-shadow'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h2 className='text-xl font-semibold text-text-primary'>Operation History</h2>
          <p className='text-sm text-text-muted mt-1'>Recent import and export operations</p>
        </div>
        <div className='flex bg-muted rounded-lg p-1'>
          <Button variant={filterType === 'all' ? 'default' : 'ghost'} size='sm' onClick={() => setFilterType('all')}>All</Button>
          <Button variant={filterType === 'import' ? 'default' : 'ghost'} size='sm' onClick={() => setFilterType('import')}>Imports</Button>
          <Button variant={filterType === 'export' ? 'default' : 'ghost'} size='sm' onClick={() => setFilterType('export')}>Exports</Button>
        </div>
      </div>

      <div className='mb-4'>
        <Input type='search' placeholder='Search by filename or user...' value={searchTerm} onChange={(e) => setSearchTerm(e?.target?.value)} className='max-w-md' />
      </div>

      <div className='space-y-3'>
        {filteredHistory.map((item) => (
          <div key={item?.id} className='border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  {getTypeIcon(item?.type)}
                  {getStatusIcon(item?.status)}
                </div>
                <div>
                  <p className='font-medium text-text-primary'>{item?.filename}</p>
                  <div className='flex items-center space-x-4 text-sm text-text-muted'>
                    <span>by {item?.user}</span>
                    <span>{new Date(item?.timestamp).toLocaleString('fr-FR')}</span>
                    <span>{item?.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center space-x-4'>
                {item?.type === 'import' && item?.results && (
                  <div className='flex items-center space-x-3 text-sm'>
                    <span className='text-success'>+{item?.results?.created || 0}</span>
                    <span className='text-warning'>~{item?.results?.ignored || 0}</span>
                    <span className='text-error'>!{item?.results?.errors || 0}</span>
                  </div>
                )}
                {item?.type === 'export' && item?.results && <div className='text-sm text-text-muted'>{item?.results?.records || 0} records</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className='text-center py-8'>
          <Icon name='FileX' size={48} className='text-text-muted mx-auto mb-3' />
          <p className='text-text-muted'>No operations found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default OperationHistory;
