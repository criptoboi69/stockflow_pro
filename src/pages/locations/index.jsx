import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';

import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ResponsiveGrid from '../../components/ResponsiveGrid';
import { useAuth } from '../../contexts/AuthContext';

const LocationsPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'all'
  });

  const { currentRole, currentCompany } = useAuth();
  const userRole = currentRole || 'user';

  // Mock locations data
  const mockLocations = [
    {
      id: 'warehouse-a',
      name: 'Entrepôt A',
      code: 'WH-A',
      type: 'warehouse',
      status: 'active',
      description: 'Entrepôt principal pour le stockage des équipements informatiques',
      address: '123 Rue de la Logistique, 75012 Paris',
      capacity: 5000,
      occupancy: 3250,
      manager: 'Marie Dubois',
      phone: '+33 1 45 67 89 01',
      email: 'warehouse-a@techcorp.fr',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-10-20T14:30:00Z'
    },
    {
      id: 'warehouse-b',
      name: 'Entrepôt B',
      code: 'WH-B',
      type: 'warehouse',
      status: 'active',
      description: 'Entrepôt secondaire pour overflow et stockage saisonnier',
      address: '456 Avenue de la Distribution, 94200 Ivry-sur-Seine',
      capacity: 3000,
      occupancy: 1800,
      manager: 'Pierre Martin',
      phone: '+33 1 45 67 89 02',
      email: 'warehouse-b@techcorp.fr',
      createdAt: '2024-02-10T09:30:00Z',
      updatedAt: '2024-10-18T11:45:00Z'
    },
    {
      id: 'store-front',
      name: 'Magasin',
      code: 'STR-01',
      type: 'retail',
      status: 'active',
      description: 'Point de vente principal avec showroom et stock de démonstration',
      address: '789 Boulevard du Commerce, 75001 Paris',
      capacity: 800,
      occupancy: 650,
      manager: 'Sophie Laurent',
      phone: '+33 1 45 67 89 03',
      email: 'store@techcorp.fr',
      createdAt: '2024-01-20T14:00:00Z',
      updatedAt: '2024-10-22T16:20:00Z'
    },
    {
      id: 'returns',
      name: 'Retours',
      code: 'RET-01',
      type: 'processing',
      status: 'active',
      description: 'Centre de traitement des retours et réparations',
      address: '321 Rue du Service, 92100 Boulogne-Billancourt',
      capacity: 500,
      occupancy: 180,
      manager: 'Thomas Rousseau',
      phone: '+33 1 45 67 89 04',
      email: 'returns@techcorp.fr',
      createdAt: '2024-03-05T11:15:00Z',
      updatedAt: '2024-10-15T09:30:00Z'
    },
    {
      id: 'transit-hub',
      name: 'Hub de Transit',
      code: 'HUB-01',
      type: 'transit',
      status: 'maintenance',
      description: 'Point de transit temporaire pour expéditions inter-entrepôts',
      address: '654 Zone Industrielle, 93400 Saint-Ouen',
      capacity: 1200,
      occupancy: 0,
      manager: 'Amélie Moreau',
      phone: '+33 1 45 67 89 05',
      email: 'transit@techcorp.fr',
      createdAt: '2024-04-12T13:45:00Z',
      updatedAt: '2024-10-20T08:10:00Z'
    }
  ];

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      setLocations(mockLocations);
      setFilteredLocations(mockLocations);
      setIsLoading(false);
    };
    loadLocations();
  }, []);

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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warehouse': return 'Warehouse';
      case 'retail': return 'Store';
      case 'processing': return 'Wrench';
      case 'transit': return 'Truck';
      default: return 'MapPin';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'warehouse': return 'Entrepôt';
      case 'retail': return 'Magasin';
      case 'processing': return 'Traitement';
      case 'transit': return 'Transit';
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
          userRole={currentRole}
          currentTenant={currentCompany}
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
                <h1 className="text-xl lg:text-2xl font-semibold text-text-primary">Emplacements</h1>
                <p className="text-text-muted mt-1 text-sm lg:text-base">
                  Gérez vos entrepôts, magasins et points de stockage
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  className="text-xs lg:text-sm"
                >
                  Exporter
                </Button>
                {['super_admin', 'administrator']?.includes(userRole) && (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    iconName="Plus"
                    iconPosition="left"
                    size="sm"
                    className="text-xs lg:text-sm"
                  >
                    Nouvel emplacement
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-6 space-y-6">
            {/* Filters */}
            <div className="bg-surface border border-border rounded-lg p-4 lg:p-6">
              <h3 className="text-sm lg:text-base font-medium text-text-primary mb-4">Filtres</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Rechercher..."
                  value={filters?.search}
                  onChange={(e) => handleFilterChange('search', e?.target?.value)}
                  iconName="Search"
                  className="text-sm"
                />
                
                <Select
                  value={filters?.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                  placeholder="Type d'emplacement"
                >
                  <option value="">Tous les types</option>
                  <option value="warehouse">Entrepôt</option>
                  <option value="retail">Magasin</option>
                  <option value="processing">Traitement</option>
                  <option value="transit">Transit</option>
                </Select>

                <Select
                  value={filters?.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactif</option>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  iconName="X"
                  iconPosition="left"
                  className="text-sm"
                >
                  Effacer
                </Button>
              </div>
            </div>

            {/* Locations Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveGrid cols="1 lg:2 xl:3" gap="4 lg:6">
                {filteredLocations?.map((location) => (
                  <div key={location?.id} className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow hover:shadow-lg transition-shadow">
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs lg:text-sm">
                          <span className="text-text-muted">Occupation</span>
                          <span className="text-text-primary font-medium">
                            {location?.occupancy?.toLocaleString()} / {location?.capacity?.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${getOccupancyColor(getOccupancyPercentage(location?.occupancy, location?.capacity))}`}
                            style={{ width: `${getOccupancyPercentage(location?.occupancy, location?.capacity)}%` }}
                          />
                        </div>
                        <div className="text-xs text-text-muted text-right">
                          {getOccupancyPercentage(location?.occupancy, location?.capacity)}% utilisé
                        </div>
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
                          {['super_admin', 'administrator']?.includes(userRole) && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLocation(location)}
                                iconName="Edit"
                                className="h-6 w-6 p-0 text-text-muted hover:text-text-primary"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
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
                  Aucun emplacement trouvé
                </h3>
                <p className="text-text-muted">
                  Aucun emplacement ne correspond aux critères de recherche actuels.
                </p>
              </div>
            )}
          </div>
        </main>

        <QuickActionBar variant="floating" userRole={currentRole} />
      </div>
    </>
  );
};

export default LocationsPage;