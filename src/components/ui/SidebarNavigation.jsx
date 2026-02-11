import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Icon from '../AppIcon';
import ThemeToggle from './ThemeToggle';

const SidebarNavigation = ({
  isCollapsed = false,
  onToggleCollapse,
  userRole = 'user',
  currentTenant = 'StockFlow Pro'
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: 'BarChart3',
    path: '/dashboard',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'products',
    label: 'Produits',
    icon: 'Package',
    path: '/products',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'categories',
    label: 'Catégories',
    icon: 'Tag',
    path: '/categories',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'locations',
    label: 'Emplacements',
    icon: 'MapPin',
    path: '/locations',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'stock-movements',
    label: 'Mouvements de stock',
    icon: 'TrendingUp',
    path: '/stock-movements',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'qr-scanner',
    label: 'Scanner QR',
    icon: 'Scan',
    path: '/qr-scanner',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  },
  {
    id: 'user-management',
    label: 'Gestion utilisateurs',
    icon: 'Users',
    path: '/user-management',
    roles: ['super_admin', 'administrator'],
    badge: null
  },
  {
    id: 'data-management',
    label: 'Gestion des données',
    icon: 'Database',
    path: '/data-management',
    roles: ['super_admin', 'administrator'],
    badge: null
  },
  {
    id: 'audit-trail',
    label: 'Journal d\'audit',
    icon: 'FileText',
    path: '/audit-trail',
    roles: ['super_admin', 'administrator'],
    badge: null
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: 'Settings',
    path: '/settings',
    roles: ['super_admin', 'administrator', 'manager', 'user'],
    badge: null
  }];


  const hasAccess = (roles) => {
    // If userRole is not yet loaded (null/undefined), show all items
    if (!userRole) return true;
    return roles?.includes(userRole);
  };

  const accessibleItems = navigationItems?.filter((item) => hasAccess(item?.roles));

  const isActive = (path) => {
    return location?.pathname === path || location?.pathname?.startsWith(path + '/');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleMobileToggle}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted/50 text-text-primary hover:bg-muted transition-colors">

              <Icon name="Menu" size={20} />
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Package" size={16} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-text-primary">StockFlow</span>
            </div>
          </div>

          {/* Mobile Theme Toggle */}
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen &&
      <div
        className="lg:hidden fixed inset-0 z-40 bg-black/50"
        onClick={closeMobile} />

      }

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50 bg-surface border-r border-border sidebar-shadow transition-all duration-200 ease-out
        ${isCollapsed ? 'w-16' : 'w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed &&
          <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Package" size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">StockFlow</h2>
                <p className="text-xs text-text-muted">{currentTenant?.name || 'StockFlow Pro'}</p>
              </div>
            </div>
          }
          
          <div className="flex items-center space-x-2">
            {/* Desktop Theme Toggle */}
            <div className="hidden lg:block">
              <ThemeToggle
                size={isCollapsed ? "sm" : "md"}
                variant="dropdown"
                showLabel={!isCollapsed} />

            </div>
            
            {/* Collapse Toggle - Hidden on mobile */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-muted/50 text-text-muted hover:bg-muted hover:text-text-primary transition-colors">

              <Icon
                name={isCollapsed ? "ChevronRight" : "ChevronLeft"}
                size={16} />

            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {accessibleItems?.map((item) => {
              const active = isActive(item?.path);

              return (
                <Link
                  key={item?.id}
                  to={item?.path}
                  onClick={closeMobile}
                  className={`
                    flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ease-out group touch-target
                    ${active ?
                  'bg-primary/10 text-primary border border-primary/20' : 'text-text-secondary hover:text-text-primary hover:bg-muted/50'}
                  `
                  }
                  title={isCollapsed ? item?.label : undefined}>

                  <div className={`
                    w-6 h-6 flex items-center justify-center transition-colors
                    ${active ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}
                  `}>
                    <Icon name={item?.icon} size={20} />
                  </div>
                  
                  {!isCollapsed &&
                  <>
                      <span className="flex-1 font-medium">{item?.label}</span>
                      {item?.badge &&
                    <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                          {item?.badge}
                        </span>
                    }
                    </>
                  }
                </Link>);

            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!isCollapsed ?
          <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                  <img
                  src="https://images.unsplash.com/photo-1714974528749-fc028e54feb9"
                  alt="Professional headshot of user avatar in business attire"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/assets/images/no_image.png';
                  }} />

                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">Jean Dupont</p>
                  <p className="text-xs text-text-muted truncate">Admin • TechCorp</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>v2.1.0</span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>En ligne</span>
                </span>
              </div>
            </div> :

          <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                <img
                src="https://images.unsplash.com/photo-1714974528749-fc028e54feb9"
                alt="Professional headshot of user avatar in business attire"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/assets/images/no_image.png';
                }} />

              </div>
              <div className="w-2 h-2 bg-success rounded-full"></div>
            </div>
          }
        </div>
      </div>
    </>);

};

export default SidebarNavigation;