import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import CameraView from './components/CameraView';
import ManualInput from './components/ManualInput';
import ScanInstructions from './components/ScanInstructions';
import ScanResults from './components/ScanResults';
import { useAuth } from '../../contexts/AuthContext';
import { getStoredLanguage, persistLanguage } from '../../utils/language';
import productService from '../../services/productService';

const QRScanner = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('camera');
  const { currentRole, currentCompany } = useAuth();

  const translations = {
    fr: {
      title: "Scanner QR",
      subtitle: "Scannez les codes QR des produits pour accéder rapidement aux informations d\'inventaire",
      cameraTab: "Caméra",
      manualTab: "Saisie manuelle",
      instructionsTab: "Instructions",
      backToDashboard: "Retour au tableau de bord",
      scanSuccess: "Code scanné avec succès !",
      scanError: "Erreur lors du scan",
      processing: "Traitement en cours...",
      noProductFound: "Aucun produit trouvé pour ce code",
      tryAgain: "Réessayer"
    },
    en: {
      title: "QR Scanner",
      subtitle: "Scan product QR codes to quickly access inventory information",
      cameraTab: "Camera",
      manualTab: "Manual Input",
      instructionsTab: "Instructions",
      backToDashboard: "Back to Dashboard",
      scanSuccess: "Code scanned successfully!",
      scanError: "Scan error",
      processing: "Processing...",
      noProductFound: "No product found for this code",
      tryAgain: "Try Again"
    }
  };

  const t = translations?.[currentLanguage];

  // Load language preference on component mount
  useEffect(() => {
    setCurrentLanguage(getStoredLanguage());
  }, []);

  const handleScanSuccess = async (code) => {
    setIsProcessing(true);
    setError('');

    try {
      if (!currentCompany?.id) {
        throw new Error('Missing active company context');
      }

      const query = (code || '').trim();
      const products = await productService.searchProducts(currentCompany.id, query);
      const exact = products.find((item) => item?.sku?.toLowerCase() === query.toLowerCase() || item?.id === query);
      const matchedProduct = exact || products?.[0] || null;

      if (!matchedProduct) {
        setError(t?.noProductFound);
        return;
      }

      setScanResult({
        code: query,
        timestamp: new Date(),
        success: true,
        product: matchedProduct
      });
    } catch (error) {
      console.error('Scan processing error:', error);
      setError(t?.noProductFound);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  const handleManualSubmit = (code) => {
    handleScanSuccess(code);
  };

  const handleCloseScanResult = () => {
    setScanResult(null);
    setError('');
  };

  const handleScanAgain = () => {
    setScanResult(null);
    setError('');
    setActiveTab('camera');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole={currentRole || 'user'}
        currentTenant={currentCompany}
      />
      {/* Main Content */}
      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        {/* Mobile Header Spacer */}
        <div className="h-16 lg:hidden"></div>

        {/* Header */}
        <header className="bg-surface border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToDashboard}
                className="text-text-secondary hover:text-text-primary"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{t?.title}</h1>
                <p className="text-text-muted">{t?.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newLang = currentLanguage === 'fr' ? 'en' : 'fr';
                  setCurrentLanguage(newLang);
                  persistLanguage(newLang);
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <Icon name="Languages" size={16} className="mr-2" />
                {currentLanguage?.toUpperCase()}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-error/10 border border-error/20 rounded-2xl p-4">
                <div className="flex items-center">
                  <Icon name="AlertCircle" size={20} className="text-error mr-3" />
                  <p className="text-error font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mb-6 bg-primary/10 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
                  <p className="text-primary font-medium">{t?.processing}</p>
                </div>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="flex space-x-1 bg-muted p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'camera' ?'bg-surface text-text-primary shadow-sm' :'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon name="Camera" size={16} className="mr-2" />
                  {t?.cameraTab}
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'manual' ?'bg-surface text-text-primary shadow-sm' :'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon name="Keyboard" size={16} className="mr-2" />
                  {t?.manualTab}
                </button>
                <button
                  onClick={() => setActiveTab('instructions')}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'instructions' ?'bg-surface text-text-primary shadow-sm' :'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon name="HelpCircle" size={16} className="mr-2" />
                  {t?.instructionsTab}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Scanner Area */}
              <div className="lg:col-span-2">
                {activeTab === 'camera' && (
                  <CameraView
                    onScanSuccess={handleScanSuccess}
                    onError={handleScanError}
                    currentLanguage={currentLanguage}
                  />
                )}
                
                {activeTab === 'manual' && (
                  <ManualInput
                    onSubmit={handleManualSubmit}
                    isProcessing={isProcessing}
                    currentLanguage={currentLanguage}
                  />
                )}
                
                {activeTab === 'instructions' && (
                  <ScanInstructions currentLanguage={currentLanguage} />
                )}
              </div>

              {/* Instructions Sidebar (always visible on desktop) */}
              <div className="hidden lg:block">
                <ScanInstructions currentLanguage={currentLanguage} />
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Scan Results Modal */}
      {scanResult && (
        <ScanResults
          result={scanResult}
          onClose={handleCloseScanResult}
          onScanAgain={handleScanAgain}
          currentLanguage={currentLanguage}
        />
      )}
      {/* Quick Action Bar */}
      <QuickActionBar
        variant="floating"
        userRole={currentRole}
      />
    </div>
  );
};

export default QRScanner;