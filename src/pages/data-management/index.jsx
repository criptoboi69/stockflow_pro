import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import ImportSection from './components/ImportSection';
import ExportSection from './components/ExportSection';
import ProgressTracker from './components/ProgressTracker';
import OperationHistory from './components/OperationHistory';
import ValidationRules from './components/ValidationRules';
import RateLimitIndicator from './components/RateLimitIndicator';
import { useAuth } from '../../contexts/AuthContext';
import productService from '../../services/productService';
import stockMovementService from '../../services/stockMovementService';
import { getLocalStorageJson } from '../../utils/storage';

const HISTORY_KEY = 'dataManagementHistory';

const DataManagement = () => {
  const { currentRole, currentCompany, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [history, setHistory] = useState(() => getLocalStorageJson(HISTORY_KEY, []));

  const userRole = currentRole || 'user';
  const currentTenant = currentCompany || { name: 'StockFlow Pro' };

  const saveHistory = (nextHistory) => {
    setHistory(nextHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const appendHistory = (entry) => {
    const nextHistory = [entry, ...history].slice(0, 50);
    saveHistory(nextHistory);
  };

  const parseCsvProducts = async (fileText) => {
    const lines = fileText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idx = {
      name: headers.indexOf('name'),
      sku: headers.indexOf('sku'),
      category: headers.indexOf('category'),
      quantity: headers.indexOf('quantity'),
      location: headers.indexOf('location'),
      description: headers.indexOf('description')
    };

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      return {
        name: values[idx.name] || '',
        sku: values[idx.sku] || '',
        category: values[idx.category] || 'Non classé',
        quantity: Number(values[idx.quantity] || 0),
        location: values[idx.location] || 'Non défini',
        description: values[idx.description] || ''
      };
    });
  };

  const handleImportStart = async (file) => {
    if (!currentCompany?.id || !user?.id) return;

    const startedAt = new Date();
    setCurrentOperation({
      type: 'import',
      progress: 5,
      status: 'processing',
      results: null,
      logs: [{ timestamp: startedAt.toLocaleTimeString('fr-FR'), level: 'info', message: `Lecture du fichier ${file?.name}...` }]
    });

    try {
      const text = await file.text();
      const rows = await parseCsvProducts(text);

      setCurrentOperation((prev) => ({
        ...prev,
        progress: 30,
        logs: [...prev.logs, { timestamp: new Date().toLocaleTimeString('fr-FR'), level: 'info', message: `${rows.length} lignes détectées` }]
      }));

      const existingProducts = await productService.getProducts(currentCompany.id);
      const bySku = new Map(existingProducts.map((p) => [p.sku, p]));

      let created = 0;
      let ignored = 0;
      let errors = 0;

      for (const row of rows) {
        if (!row.name || !row.sku || Number.isNaN(row.quantity) || row.quantity < 0) {
          errors += 1;
          continue;
        }

        const existing = bySku.get(row.sku);
        if (existing) {
          ignored += 1;
          continue;
        }

        await productService.createProduct({
          name: row.name,
          sku: row.sku,
          category: row.category,
          quantity: row.quantity,
          location: row.location,
          description: row.description,
          status: row.quantity <= 0 ? 'out_of_stock' : row.quantity <= 10 ? 'low_stock' : 'in_stock'
        }, currentCompany.id, user.id);

        created += 1;
      }

      const completedAt = new Date();
      const results = { created, ignored, errors };

      setCurrentOperation((prev) => ({
        ...prev,
        progress: 100,
        status: errors > 0 && created === 0 ? 'error' : 'completed',
        results,
        logs: [...prev.logs, { timestamp: completedAt.toLocaleTimeString('fr-FR'), level: 'success', message: 'Import terminé' }]
      }));

      appendHistory({
        id: `imp-${Date.now()}`,
        type: 'import',
        filename: file?.name || 'import.csv',
        user: user?.email || 'unknown',
        timestamp: completedAt.toISOString(),
        status: errors > 0 && created === 0 ? 'error' : 'completed',
        results,
        fileSize: `${(file?.size / 1024).toFixed(1)} KB`
      });
    } catch (error) {
      setCurrentOperation((prev) => ({
        ...prev,
        progress: 100,
        status: 'error',
        results: { created: 0, ignored: 0, errors: 1 },
        logs: [...(prev?.logs || []), { timestamp: new Date().toLocaleTimeString('fr-FR'), level: 'error', message: error?.message || 'Import en échec' }]
      }));
    }
  };

  const exportRowsToFile = (rows, format) => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      return { blob, extension: 'json' };
    }

    const headers = ['name', 'sku', 'category', 'quantity', 'location', 'status'];
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r?.[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    return { blob, extension: format === 'xlsx' ? 'csv' : 'csv' };
  };

  const handleExportStart = async (config) => {
    if (!currentCompany?.id) return;

    setCurrentOperation({
      type: 'export',
      progress: 10,
      status: 'processing',
      results: null,
      logs: [{ timestamp: new Date().toLocaleTimeString('fr-FR'), level: 'info', message: 'Préparation de l’export...' }]
    });

    try {
      const products = await productService.getProducts(currentCompany.id);
      const movements = config?.includeMovements ? await stockMovementService.getStockMovements(currentCompany.id) : [];

      const categories = config?.categories || [];
      const filteredProducts = categories.length > 0 ? products.filter((p) => categories.includes(p.category)) : products;

      const rows = filteredProducts.map((p) => ({
        name: p.name,
        sku: p.sku,
        category: p.category,
        quantity: p.quantity,
        location: p.location,
        status: p.status,
        movementCount: config?.includeMovements ? movements.filter((m) => m.productId === p.id).length : undefined
      }));

      const { blob, extension } = exportRowsToFile(rows, config?.format || 'csv');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);

      const results = { records: rows.length, created: 0, ignored: 0, errors: 0 };

      setCurrentOperation((prev) => ({
        ...prev,
        progress: 100,
        status: 'completed',
        results,
        logs: [...prev.logs, { timestamp: new Date().toLocaleTimeString('fr-FR'), level: 'success', message: 'Export généré et téléchargé.' }]
      }));

      appendHistory({
        id: `exp-${Date.now()}`,
        type: 'export',
        filename: a.download,
        user: user?.email || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'completed',
        results,
        fileSize: `${(blob.size / 1024).toFixed(1)} KB`
      });
    } catch (error) {
      setCurrentOperation((prev) => ({
        ...prev,
        progress: 100,
        status: 'error',
        results: { records: 0, created: 0, ignored: 0, errors: 1 },
        logs: [...(prev?.logs || []), { timestamp: new Date().toLocaleTimeString('fr-FR'), level: 'error', message: error?.message || 'Export en échec' }]
      }));
    }
  };

  const handleCloseOperation = () => {
    setCurrentOperation(null);
  };

  const latestExportAt = useMemo(() => history.find((item) => item.type === 'export')?.timestamp || null, [history]);

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

        <main className={`transition-all duration-200 ease-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'} pt-16 lg:pt-0`}>
          <div className="bg-surface border-b border-border px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-text-primary">Data Management</h1>
                <p className="text-text-muted mt-1 text-sm lg:text-base">Import et export connectés aux données réelles de votre entreprise.</p>
              </div>
              <div className="flex items-center space-x-3 lg:space-x-4">
                <RateLimitIndicator />
                <QuickActionBar variant="header" userRole={userRole} />
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {currentOperation && <ProgressTracker operation={currentOperation} onClose={handleCloseOperation} />}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              <ImportSection onImportStart={handleImportStart} isImporting={currentOperation?.type === 'import' && currentOperation?.status === 'processing'} />
              <ExportSection
                onExportStart={handleExportStart}
                isExporting={currentOperation?.type === 'export' && currentOperation?.status === 'processing'}
                lastExportAt={latestExportAt}
              />
            </div>

            <ValidationRules />
            <OperationHistory operations={history} />
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={userRole} />
      </div>
    </>
  );
};

export default DataManagement;
