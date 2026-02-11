import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const OperationHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const mockHistory = [
  {
    id: 1,
    type: 'import',
    filename: 'products_batch_001.csv',
    user: 'Marie Dubois',
    userAvatar: "https://images.unsplash.com/photo-1706565029071-f8f70ce91e71",
    userAvatarAlt: 'Professional headshot of woman with brown hair in white blazer',
    timestamp: '2024-10-25T11:30:00Z',
    status: 'completed',
    results: { created: 45, ignored: 3, errors: 2 },
    fileSize: '2.3 MB'
  },
  {
    id: 2,
    type: 'export',
    filename: 'inventory_report_october.xlsx',
    user: 'Jean Martin',
    userAvatar: "https://images.unsplash.com/photo-1588178457501-31b7688a41a0",
    userAvatarAlt: 'Professional headshot of man with short brown hair in navy suit',
    timestamp: '2024-10-25T09:15:00Z',
    status: 'completed',
    results: { records: 1247 },
    fileSize: '4.1 MB'
  },
  {
    id: 3,
    type: 'import',
    filename: 'new_products_electronics.csv',
    user: 'Sophie Laurent',
    userAvatar: "https://images.unsplash.com/photo-1688597628916-d3230d8ac41e",
    userAvatarAlt: 'Professional headshot of woman with blonde hair in black blazer',
    timestamp: '2024-10-24T16:45:00Z',
    status: 'error',
    results: { created: 0, ignored: 15, errors: 15 },
    fileSize: '1.8 MB'
  },
  {
    id: 4,
    type: 'export',
    filename: 'stock_movements_q3.csv',
    user: 'Pierre Moreau',
    userAvatar: "https://images.unsplash.com/photo-1627729205753-52d2ddeefce1",
    userAvatarAlt: 'Professional headshot of man with dark hair and beard in gray shirt',
    timestamp: '2024-10-24T14:20:00Z',
    status: 'completed',
    results: { records: 892 },
    fileSize: '3.2 MB'
  },
  {
    id: 5,
    type: 'import',
    filename: 'furniture_catalog_update.csv',
    user: 'Marie Dubois',
    userAvatar: "https://images.unsplash.com/photo-1706565029071-f8f70ce91e71",
    userAvatarAlt: 'Professional headshot of woman with brown hair in white blazer',
    timestamp: '2024-10-23T10:30:00Z',
    status: 'completed',
    results: { created: 28, ignored: 1, errors: 0 },
    fileSize: '1.5 MB'
  }];


  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Icon name="CheckCircle" size={16} className="text-success" />;
      case 'error':
        return <Icon name="XCircle" size={16} className="text-error" />;
      case 'processing':
        return <Icon name="Loader2" size={16} className="text-accent animate-spin" />;
      default:
        return <Icon name="Clock" size={16} className="text-text-muted" />;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'import' ?
    <Icon name="Upload" size={16} className="text-primary" /> :
    <Icon name="Download" size={16} className="text-accent" />;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp)?.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = mockHistory?.filter((item) => {
    const matchesSearch = item?.filename?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
    item?.user?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesFilter = filterType === 'all' || item?.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Operation History</h2>
          <p className="text-sm text-text-muted mt-1">Recent import and export operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={filterType === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}>

              All
            </Button>
            <Button
              variant={filterType === 'import' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('import')}>

              Imports
            </Button>
            <Button
              variant={filterType === 'export' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('export')}>

              Exports
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search by filename or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="max-w-md" />

      </div>
      <div className="space-y-3">
        {filteredHistory?.map((item) =>
        <div key={item?.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item?.type)}
                  {getStatusIcon(item?.status)}
                </div>
                <div className="flex items-center space-x-3">
                  <img
                  src={item?.userAvatar}
                  alt={item?.userAvatarAlt}
                  className="w-8 h-8 rounded-full object-cover" />

                  <div>
                    <p className="font-medium text-text-primary">{item?.filename}</p>
                    <div className="flex items-center space-x-4 text-sm text-text-muted">
                      <span>by {item?.user}</span>
                      <span>{formatDate(item?.timestamp)}</span>
                      <span>{item?.fileSize}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {item?.type === 'import' && item?.results &&
              <div className="flex items-center space-x-3 text-sm">
                    <span className="text-success">+{item?.results?.created}</span>
                    {item?.results?.ignored > 0 &&
                <span className="text-warning">~{item?.results?.ignored}</span>
                }
                    {item?.results?.errors > 0 &&
                <span className="text-error">!{item?.results?.errors}</span>
                }
                  </div>
              }
                
                {item?.type === 'export' && item?.results &&
              <div className="text-sm text-text-muted">
                    {item?.results?.records} records
                  </div>
              }

                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" title="View details">
                    <Icon name="Eye" size={16} />
                  </Button>
                  {item?.status === 'completed' &&
                <Button variant="ghost" size="icon" title="Download">
                      <Icon name="Download" size={16} />
                    </Button>
                }
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {filteredHistory?.length === 0 &&
      <div className="text-center py-8">
          <Icon name="FileX" size={48} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No operations found matching your criteria</p>
        </div>
      }
    </div>);

};

export default OperationHistory;