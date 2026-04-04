import React, { useEffect, useState } from 'react';
import productService from '../../../services/productService';
import dataOperationService from '../../../services/dataOperationService';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const OperationHistory = ({ companyId, refreshKey = 0 }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId) {
        setHistory([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await dataOperationService.list(companyId);
      setHistory(data || []);
      setLoading(false);
    };
    load();
  }, [companyId, refreshKey]);

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
    return type === 'import'
      ? <Icon name="Upload" size={16} className="text-primary" />
      : <Icon name="Download" size={16} className="text-accent" />;
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

  const downloadExport = async (item) => {
    try {
      if (!companyId) return;
      const products = await productService.getProducts(companyId);
      const rows = products || [];

      if ((item?.format || item?.filename?.split('.')?.pop() || 'csv') === 'json') {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item?.filename || 'export.json';
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }

      const headers = ['name', 'sku', 'category', 'quantity', 'price', 'status', 'location', 'description'];
      const escapeCell = (value) => {
        const str = String(value ?? '');
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replaceAll('"', '""') + '"';
        }
        return str;
      };
      const csv = [
        headers.join(';'),
        ...rows.map((row) => headers.map((h) => escapeCell(row?.[h])).join(';'))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item?.filename || 'export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading export:', error);
    }
  };

  const filteredHistory = history?.filter((item) => {
    const matchesSearch = item?.filename?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      item?.user_name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      item?.user_email?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesFilter = filterType === 'all' || item?.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Historique des opérations</h2>
          <p className="text-sm text-text-muted mt-1">Imports et exports récents enregistrés en base</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-muted rounded-lg p-1">
            <Button variant={filterType === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterType('all')}>Tous</Button>
            <Button variant={filterType === 'import' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterType('import')}>Imports</Button>
            <Button variant={filterType === 'export' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterType('export')}>Exports</Button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Rechercher par fichier ou utilisateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e?.target?.value)}
          className="max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-sm text-text-muted py-6">Chargement de l'historique...</div>
      ) : (
        <div className="space-y-3">
          {filteredHistory?.map((item) => (
            <div key={item?.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item?.type)}
                    {getStatusIcon(item?.status)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Icon name="User" size={16} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{item?.filename}</p>
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <span>par {item?.user_name || item?.user_email || 'Utilisateur'}</span>
                        <span>{formatDate(item?.created_at)}</span>
                        <span>{item?.file_size || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {item?.type === 'import' && item?.results && (
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-success">+{item?.results?.created}</span>
                      {item?.results?.ignored > 0 && <span className="text-warning">~{item?.results?.ignored}</span>}
                      {item?.results?.errors > 0 && <span className="text-error">!{item?.results?.errors}</span>}
                    </div>
                  )}

                  {item?.type === 'export' && item?.results && (
                    <div className="text-sm text-text-muted">{item?.results?.records} enregistrements</div>
                  )}

                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" title="Voir détails">
                      <Icon name="Eye" size={16} />
                    </Button>
                    {item?.status === 'completed' && item?.type === 'export' && (
                      <Button variant="ghost" size="icon" title="Télécharger" onClick={() => downloadExport(item)}>
                        <Icon name="Download" size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredHistory?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="FileX" size={48} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Aucune opération trouvée</p>
        </div>
      )}
    </div>
  );
};

export default OperationHistory;
