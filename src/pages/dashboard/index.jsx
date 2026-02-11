import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import KPIWidget from './components/KPIWidget';
import ActivityTimeline from './components/ActivityTimeline';
import StockAlertsList from './components/StockAlertsList';
import QuickStatsCard from './components/QuickStatsCard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentRole, currentCompany } = useAuth();
  const navigate = useNavigate();

  // Mock data for KPI widgets
  const kpiData = [
    {
      title: 'Total Produits',
      value: '2,847',
      trend: 'up',
      trendValue: '+12%',
      icon: 'Package',
      color: 'primary'
    },
    {
      title: 'Articles en Stock',
      value: '2,634',
      trend: 'up',
      trendValue: '+8%',
      icon: 'CheckCircle',
      color: 'success'
    },
    {
      title: 'Alertes de Stock',
      value: '23',
      trend: 'down',
      trendValue: '-5%',
      icon: 'AlertTriangle',
      color: 'warning'
    }
  ];

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'stock_in',
      title: 'Réception de marchandises',
      description: 'Ajout de 150 unités - Smartphone Galaxy S24',
      user: 'Marie Dubois',
      timestamp: new Date(Date.now() - 300000) // 5 minutes ago
    },
    {
      id: 2,
      type: 'scan',
      title: 'Scan QR effectué',
      description: 'Vérification stock - Ordinateur portable Dell XPS',
      user: 'Pierre Martin',
      timestamp: new Date(Date.now() - 900000) // 15 minutes ago
    },
    {
      id: 3,
      type: 'stock_out',
      title: 'Sortie de stock',
      description: 'Expédition de 25 unités - Casque audio Sony WH-1000XM4',
      user: 'Sophie Laurent',
      timestamp: new Date(Date.now() - 1800000) // 30 minutes ago
    },
    {
      id: 4,
      type: 'product_added',
      title: 'Nouveau produit ajouté',
      description: 'Tablette iPad Pro 12.9" - Référence: IPD-PRO-129',
      user: 'Jean Dupont',
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      id: 5,
      type: 'adjustment',
      title: 'Ajustement d\'inventaire',
      description: 'Correction stock - Écouteurs AirPods Pro (différence: -3)',
      user: 'Marie Dubois',
      timestamp: new Date(Date.now() - 7200000) // 2 hours ago
    }
  ];

  // Mock system notifications
  const systemNotifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Stock faible détecté',
      description: 'Le produit "Chargeur USB-C" est en dessous du seuil minimum (5 unités restantes)',
      timestamp: new Date(Date.now() - 600000) // 10 minutes ago
    },
    {
      id: 2,
      type: 'user_login',
      title: 'Nouvelle connexion',
      description: 'Pierre Martin s\'est connecté depuis l\'entrepôt principal',
      timestamp: new Date(Date.now() - 1200000) // 20 minutes ago
    },
    {
      id: 3,
      type: 'alert',
      title: 'Rupture de stock',
      description: 'Le produit "Souris Logitech MX Master 3" n\'est plus disponible',
      timestamp: new Date(Date.now() - 2400000) // 40 minutes ago
    },
    {
      id: 4,
      type: 'scan',
      title: 'Scan automatique programmé',
      description: 'Vérification hebdomadaire des stocks - Secteur A terminée',
      timestamp: new Date(Date.now() - 10800000) // 3 hours ago
    }
  ];

  // Mock stock alerts
  const stockAlerts = [
    {
      id: 1,
      productName: 'Chargeur USB-C Rapide',
      sku: 'CHG-USBC-001',
      currentStock: 5,
      minStock: 20,
      location: 'Entrepôt A - Zone 3'
    },
    {
      id: 2,
      productName: 'Souris Logitech MX Master 3',
      sku: 'SOU-LOG-MX3',
      currentStock: 0,
      minStock: 15,
      location: 'Entrepôt B - Zone 1'
    },
    {
      id: 3,
      productName: 'Clavier Mécanique RGB',
      sku: 'CLV-MEC-RGB',
      currentStock: 8,
      minStock: 25,
      location: 'Entrepôt A - Zone 2'
    },
    {
      id: 4,
      productName: 'Webcam HD 1080p',
      sku: 'WEB-HD-1080',
      currentStock: 3,
      minStock: 12,
      location: 'Entrepôt C - Zone 1'
    }
  ];

  // Mock quick stats
  const quickStats = [
    {
      label: 'Mouvements aujourd\'hui',
      value: '47',
      icon: 'ArrowUpDown'
    },
    {
      label: 'Scans QR',
      value: '128',
      icon: 'QrCode'
    },
    {
      label: 'Utilisateurs actifs',
      value: '12',
      icon: 'Users'
    },
    {
      label: 'Valeur totale',
      value: '€284K',
      unit: '',
      icon: 'Euro'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleKPIClick = (index) => {
    switch (index) {
      case 0:
        navigate('/products');
        break;
      case 1:
        navigate('/products?filter=in-stock');
        break;
      case 2:
        navigate('/products?filter=low-stock');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userRole={currentRole}
        currentTenant={currentCompany}
      />
      <main className={`transition-all duration-200 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'} pt-14 sm:pt-16 lg:pt-0`}>
        {/* Enhanced Header with better mobile responsiveness */}
        <div className="bg-surface border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tableau de Bord</h1>
              <p className="text-text-muted mt-1 text-sm sm:text-base">
                Vue d'ensemble de votre inventaire - {new Date()?.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate('/qr-scanner')}
                iconName="QrCode"
                iconPosition="left"
                className="touch-target"
              >
                <span className="hidden sm:inline">Scanner QR</span>
                <span className="sm:hidden">Scanner</span>
              </Button>
              <Button
                variant="default"
                onClick={() => navigate('/products?action=add')}
                iconName="Plus"
                iconPosition="left"
                className="touch-target"
              >
                <span className="hidden sm:inline">Ajouter Produit</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Content with responsive spacing */}
        <div className="container-responsive py-4 sm:py-6 space-responsive-y">
          {/* Enhanced KPI Widgets with responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {kpiData?.map((kpi, index) => (
              <KPIWidget
                key={index}
                title={kpi?.title}
                value={kpi?.value}
                trend={kpi?.trend}
                trendValue={kpi?.trendValue}
                icon={kpi?.icon}
                color={kpi?.color}
                onClick={() => handleKPIClick(index)}
                loading={loading}
              />
            ))}
          </div>

          {/* Enhanced Quick Actions with responsive design */}
          <div className="bg-card border border-border rounded-2xl card-responsive card-shadow">
            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Actions Rapides</h3>
            <QuickActionBar 
              variant="dashboard" 
              userRole={currentRole}
            />
          </div>

          {/* Enhanced Activity and Alerts Grid with responsive layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Activities */}
            <ActivityTimeline
              title="Activités Récentes"
              activities={recentActivities}
              onViewAll={() => navigate('/stock-movements')}
              loading={loading}
            />

            {/* Stock Alerts */}
            <StockAlertsList
              alerts={stockAlerts}
              onViewAll={() => navigate('/products?filter=alerts')}
              loading={loading}
            />
          </div>

          {/* Enhanced Bottom Grid with responsive columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Stats */}
            <QuickStatsCard
              title="Statistiques Rapides"
              stats={quickStats}
              loading={loading}
            />

            {/* System Notifications */}
            <div className="lg:col-span-2">
              <ActivityTimeline
                title="Notifications Système"
                activities={systemNotifications}
                onViewAll={() => navigate('/settings')}
                loading={loading}
              />
            </div>
          </div>

          {/* Enhanced Performance Chart with responsive sizing */}
          <div className="bg-card border border-border rounded-2xl card-responsive card-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">Évolution des Stocks (7 derniers jours)</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 self-start sm:self-auto touch-target"
              >
                <Icon name="BarChart3" size={14} className="mr-2" />
                <span className="hidden sm:inline">Voir détails</span>
                <span className="sm:hidden">Détails</span>
              </Button>
            </div>
            
            {loading ? (
              <div className="h-48 sm:h-64 bg-muted rounded-xl animate-pulse" />
            ) : (
              <div className="h-48 sm:h-64 flex items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-border">
                <div className="text-center px-4">
                  <Icon name="BarChart3" size={40} className="sm:size-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-muted font-medium text-sm sm:text-base">Graphique d'évolution</p>
                  <p className="text-text-muted text-xs sm:text-sm">Les données seront affichées ici</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Enhanced Floating Quick Actions with better mobile positioning */}
      <QuickActionBar 
        variant="floating" 
        userRole={currentRole}
      />
    </div>
  );
};

export default Dashboard;