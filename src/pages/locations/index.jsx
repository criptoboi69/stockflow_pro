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
import productService from '../../services/productService';

const LocationsPage = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'all'
  });

  const { currentRole, currentCompany } = useAuth();
  const userRole = currentRole || 'user';

  const buildLocationsFromProducts = (products) => {
    const map = new Map();

    products.forEach((product) => {
      const locationName = (product?.location || 'Non défini').trim();
      if (!map.has(locationName)) {
        map.set(locationName, {
          id: locationName,
          name: locationName,
          code: locationName.slice(0, 3).toUpperCase() || 'LOC',
          type: 'warehouse',
          status: 'active',
          description: `Emplacement calculé depuis les produits rattachés à "${locationName}"`,
          address: 'Adresse non renseignée',
          capacity: 0,
          occupancy: 0,
          manager: 'N/A',
          phone: 'N/A',
          email: 'N/A',
          createdAt: product?.createdAt || new Date().toISOString(),
          updatedAt: product?.updatedAt || new Date().toISOString()
        });
      }

      const current = map.get(locationName);
      current.occupancy += Number(product?.quantity || 0);
      current.capacity = Math.max(current.capacity, current.occupancy);
      current.updatedAt = product?.updatedAt || current.updatedAt;
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    const loadLocations = async () => {
      if (!currentCompany?.id) {
        setLocations([]);
        setFilteredLocations([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const products = await productService.getProducts(currentCompany.id);
        const derivedLocations = buildLocationsFromProducts(products);
        setLocations(derivedLocations);
        setFilteredLocations(derivedLocations);
      } catch (error) {
        console.error('Error loading locations from products:', error);
        setLocations([]);
        setFilteredLocations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocations();
  }, [currentCompany?.id]);

  useEffect(() => {
    let filtered = [...locations];

    if (filters?.search) {
      const searchTerm = filters?.search?.toLowerCase();
      filtered = filtered?.filter(location =>
        location?.name?.toLowerCase()?.includes(searchTerm) ||
        location?.code?.toLowerCase()?.includes(searchTerm) ||
        location?.description?.toLowerCase()?.includes(searchTerm)
      );
    }

    if (filters?.type) {
      filtered = filtered?.filter(location => location?.type === filters?.type);
    }

    if (filters?.status !== 'all') {
      filtered = filtered?.filter(location => location?.status === filters?.status);
    }

    setFilteredLocations(filtered);
  }, [locations, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', type: '', status: 'all' });
  };

  const getTypeIcon = () => 'Warehouse';
  const getTypeLabel = () => 'Entrepôt';

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
    if (!capacity || capacity <= 0) return occupancy > 0 ? 100 : 0;
    return Math.min(Math.round((occupancy / capacity) * 100), 100);
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-error';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <>
      <Helmet>
        <title>Emplacements - StockFlow Pro</title>
        <meta name="description" content="Consultez les emplacements calculés depuis vos produits en base." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <SidebarNavigation
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userRole={userRole}
          currentTenant={currentCompany || { name: 'StockFlow Pro' }}
        />

        <main className={`transition-all duration-200 ease-out pt-16 lg:pt-0 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
          <div className="p-4 lg:p-6">
            <div className="mb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-text-primary mb-2">Emplacements</h1>
              <p className="text-text-muted">Liste issue des emplacements réellement présents sur vos produits.</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e?.target?.value)}
                />

                <Select
                  value={filters.type}
                  onChange={(value) => handleFilterChange('type', value)}
                  options={[
                    { value: '', label: 'Tous les types' },
                    { value: 'warehouse', label: 'Entrepôt' }
                  ]}
                />

                <Select
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'active', label: 'Actif' },
                    { value: 'maintenance', label: 'Maintenance' },
                    { value: 'inactive', label: 'Inactif' }
                  ]}
                />

                <Button variant="outline" onClick={handleClearFilters} iconName="X" iconPosition="left" className="text-sm">
                  Effacer
                </Button>
              </div>
            </div>

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
                      </div>

                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-text-muted mb-2">{location?.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-text-muted">
                          <Icon name="MapPin" size={12} />
                          <span className="truncate">{location?.address}</span>
                        </div>
                        {['super_admin', 'administrator']?.includes(userRole) && (
                          <div className="mt-2 text-xs text-text-muted">Gestion avancée d'emplacements à brancher sur une table dédiée.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ResponsiveGrid>
            )}

            {filteredLocations?.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Icon name="MapPin" size={48} className="text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">Aucun emplacement trouvé</h3>
                <p className="text-text-muted">Aucun emplacement produit n'a été trouvé pour cette entreprise.</p>
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
