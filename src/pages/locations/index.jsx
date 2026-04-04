import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FilterDropdown from '../../components/ui/FilterDropdown';
import ResponsiveGrid from '../../components/ResponsiveGrid';
import { useAuth } from '../../contexts/AuthContext';
import locationService from '../../services/locationService';
import LocationModal from './components/LocationModal';
import { userService } from '../../services/userService';
import PageHeader from '../../components/ui/PageHeader';
import InlineFeedback from '../../components/ui/InlineFeedback';

const LocationsPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [viewMode, setViewMode] = useState('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'all'
  });

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'view', // 'view', 'edit', 'add'
    location: null
  });

  const { isAdministrator, isSuperAdmin, currentCompany } = useAuth();
  const canEdit = isAdministrator() || isSuperAdmin();
  const canAdd = isAdministrator() || isSuperAdmin();

  useEffect(() => {
    if (currentCompany?.id) {
      loadLocations();
    }
  }, [currentCompany]);

  useEffect(() => {
    const loadCompanyUsers = async () => {
      if (!currentCompany?.id) {
        setCompanyUsers([]);
        return;
      }
      const { data } = await userService.getCompanyUsers(currentCompany.id);
      setCompanyUsers(data || []);
    };
    loadCompanyUsers();
  }, [currentCompany]);

  const loadLocations = async () => {
    if (!currentCompany?.id) {
      setError('No company selected');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await locationService.getLocations(currentCompany.id);
      setLocations(data);
      setFilteredLocations(data);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations. Please try again.');
      setLocations([]);
      setFilteredLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...locations];

    // Search filter
    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(location =>
        location?.name?.toLowerCase()?.includes(searchTerm) ||
        location?.code?.toLowerCase()?.includes(searchTerm) ||
        location?.address?.toLowerCase()?.includes(searchTerm)
      );
    }

    // Type filter
    if (filters?.type) {
      filtered = filtered?.filter(location => location?.type === filters?.type);
    }

    // Status filter
    if (filters?.status !== 'all') {
      filtered = filtered?.filter(location => location?.status === filters?.status);
    }

    setFilteredLocations(filtered);
  }, [locations, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: 'all'
    });
  };

  const hasActiveFilters = Boolean(filters?.search || filters?.type || filters?.status !== 'all');

  // Modal handlers
  const handleAddLocation = () => {
    setModalState({
      isOpen: true,
      mode: 'add',
      location: null
    });
  };

  const handleViewLocation = (location) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      location: location
    });
  };

  const handleEditLocation = (location) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      location: location
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: 'view',
      location: null
    });
  };

  const pushFeedback = (type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  const handleSaveLocation = async (formData) => {
    if (!currentCompany?.id) {
      throw new Error('No company selected');
    }

    try {
      if (modalState?.mode === 'add') {
        await locationService.createLocation(formData, currentCompany.id);
      } else if (modalState?.mode === 'edit') {
        await locationService.updateLocation(modalState?.location?.id, formData);
      }
      
      // Reload locations to get fresh data
      await loadLocations();
      handleCloseModal();
      pushFeedback('success', modalState?.mode === 'add' ? 'Emplacement ajouté avec succès.' : 'Emplacement mis à jour avec succès.');
    } catch (err) {
      console.error('Error saving location:', err);
      throw err; // Re-throw to let modal handle the error display
    }
  };

  const handleUploadLocationImage = async (locationId, file) => {
    if (!locationId || !file) return null;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('locationId', locationId);

    const response = await fetch('/api/upload-location-image', { method: 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Échec upload photo emplacement');
    }

    const updatedLocation = await locationService.getLocation(locationId);
    await loadLocations();
    pushFeedback('success', 'Photo emplacement ajoutée avec succès.');
    return updatedLocation;
  };

  const handleDeleteLocation = async (locationId) => {
    if (!currentCompany?.id) {
      throw new Error('No company selected');
    }

    if (!isSuperAdmin() && !isAdministrator()) {
      throw new Error('Unauthorized: Only admins can delete locations');
    }

    const locationName = modalState?.location?.name || locations.find((location) => location?.id === locationId)?.name || 'cet emplacement';
    if (!confirm(`Supprimer ${locationName} ? Cette action est définitive.`)) {
      return;
    }

    try {
      await locationService.deleteLocation(locationId, currentCompany.id);
      await loadLocations();
      
      // Close modal if it's open
      if (modalState?.isOpen) {
        handleCloseModal();
      }
      pushFeedback('success', 'Emplacement supprimé avec succès.');
    } catch (err) {
      console.error('Error deleting location:', err);
      pushFeedback('error', err?.message || 'Échec de la suppression de l’emplacement.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warehouse': return 'Warehouse';
      case 'retail':
      case 'showroom': return 'Store';
      case 'processing':
      case 'workshop': return 'Wrench';
      case 'transit':
      case 'truck': return 'Truck';
      case 'external': return 'MapPinned';
      default: return 'MapPin';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'warehouse': return 'Entrepôt';
      case 'retail': return 'Magasin';
      case 'processing': return 'Traitement';
      case 'transit': return 'Transit';
      case 'showroom': return 'Showroom';
      case 'workshop': return 'Atelier';
      case 'truck': return 'Camion';
      case 'external': return 'Externe';
      default: return type;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'maintenance': return 'text-warning';
      case 'inactive': return 'text-error';
      default: return 'text-text-muted';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactif';
      default: return status;
    }
  };

  const getOccupancyPercentage = (occupancy, capacity) => {
    return capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <>
      <Helmet>
        <title>Emplacements - StockFlow Pro</title>
        <meta name="description" content="Gérez vos emplacements de stockage, entrepôts et points de vente" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <SidebarNavigation
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={null}
          currentTenant={null}
        />

        <main className={`
          transition-all duration-200 ease-out
          ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}
          pt-16 lg:pt-0
        `}>
          {/* Header */}
          <PageHeader
            title="Emplacements"
            subtitle="Gérez vos entrepôts, magasins et points de stockage"
            actions={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="QrCode"
                  iconPosition="left"
                  className="text-xs lg:text-sm"
                  onClick={() => window.location.href = '/qr-scanner'}
                >
                  Scanner QR
                </Button>
                {canAdd && (
                  <Button
                    onClick={handleAddLocation}
                    iconName="Plus"
                    iconPosition="left"
                    size="sm"
                    className="text-xs lg:text-sm"
                  >
                    Nouvel emplacement
                  </Button>
                )}
              </>
            }
          />

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {feedback && <InlineFeedback type={feedback.type} message={feedback.message} />}
            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-error">
                  <Icon name="AlertCircle" size={20} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 lg:p-5 shadow-sm">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="w-full xl:max-w-xl">
                  <Input
                    placeholder="Rechercher un emplacement, code ou adresse..."
                    value={filters?.search}
                    onChange={(e) => handleFilterChange('search', e?.target?.value)}
                    iconName="Search"
                    className="text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <FilterDropdown
                    label="Type"
                    value={filters?.type}
                    onChange={(value) => handleFilterChange('type', value || '')}
                    placeholder="Type"
                    buttonIcon="MapPin"
                    className="w-full md:min-w-[180px] md:w-auto"
                    options={[
                      { value: 'warehouse', label: 'Entrepôt' },
                      { value: 'retail', label: 'Magasin' },
                      { value: 'processing', label: 'Traitement' },
                      { value: 'transit', label: 'Transit' },
                      { value: 'showroom', label: 'Showroom' },
                      { value: 'workshop', label: 'Atelier' },
                      { value: 'truck', label: 'Camion' },
                      { value: 'external', label: 'Externe' },
                    ]}
                  />

                  <FilterDropdown
                    label="Statut"
                    value={filters?.status === 'all' ? '' : filters?.status}
                    onChange={(value) => handleFilterChange('status', value || 'all')}
                    className="w-full md:min-w-[170px] md:w-auto"
                    options={[
                      { value: 'active', label: 'Actif' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'inactive', label: 'Inactif' },
                    ]}
                  />

                  <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="h-9 w-9 p-0 rounded-lg"
                      title="Vue tableau"
                    >
                      <Icon name="Table" size={16} />
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                      className="h-9 w-9 p-0 rounded-lg"
                      title="Vue cartes"
                    >
                      <Icon name="LayoutGrid" size={16} />
                    </Button>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={handleClearFilters}
                      iconName="RotateCcw"
                      iconPosition="left"
                      className="text-sm rounded-xl"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-text-muted">
                  {filteredLocations?.length} emplacement{filteredLocations?.length > 1 ? 's' : ''}
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters?.search && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('search', '')}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      <Icon name="Search" size={12} />
                      <span>{filters.search}</span>
                      <Icon name="X" size={12} />
                    </button>
                  )}

                  {filters?.type && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('type', '')}
                      className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-text-primary border border-border"
                    >
                      <span>Type : {getTypeLabel(filters.type)}</span>
                      <Icon name="X" size={12} />
                    </button>
                  )}

                  {filters?.status !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('status', 'all')}
                      className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-text-primary border border-border"
                    >
                      <span>Statut : {getStatusLabel(filters.status)}</span>
                      <Icon name="X" size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Locations Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : viewMode === 'table' ? (
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Nom</th>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Code</th>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Type</th>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Statut</th>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Occupation</th>
                        <th className="text-left p-4 text-sm font-medium text-text-secondary">Responsable</th>
                        <th className="text-right p-4 text-sm font-medium text-text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLocations?.map((location) => (
                        <tr
                          key={location?.id}
                          className="border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleViewLocation(location)}
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon name={getTypeIcon(location?.type)} size={18} className="text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-text-primary">{location?.name}</div>
                                <div className="text-xs text-text-muted truncate max-w-[220px]">{location?.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-text-muted">{location?.code || '—'}</td>
                          <td className="p-4 text-sm text-text-primary">{getTypeLabel(location?.type)}</td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(location?.status)} bg-current/10`}>
                              {getStatusLabel(location?.status)}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-text-primary">
                            {location?.capacity?.toLocaleString() || '—'}
                          </td>
                          <td className="p-4 text-sm text-text-muted">{location?.manager || '—'}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLocation(location)}
                                  iconName="Edit"
                                  className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLocation(location)}
                                iconName="Eye"
                                className="h-8 w-8 p-0 text-text-muted hover:text-text-primary"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <ResponsiveGrid cols="1 lg:2 xl:3" gap="4 lg:6">
                {filteredLocations?.map((location) => (
                  <div 
                    key={location?.id} 
                    className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewLocation(location)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon name={getTypeIcon(location?.type)} size={20} className="text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary text-sm lg:text-base">{location?.name}</h3>
                          <p className="text-xs lg:text-sm text-text-muted">{location?.code}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(location?.status)} bg-current/10`}>
                        {getStatusLabel(location?.status)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-text-muted">Type</span>
                        <span className="text-text-primary font-medium">{getTypeLabel(location?.type)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="text-text-muted">Capacité</span>
                        <span className="text-text-primary font-medium">
                          {location?.capacity?.toLocaleString() || '—'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-text-muted mb-2">{location?.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-text-muted">
                          <Icon name="MapPin" size={12} />
                          <span className="truncate">{location?.address}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <div className="flex items-center space-x-1 text-text-muted">
                            <Icon name="User" size={12} />
                            <span>{location?.manager}</span>
                          </div>
                          {canEdit && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLocation(location);
                                }}
                                iconName="Edit"
                                className="h-6 w-6 p-0 text-text-muted hover:text-text-primary"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLocation(location);
                                }}
                                iconName="Eye"
                                className="h-6 w-6 p-0 text-text-muted hover:text-text-primary"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ResponsiveGrid>
            )}

            {filteredLocations?.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Icon name="MapPin" size={48} className="text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {error ? 'Erreur de chargement' : 'Aucun emplacement trouvé'}
                </h3>
                <p className="text-text-muted">
                  {error 
                    ? 'Veuillez vérifier votre connexion et réessayer.'
                    : 'Aucun emplacement ne correspond aux critères de recherche actuels.'}
                </p>
              </div>
            )}
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={null} />

        {/* Location Modal */}
        <LocationModal
          isOpen={modalState?.isOpen}
          onClose={handleCloseModal}
          location={modalState?.location}
          mode={modalState?.mode}
          onSave={handleSaveLocation}
          onDelete={handleDeleteLocation}
          onUploadImage={handleUploadLocationImage}
          companyUsers={companyUsers}
          canEdit={canEdit}
          isSuperAdmin={isSuperAdmin()}
        />
      </div>
    </>
  );
};

export default LocationsPage;
