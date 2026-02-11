import React, { useState } from 'react';
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


const DataManagement = () => {
  const { currentRole, currentCompany } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);

  const userRole = currentRole || 'user';
  const currentTenant = currentCompany || { name: 'StockFlow Pro' };

  const handleImportStart = (file) => {
    const mockOperation = {
      type: 'import',
      progress: 0,
      status: 'processing',
      results: null,
      logs: [
        { timestamp: '13:10:19', level: 'info', message: 'Starting file validation...' },
        { timestamp: '13:10:20', level: 'info', message: 'Processing 4 rows...' }
      ]
    };

    setCurrentOperation(mockOperation);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setCurrentOperation(prev => ({
        ...prev,
        progress,
        logs: [
          ...prev?.logs,
          { 
            timestamp: new Date()?.toLocaleTimeString('fr-FR'), 
            level: 'info', 
            message: `Processing row ${Math.floor(progress / 25)}...` 
          }
        ]
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setCurrentOperation(prev => ({
          ...prev,
          status: 'completed',
          results: { created: 3, ignored: 1, errors: 0 },
          logs: [
            ...prev?.logs,
            { 
              timestamp: new Date()?.toLocaleTimeString('fr-FR'), 
              level: 'success', 
              message: 'Import completed successfully' 
            }
          ]
        }));
      }
    }, 1000);
  };

  const handleExportStart = (config) => {
    const mockOperation = {
      type: 'export',
      progress: 0,
      status: 'processing',
      results: null,
      logs: [
        { timestamp: '13:10:19', level: 'info', message: 'Preparing export query...' },
        { timestamp: '13:10:20', level: 'info', message: 'Fetching product data...' }
      ]
    };

    setCurrentOperation(mockOperation);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setCurrentOperation(prev => ({
        ...prev,
        progress,
        logs: [
          ...prev?.logs,
          { 
            timestamp: new Date()?.toLocaleTimeString('fr-FR'), 
            level: 'info', 
            message: `Generating ${config?.format?.toUpperCase()} file...` 
          }
        ]
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setCurrentOperation(prev => ({
          ...prev,
          status: 'completed',
          results: { records: 1247 },
          logs: [
            ...prev?.logs,
            { 
              timestamp: new Date()?.toLocaleTimeString('fr-FR'), 
              level: 'success', 
              message: 'Export file ready for download' 
            }
          ]
        }));
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
          {/* Header */}
          <div className="bg-surface border-b border-border px-4 lg:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl lg:text-2xl font-semibold text-text-primary">Data Management</h1>
                <p className="text-text-muted mt-1 text-sm lg:text-base">
                  Import and export inventory data with validation and progress tracking
                </p>
              </div>
              <div className="flex items-center space-x-3 lg:space-x-4">
                <RateLimitIndicator />
                <QuickActionBar variant="header" userRole={userRole} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Current Operation Progress */}
            {currentOperation && (
              <ProgressTracker
                operation={currentOperation}
                onClose={handleCloseOperation}
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
              />
            </div>

            {/* Validation Rules */}
            <ValidationRules />

            {/* Operation History */}
            <OperationHistory />
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={userRole} />
      </div>
    </>
  );
};

export default DataManagement;