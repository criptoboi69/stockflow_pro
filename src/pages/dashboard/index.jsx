import React, { useState, useEffect, useMemo } from 'react';
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
import productService from '../../services/productService';
import stockMovementService from '../../services/stockMovementService';

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const { currentRole, currentCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentCompany?.id) {
        setProducts([]);
        setMovements([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [productList, movementList] = await Promise.all([
          productService.getProducts(currentCompany.id),
          stockMovementService.getStockMovements(currentCompany.id)
        ]);

        setProducts(productList || []);
        setMovements(movementList || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setProducts([]);
        setMovements([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentCompany?.id]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product?.quantity || 0) <= Number(product?.minStock || 0)),
    [products]
  );

  const totalStockUnits = useMemo(
    () => products.reduce((sum, product) => sum + Number(product?.quantity || 0), 0),
    [products]
  );

  const totalStockValue = useMemo(
    () => products.reduce((sum, product) => sum + Number(product?.quantity || 0) * Number(product?.price || 0), 0),
    [products]
  );

  const kpiData = useMemo(() => ([
    {
      title: 'Total Produits',
      value: products.length.toLocaleString('fr-FR'),
      trend: null,
      trendValue: null,
      icon: 'Package',
      color: 'primary'
    },
    {
      title: 'Articles en Stock',
      value: totalStockUnits.toLocaleString('fr-FR'),
      trend: null,
      trendValue: null,
      icon: 'Boxes',
      color: 'success'
    },
    {
      title: 'Alertes de Stock',
      value: lowStockProducts.length.toLocaleString('fr-FR'),
      trend: null,
      trendValue: null,
      icon: 'AlertTriangle',
      color: lowStockProducts.length > 0 ? 'warning' : 'success'
    }
  ]), [products.length, totalStockUnits, lowStockProducts.length]);

  const recentActivities = useMemo(
    () => movements.slice(0, 8).map((movement) => ({
      id: movement?.id,
      type: movement?.type,
      title: movement?.type === 'in' ? 'Entrée de stock' : movement?.type === 'out' ? 'Sortie de stock' : 'Ajustement de stock',
      description: `${movement?.product?.name || 'Produit'} (${movement?.product?.sku || 'N/A'}) • ${movement?.quantity || 0} unité(s)`,
      user: movement?.user?.fullName || 'Système',
      timestamp: movement?.createdAt
    })),
    [movements]
  );

  const stockAlerts = useMemo(
    () => lowStockProducts.slice(0, 8).map((product) => ({
      id: product?.id,
      productName: product?.name,
      sku: product?.sku,
      currentStock: Number(product?.quantity || 0),
      minStock: Number(product?.minStock || 0),
      location: product?.location || 'N/A'
    })),
    [lowStockProducts]
  );

  const quickStats = useMemo(() => ([
    { label: 'Mouvements (30j)', value: movements.filter((m) => new Date(m?.createdAt) > new Date(Date.now() - 30 * 86400000)).length, icon: 'History' },
    { label: 'Catégories', value: new Set(products.map((p) => p?.category || 'Non classé')).size, icon: 'FolderTree' },
    { label: 'Emplacements', value: new Set(products.map((p) => p?.location || 'Non défini')).size, icon: 'MapPin' },
    { label: 'Valeur totale', value: `${Math.round(totalStockValue).toLocaleString('fr-FR')} €`, icon: 'Euro' }
  ]), [movements, products, totalStockValue]);

  const systemNotifications = useMemo(() => {
    const notifications = [];
    if (lowStockProducts.length > 0) {
      notifications.push({
        id: 'low-stock',
        type: 'alert',
        title: 'Seuils minimum atteints',
        description: `${lowStockProducts.length} produit(s) sous le seuil de stock minimum.`,
        user: 'Système',
        timestamp: new Date().toISOString()
      });
    }

    if (movements.length > 0) {
      notifications.push({
        id: 'movements',
        type: 'scan',
        title: 'Mouvements récents détectés',
        description: `${Math.min(movements.length, 10)} mouvements récents disponibles.`,
        user: 'Système',
        timestamp: movements[0]?.createdAt
      });
    }

    return notifications;
  }, [lowStockProducts.length, movements]);

  const handleKPIClick = (index) => {
    if (index === 0) navigate('/products');
    if (index === 1) navigate('/products?filter=in-stock');
    if (index === 2) navigate('/products?filter=low-stock');
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
        <div className="bg-surface border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tableau de Bord</h1>
              <p className="text-text-muted mt-1 text-sm sm:text-base">Vue d'ensemble de votre inventaire</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button variant="outline" onClick={() => navigate('/qr-scanner')} iconName="QrCode" iconPosition="left" className="touch-target">
                <span className="hidden sm:inline">Scanner QR</span><span className="sm:hidden">Scanner</span>
              </Button>
              <Button variant="default" onClick={() => navigate('/products?action=add')} iconName="Plus" iconPosition="left" className="touch-target">
                <span className="hidden sm:inline">Ajouter Produit</span><span className="sm:hidden">Ajouter</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="container-responsive py-4 sm:py-6 space-responsive-y">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {kpiData?.map((kpi, index) => (
              <KPIWidget key={index} {...kpi} onClick={() => handleKPIClick(index)} loading={loading} />
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl card-responsive card-shadow">
            <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Actions Rapides</h3>
            <QuickActionBar variant="dashboard" userRole={currentRole} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <ActivityTimeline title="Activités Récentes" activities={recentActivities} onViewAll={() => navigate('/stock-movements')} loading={loading} />
            <StockAlertsList alerts={stockAlerts} onViewAll={() => navigate('/products?filter=alerts')} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <QuickStatsCard title="Statistiques Rapides" stats={quickStats} loading={loading} />
            <div className="lg:col-span-2">
              <ActivityTimeline title="Notifications Système" activities={systemNotifications} onViewAll={() => navigate('/settings')} loading={loading} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl card-responsive card-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">Évolution des Stocks (7 derniers jours)</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 self-start sm:self-auto touch-target">
                <Icon name="BarChart3" size={14} className="mr-2" />
                <span className="hidden sm:inline">Voir détails</span><span className="sm:hidden">Détails</span>
              </Button>
            </div>
            {loading ? <div className="h-48 sm:h-64 bg-muted rounded-xl animate-pulse" /> : <div className="h-48 sm:h-64 flex items-center justify-center text-text-muted">Graphique à connecter (source mouvements prête).</div>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
