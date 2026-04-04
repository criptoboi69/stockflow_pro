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
import productService from '../../services/productService';
import PageHeader from '../../components/ui/PageHeader';

const QRScanner = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedProduct, setScannedProduct] = useState(null);
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
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setCurrentLanguage(savedLanguage);
  }, []);

  const handleScanSuccess = async (code) => {
    setIsProcessing(true);
    setError('');
    setScannedProduct(null);
    
    try {
      // Real API call to find product by SKU
      if (currentCompany?.id) {
        const products = await productService.searchProducts(currentCompany.id, code);
        
        // Find exact match by SKU
        const product = products.find(p => p.sku?.toLowerCase() === code?.toLowerCase());
        
        if (product) {
          setScannedProduct(product);
          setScanResult({
            code: code,
            timestamp: new Date(),
            success: true,
            product: product
          });
        } else {
          // Product not found - show not found result
          setScanResult({
            code: code,
            timestamp: new Date(),
            success: false,
            product: null
          });
          setError(t?.noProductFound);
        }
      } else {
        // No company context - simulate not found
        setScanResult({
          code: code,
          timestamp: new Date(),
          success: false,
          product: null
        });
        setError(t?.noProductFound);
      }
      
    } catch (error) {
      console.error('Scan processing error:', error);
      setError(t?.noProductFound);
      setScanResult({
        code: code,
        timestamp: new Date(),
        success: false,
        product: null
      });
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

        <PageHeader
          title={t?.title}
          subtitle={t?.subtitle}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/products')}
                iconName="Package"
                iconPosition="left"
                className="text-xs lg:text-sm"
              >
                Produits
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                iconName="LayoutDashboard"
                iconPosition="left"
                className="text-xs lg:text-sm"
              >
                Tableau de bord
              </Button>
            </>
          }
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
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
            <div className="bg-surface border border-border rounded-2xl p-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Main Scanner Area */}
              <div className="xl:col-span-2 space-y-6">
                {activeTab === 'camera' && (
                  <div className="bg-surface border border-border rounded-2xl p-4 lg:p-6">
                    <CameraView
                    onScanSuccess={handleScanSuccess}
                    onError={handleScanError}
                    isScanning={isScanning}
                    currentLanguage={currentLanguage}
                  />
                  </div>
                )}
                
                {activeTab === 'manual' && (
                  <ManualInput
                    onSubmit={handleManualSubmit}
                    isProcessing={isProcessing}
                    currentLanguage={currentLanguage}
                  />
                )}
                
                {activeTab === 'instructions' && (
                  <div className="bg-surface border border-border rounded-2xl p-1">
                    <ScanInstructions currentLanguage={currentLanguage} />
                  </div>
                )}
              </div>

              {/* Instructions Sidebar */}
              <div className="hidden xl:block xl:sticky xl:top-6">
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
          product={scannedProduct}
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