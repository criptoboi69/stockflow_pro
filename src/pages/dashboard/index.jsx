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
import PageHeader from '../../components/ui/PageHeader';
import productService from '../../services/productService';
import useCompanySettings from '../../hooks/useCompanySettings';

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentRole, currentCompany } = useAuth();
  const [kpiData, setKpiData] = useState([
    {
      title: 'Total Produits',
      value: '0',
      trend: 'up',
      trendValue: '—',
      icon: 'Package',
      color: 'primary'
    },
    {
      title: 'Articles en Stock',
      value: '0',
      trend: 'up',
      trendValue: '—',
      icon: 'CheckCircle',
      color: 'success'
    },
    {
      title: 'Alertes de Stock',
      value: '0',
      trend: 'down',
      trendValue: '—',
      icon: 'AlertTriangle',
      color: 'warning'
    }
  ]);
  const navigate = useNavigate();
  const { settings: companySettings } = useCompanySettings();
  const dashboardVisibility = companySettings?.dashboardVisibility || {}; 

  // KPI are now loaded from Supabase (real data)

  const [recentActivities, setRecentActivities] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [quickStats, setQuickStats] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const stats = await productService.getProductStats(currentCompany.id);
        const products = await productService.getProducts(currentCompany.id);

        const totalProducts = Number(stats?.totalProducts || 0);
        const totalQuantity = Number(stats?.totalQuantity || 0);
        const lowStockCount = Number(stats?.lowStockCount || 0);

        setKpiData([
          {
            title: 'Total Produits',
            value: String(totalProducts),
            trend: 'up',
            trendValue: 'Données réelles',
            icon: 'Package',
            color: 'primary'
          },
          {
            title: 'Articles en Stock',
            value: String(totalQuantity),
            trend: 'up',
            trendValue: 'Données réelles',
            icon: 'CheckCircle',
            color: 'success'
          },
          {
            title: 'Alertes de Stock',
            value: String(lowStockCount),
            trend: lowStockCount > 0 ? 'down' : 'up',
            trendValue: 'Données réelles',
            icon: 'AlertTriangle',
            color: 'warning'
          }
        ]);

        const alerts = products
          .filter((p) => (p?.status === 'low_stock' || p?.status === 'out_of_stock' || Number(p?.quantity || 0) <= Number(p?.min_stock || 0)))
          .slice(0, 5)
          .map((p) => ({
            id: p?.id,
            productName: p?.name,
            sku: p?.sku,
            currentStock: Number(p?.quantity || 0),
            minStock: Number(p?.min_stock || 0),
            location: p?.location || p?.product_location || 'N/A'
          }));
        setStockAlerts(alerts);

        const activities = products
          .slice(0, 5)
          .map((p) => ({
            id: p?.id,
            type: 'product_added',
            title: 'Produit disponible',
            description: `${p?.name} (${p?.sku || 'N/A'})`,
            user: 'Système',
            timestamp: p?.updated_at || p?.created_at || new Date().toISOString()
          }));
        setRecentActivities(activities);

        const inventoryValue = products.reduce((acc, p) => acc + (Number(p?.quantity || 0) * Number(p?.price || 0)), 0);
        setQuickStats([
          { label: 'Produits actifs', value: String(totalProducts), icon: 'Package' },
          { label: 'Articles en stock', value: String(totalQuantity), icon: 'Archive' },
          { label: 'Alertes stock', value: String(lowStockCount), icon: 'AlertTriangle' },
          { label: 'Valeur stock', value: `€${Math.round(inventoryValue).toLocaleString('fr-FR')}`, unit: '', icon: 'Euro' }
        ]);
      } catch (error) {
        console.error('Error loading dashboard KPI:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentCompany?.id]);

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
        <PageHeader
          title="Tableau de bord"
          subtitle={`Vue d'ensemble de votre inventaire — ${new Date()?.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/qr-scanner')}
                iconName="QrCode"
                iconPosition="left"
                className="text-xs lg:text-sm"
              >
                Scanner QR
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/products?action=add')}
                iconName="Plus"
                iconPosition="left"
                className="text-xs lg:text-sm"
              >
                Ajouter produit
              </Button>
            </>
          }
        />

        {/* Enhanced Content with responsive spacing */}
        <div className="container-responsive py-4 sm:py-6 space-responsive-y">
          {/* Enhanced KPI Widgets with responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {kpiData?.filter((_, index) => {
              if (index === 0) return dashboardVisibility?.totalProducts !== false;
              if (index === 2) return dashboardVisibility?.stockAlerts !== false;
              return true;
            })?.map((kpi) => {
              const originalIndex = kpiData.findIndex((x) => x.title === kpi.title);
              return (
                <KPIWidget
                  key={kpi?.title}
                  title={kpi?.title}
                  value={kpi?.value}
                  trend={kpi?.trend}
                  trendValue={kpi?.trendValue}
                  icon={kpi?.icon}
                  color={kpi?.color}
                  onClick={() => handleKPIClick(originalIndex)}
                  loading={loading}
                />
              );
            })}
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
            {dashboardVisibility?.recentMovements !== false && (
              <ActivityTimeline
                title="Activités Récentes"
                activities={recentActivities}
                onViewAll={() => navigate('/stock-movements')}
                loading={loading}
              />
            )}

            {/* Stock Alerts */}
            {dashboardVisibility?.stockAlerts !== false && (
              <StockAlertsList
                alerts={stockAlerts}
                onViewAll={() => navigate('/products?filter=alerts')}
                loading={loading}
              />
            )}
          </div>

          {/* Enhanced Bottom Grid with responsive columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Stats */}
            {dashboardVisibility?.lowStockItems !== false && (
              <QuickStatsCard
                title="Statistiques Rapides"
                stats={quickStats}
                loading={loading}
              />
            )}

            {/* System Notifications */}
            <div className="lg:col-span-2">
              <ActivityTimeline
                title="Notifications Système"
                activities={recentActivities}
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