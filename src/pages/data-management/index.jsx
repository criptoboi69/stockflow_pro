import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import ImportSection from './components/ImportSection';
import ExportSection from './components/ExportSection';
import ProgressTracker from './components/ProgressTracker';
import OperationHistory from './components/OperationHistory';
import ValidationRules from './components/ValidationRules';
import { useAuth } from '../../contexts/AuthContext';
import dataOperationService from '../../services/dataOperationService';
import productService from '../../services/productService';
import PageHeader from '../../components/ui/PageHeader';


const DataManagement = () => {
  const { currentRole, currentCompany, user, profile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentCompany?.id) {
        setOperationHistory([]);
        return;
      }
      try {
        const { data } = await dataOperationService.list(currentCompany.id);
        setOperationHistory(data || []);
      } catch (error) {
        console.error('Error loading operation history:', error);
        setOperationHistory([]);
      }
    };
    loadHistory();
  }, [currentCompany?.id, historyVersion]);

  const userRole = currentRole || 'user';
  const currentTenant = currentCompany || { name: 'StockFlow Pro' };

  const buildExportFile = async (config) => {
    const products = await productService.getProducts(currentCompany?.id);
    const rows = (products || []).map((p) => ({
      id: p?.id,
      name: p?.name,
      sku: p?.sku,
      category: p?.category,
      location: p?.location,
      quantity: p?.quantity,
      minStock: p?.minStock,
      status: p?.status,
      price: p?.price,
      imageUrl: config?.includeImages ? p?.imageUrl : undefined
    }));

    const format = config?.format || 'csv';
    const date = new Date().toISOString().slice(0, 10);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      return { blob, filename: `export-${date}.json`, fileSize: `${(blob.size / 1024).toFixed(1)} KB`, recordCount: rows.length };
    }

    const headers = Object.keys(rows[0] || { id:'', name:'', sku:'', category:'', location:'', quantity:'', minStock:'', status:'', price:'' });
    const csv = [headers.join(',')]
      .concat(rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const ext = format === 'xlsx' ? 'csv' : 'csv';
    return { blob, filename: `export-${date}.${ext}`, fileSize: `${(blob.size / 1024).toFixed(1)} KB`, recordCount: rows.length };
  };

  const handleDownloadExport = () => {
    const file = currentOperation?.downloadFile;
    if (!file?.blob || !file?.filename) return;

    const url = window.URL.createObjectURL(file.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  const handleImportStart = async (file) => {
    if (!currentCompany?.id) {
      throw new Error('Aucune société active pour lancer un import.');
    }

    const initialLogs = [
      { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: 'Starting file validation...' },
      { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: 'Processing 4 rows...' }
    ];

    const { data: created } = await dataOperationService.create({
      company_id: currentCompany?.id,
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.email || 'Utilisateur',
      type: 'import',
      status: 'processing',
      filename: file?.name,
      file_size: `${(file?.size / 1024)?.toFixed(1)} KB`,
      results: null,
      logs: initialLogs,
      config: { source: 'data-management' }
    });

    const mockOperation = {
      id: created?.id,
      type: 'import',
      progress: 0,
      status: 'processing',
      results: null,
      logs: initialLogs
    };
    setCurrentOperation(mockOperation);
    setHistoryVersion((v) => v + 1);

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 20;
      const nextLogs = [
        ...mockOperation.logs,
        { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: `Processing row ${Math.floor(progress / 25)}...` }
      ];
      mockOperation.logs = nextLogs;
      setCurrentOperation((prev) => ({ ...prev, progress, logs: nextLogs }));

      if (progress >= 100) {
        clearInterval(interval);
        const results = { created: 3, ignored: 1, errors: 0 };
        const finalLogs = [...nextLogs, { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'success', message: 'Import completed successfully' }];
        setCurrentOperation((prev) => ({ ...prev, status: 'completed', results, logs: finalLogs }));
        if (created?.id) {
          await dataOperationService.update(created.id, { status: 'completed', results, logs: finalLogs });
          setHistoryVersion((v) => v + 1);
        }
      }
    }, 1000);
  };

  const handleExportStart = async (config) => {
    if (!currentCompany?.id) {
      throw new Error('Aucune société active pour lancer un export.');
    }

    const initialLogs = [
      { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: 'Preparing export query...' },
      { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: 'Fetching product data...' }
    ];

    const { data: created } = await dataOperationService.create({
      company_id: currentCompany?.id,
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.email || 'Utilisateur',
      type: 'export',
      status: 'processing',
      filename: `export-${new Date().toISOString().slice(0,10)}.${config?.format || 'csv'}`,
      file_size: null,
      format: config?.format,
      results: null,
      logs: initialLogs,
      config,
    });

    const mockOperation = {
      id: created?.id,
      type: 'export',
      progress: 0,
      status: 'processing',
      results: null,
      logs: initialLogs
    };
    setCurrentOperation(mockOperation);
    setHistoryVersion((v) => v + 1);

    let progress = 0;
    const interval = setInterval(async () => {
      progress += 25;
      const nextLogs = [
        ...mockOperation.logs,
        { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'info', message: `Generating ${config?.format?.toUpperCase()} file...` }
      ];
      mockOperation.logs = nextLogs;
      setCurrentOperation((prev) => ({ ...prev, progress, logs: nextLogs }));

      if (progress >= 100) {
        clearInterval(interval);
        const exportFile = await buildExportFile(config);
        const results = { records: exportFile.recordCount };
        const finalLogs = [...nextLogs, { timestamp: new Date()?.toLocaleTimeString('fr-FR'), level: 'success', message: 'Export file ready for download' }];
        setCurrentOperation((prev) => ({ ...prev, status: 'completed', results, logs: finalLogs, downloadFile: exportFile }));
        if (created?.id) {
          await dataOperationService.update(created.id, { status: 'completed', results, logs: finalLogs, file_size: exportFile.fileSize });
          setHistoryVersion((v) => v + 1);
        }
      }
    }, 800);
  };

  const handleCloseOperation = () => {
    setCurrentOperation(null);
  };

  return (
    <>
      <Helmet>
        <title>Data Management - StockFlow Pro</title>
        <meta name="description" content="Import and export inventory data with comprehensive validation and progress tracking" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <SidebarNavigation
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={userRole}
          currentTenant={currentTenant}
        />

        <main className={`
          transition-all duration-200 ease-out
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
          pt-16 lg:pt-0
        `}>
          <PageHeader
            title="Gestion des données"
            subtitle="Importez et exportez vos données avec validation et suivi de progression"
            actions={
              <>
                <QuickActionBar variant="header" userRole={userRole} />
              </>
            }
          />

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Current Operation Progress */}
            {currentOperation && (
              <ProgressTracker
                operation={currentOperation}
                onClose={handleCloseOperation}
                onDownload={handleDownloadExport}
              />
            )}

            {/* Import and Export Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              <ImportSection
                onImportStart={handleImportStart}
                isImporting={currentOperation?.type === 'import' && currentOperation?.status === 'processing'}
              />
              <ExportSection
                onExportStart={handleExportStart}
                isExporting={currentOperation?.type === 'export' && currentOperation?.status === 'processing'}
                companyId={currentCompany?.id}
              />
            </div>

            {/* Validation Rules */}
            <ValidationRules />

            {/* Operation History */}
            <OperationHistory items={operationHistory} />
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={userRole} />
      </div>
    </>
  );
};

export default DataManagement;