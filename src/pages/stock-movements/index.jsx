import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import stockMovementService from '../../services/stockMovementService';
import { useRealtimeSubscription } from '../../hooks/useRealtimeSubscription';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import MovementTimeline from './components/MovementTimeline';
import MovementFilters from './components/MovementFilters';
import MovementEditModal from './components/MovementEditModal';
import NewMovementModal from './components/NewMovementModal';
import MovementDetailsModal from './components/MovementDetailsModal';

const StockMovements = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentCompany, currentRole, user, loading: authLoading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMovementForDetails, setSelectedMovementForDetails] = useState(null);
  const [error, setError] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);

  const itemsPerPage = 20;

  const effectiveRole = currentRole || 'user';

  // Real-time subscription for stock movements
  useRealtimeSubscription({
    table: 'stock_movements',
    filter: currentCompany?.id ? { column: 'company_id', value: currentCompany?.id } : null,
    enabled: !!currentCompany?.id,
    onInsert: (newMovement) => {
      // Reload movements to get complete data with relations
      loadMovements();
    },
    onUpdate: (updatedMovement) => {
      // Reload movements to get complete data with relations
      loadMovements();
    },
    onDelete: (deletedMovement) => {
      // Remove from list
      setMovements(prev => prev?.filter(m => m?.id !== deletedMovement?.id));
      setFilteredMovements(prev => prev?.filter(m => m?.id !== deletedMovement?.id));
    }
  });

  // Load movements from Supabase
  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (currentCompany?.id) {
      loadMovements();
    } else {
      setIsLoading(false);
    }
  }, [currentCompany, authLoading]);

  // Open movement details modal from URL param or localStorage (for notifications)
  useEffect(() => {
    if (!movements?.length) return;
    
    // Check localStorage first (for notifications)
    const storedMovementId = localStorage.getItem('openMovementModal');
    const urlMovementId = searchParams?.get('id');
    const movementId = storedMovementId || urlMovementId;
    
    if (!movementId) return;

    const target = movements.find((m) => m?.id === movementId);
    if (!target) return;

    setSelectedMovementForDetails(target);
    setIsDetailsModalOpen(true);
    // Clear the localStorage flag
    localStorage.removeItem('openMovementModal');
  }, [searchParams, movements]);

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await stockMovementService?.getStockMovements(currentCompany?.id);
      setMovements(data);
      setFilteredMovements(data);
      setAvailableLocations(Array.from(new Set((data || []).map((m) => m?.location).filter(Boolean))).sort());
    } catch (err) {
      console.error('Error loading stock movements:', err);
      setError('Erreur lors du chargement des mouvements de stock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = [...movements];

    // Search filter
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter((movement) =>
      movement?.product?.name?.toLowerCase()?.includes(searchTerm) ||
      movement?.product?.sku?.toLowerCase()?.includes(searchTerm) ||
      movement?.reason?.toLowerCase()?.includes(searchTerm));
    }

    // Type filter
    if (filters?.movementType) {
      filtered = filtered?.filter((movement) => movement?.type === filters?.movementType);
    }

    if (filters?.location) {
      filtered = filtered?.filter((movement) => movement?.location === filters?.location);
    }

    // Date range filter
    if (filters?.dateFrom) {
      filtered = filtered?.filter((movement) => new Date(movement?.createdAt) >= new Date(filters?.dateFrom));
    }
    if (filters?.dateTo) {
      filtered = filtered?.filter((movement) => new Date(movement?.createdAt) <= new Date(filters?.dateTo));
    }

    setFilteredMovements(filtered);
    setCurrentPage(1);
  };

  const handleEditMovement = (movement) => {
    setSelectedMovement(movement);
    setIsEditModalOpen(true);
  };

  const handleSaveAdjustment = async (movementData) => {
    try {
      if (!['super_admin', 'administrator', 'manager', 'user']?.includes(effectiveRole)) {
        setError('Accès refusé: rôle insuffisant pour modifier un mouvement');
        return;
      }
      await stockMovementService?.updateStockMovement(selectedMovement?.id, movementData);
      setIsEditModalOpen(false);
      setSelectedMovement(null);
      // Real-time subscription will handle the update
    } catch (err) {
      console.error('Error updating movement:', err);
      setError('Erreur lors de la mise à jour du mouvement');
    }
  };

  const handleExport = () => {
    if (!['super_admin', 'administrator']?.includes(effectiveRole)) {
      setError('Accès refusé: export réservé aux administrateurs');
      return;
    }

    try {
      const rows = filteredMovements?.map((movement) => ({
        Date: new Date(movement?.createdAt)?.toLocaleDateString('fr-FR'),
        Heure: new Date(movement?.createdAt)?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        Produit: movement?.product?.name || '',
        SKU: movement?.product?.sku || '',
        Type: movement?.type || '',
        Quantite: movement?.quantity ?? '',
        Solde: movement?.runningBalance ?? '',
        Emplacement: movement?.location || '',
        Utilisateur: movement?.user?.fullName || '',
        Motif: movement?.reason || ''
      })) || [];

      if (!rows.length) {
        setError('Aucun mouvement à exporter');
        return;
      }

      const headers = Object.keys(rows[0]);
      const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = [
        headers.join(';'),
        ...rows.map((row) => headers.map((header) => escape(row[header])).join(';')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `stock-movements-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting stock movements:', err);
      setError("Erreur lors de l'export des mouvements");
    }
  };

  const handleAddMovement = () => {
    navigate('/products?action=add-movement');
  };

  const handleNewMovement = () => {
    setIsNewMovementModalOpen(true);
  };

  const handleSaveNewMovement = async (movementData) => {
    try {
      if (!['super_admin', 'administrator', 'manager', 'user']?.includes(effectiveRole)) {
        setError('Accès refusé: rôle insuffisant pour créer un mouvement');
        return;
      }
      await stockMovementService?.createStockMovement(movementData, currentCompany?.id, user?.id);
      setIsNewMovementModalOpen(false);
      // Real-time subscription will handle the insert
    } catch (err) {
      console.error('Error creating movement:', err);
      setError('Erreur lors de la création du mouvement');
    }
  };

  const handleViewDetails = (movement) => {
    setSelectedMovementForDetails(movement);
    setIsDetailsModalOpen(true);
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Chargement des mouvements...</p>
        </div>
      </div>
    );
  }

  // Show no company message
  if (!currentCompany?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Aucune société sélectionnée</h2>
          <p className="text-text-muted">Veuillez sélectionner une société dans les paramètres.</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Erreur</h2>
          <p className="text-text-muted mb-4">{error}</p>
          <Button onClick={loadMovements}>Réessayer</Button>
        </div>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredMovements?.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredMovements?.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole={effectiveRole}
        currentTenant={currentCompany || { name: 'StockFlow Pro' }} />

      <div className={`transition-all duration-200 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
        {/* Mobile header spacer */}
        <div className="h-16 lg:hidden"></div>

        <PageHeader
          title="Mouvements de stock"
          subtitle="Historique complet des mouvements d'inventaire"
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

              {['super_admin', 'administrator', 'manager', 'user']?.includes(effectiveRole) && (
                <Button
                  size="sm"
                  onClick={handleNewMovement}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Nouveau mouvement
                </Button>
              )}
            </>
          }
        />

        <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">

          {/* Filters */}
          <MovementFilters
            onFilterChange={handleFilterChange}
            onExport={handleExport}
            totalMovements={filteredMovements?.length}
            userRole={effectiveRole}
            locations={availableLocations} />

          {/* Timeline */}
          <div className="bg-surface border border-border rounded-lg">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">
                  Timeline des mouvements
                </h2>
                <div className="flex items-center space-x-2 text-sm text-text-muted">
                  <Icon name="Clock" size={16} />
                  <span>Mis à jour en temps réel</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <MovementTimeline
                movements={paginatedMovements}
                onEditMovement={handleEditMovement}
                onViewDetails={handleViewDetails}
                userRole={effectiveRole}
                isLoading={isLoading} />

              {/* Pagination */}
              {totalPages > 1 &&
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                  <div className="text-sm text-text-muted">
                    Affichage {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredMovements?.length)} sur {filteredMovements?.length} mouvements
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    iconName="ChevronLeft"
                    iconPosition="left">

                      Précédent
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8">

                            {page}
                          </Button>);

                    })}
                    </div>
                    
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    iconName="ChevronRight"
                    iconPosition="right">

                      Suivant
                    </Button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
      {/* Quick Action Bar */}
      <QuickActionBar
        variant="floating"
        userRole={effectiveRole} />

      {/* New Movement Modal */}
      <NewMovementModal
        isOpen={isNewMovementModalOpen}
        onClose={() => setIsNewMovementModalOpen(false)}
        onSave={handleSaveNewMovement}
        userRole={effectiveRole} />

      {/* Movement Details Modal */}
      <MovementDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMovementForDetails(null);
        }}
        movement={selectedMovementForDetails} />

      {/* Edit Modal */}
      <MovementEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMovement(null);
        }}
        movement={selectedMovement}
        onSave={handleSaveAdjustment}
        userRole={effectiveRole} />

    </div>
  );
};

export default StockMovements;