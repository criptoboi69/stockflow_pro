import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MovementTimeline = ({
  movements,
  onEditMovement,
  onViewDetails,
  userRole,
  isLoading = false,
}) => {
  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'receipt': return 'ArrowDown';
      case 'issue': return 'ArrowUp';
      case 'adjustment': return 'Edit';
      case 'transfer': return 'ArrowLeftRight';
      default: return 'Package';
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'receipt': return 'text-success';
      case 'issue': return 'text-error';
      case 'adjustment': return 'text-warning';
      case 'transfer': return 'text-accent';
      default: return 'text-text-secondary';
    }
  };

  const getQuantityDisplay = (movement) => {
    const sign = movement?.quantity >= 0 ? '+' : '-';
    return `${sign}${Math.abs(movement?.quantity || 0)}`;
  };

  const canEdit = () => ['super_admin', 'administrator', 'manager', 'user']?.includes(userRole);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)]?.map((_, index) => (
          <div key={index} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-surface rounded-lg border border-border animate-pulse">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movements?.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-surface rounded-lg border border-border">
        <Icon name="Package" size={48} className="mx-auto text-text-muted mb-4" />
        <h3 className="text-base sm:text-lg font-medium text-text-primary mb-2 px-4">Aucun mouvement trouvé</h3>
        <p className="text-sm sm:text-base text-text-muted px-4">Aucun mouvement de stock ne correspond à vos filtres actuels.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {movements?.map((movement, index) => (
        <div key={movement?.id} className="relative">
          {index < movements?.length - 1 && (
            <div className="absolute left-4 sm:left-5 top-14 sm:top-16 w-0.5 h-6 sm:h-8 bg-border hidden sm:block"></div>
          )}

          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between sm:space-x-4 sm:p-4 bg-surface rounded-lg border border-border hover:border-primary/20 transition-colors">
            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
              <div className={`
                w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${movement?.type === 'receipt' ? 'bg-success/10' :
                  movement?.type === 'issue' ? 'bg-error/10' :
                  movement?.type === 'adjustment' ? 'bg-warning/10' : 'bg-accent/10'}
              `}>
                <Icon
                  name={getMovementTypeIcon(movement?.type)}
                  size={18}
                  className={getMovementTypeColor(movement?.type)}
                />
              </div>

              <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                <h4 className="font-medium text-text-primary text-sm sm:text-base break-words">{movement?.product?.name || 'Produit supprimé/inconnu'}</h4>
                <span className="text-xs px-2 py-1 bg-muted rounded-full text-text-muted inline-block w-fit mt-1 sm:mt-0">
                  SKU: {movement?.product?.sku || '—'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-text-secondary mb-2 sm:mb-3">
                <span className="flex items-center space-x-1">
                  <Icon name="Calendar" size={12} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{new Date(movement?.createdAt)?.toLocaleDateString('fr-FR')}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="Clock" size={12} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{new Date(movement?.createdAt)?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon name="User" size={12} className="flex-shrink-0" />
                  <span className="truncate">{movement?.user?.fullName || 'Utilisateur inconnu'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm mb-2 sm:mb-0">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-text-muted whitespace-nowrap">Quantité:</span>
                  <span className={`font-medium ${movement?.quantity >= 0 ? 'text-success' : 'text-error'}`}>
                    {getQuantityDisplay(movement)}
                  </span>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="text-text-muted whitespace-nowrap">Solde:</span>
                  <span className="font-medium text-text-primary">{movement?.runningBalance ?? '—'}</span>
                </div>

                <div className="flex items-center space-x-1 sm:space-x-2 col-span-2">
                  <span className="text-text-muted whitespace-nowrap">Emplacement:</span>
                  <span className="text-text-primary truncate">{movement?.location || '—'}</span>
                </div>
              </div>

              {movement?.reason && (
                <div className="mt-2 p-2 bg-muted rounded text-xs sm:text-sm text-text-secondary">
                  <span className="font-medium">Motif: </span>
                  <span className="break-words">{movement?.reason}</span>
                </div>
              )}

              </div>
            </div>

            <div className="flex items-center justify-end gap-2 sm:flex-col sm:items-end sm:justify-start sm:min-w-[132px]">
              {canEdit() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditMovement?.(movement)}
                  className="h-9 rounded-lg px-3 text-text-secondary hover:text-primary hover:bg-primary/10 justify-center"
                >
                  <Icon name="Edit" size={15} className="mr-2 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Modifier</span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails?.(movement)}
                className="h-9 rounded-lg px-3 text-text-secondary hover:text-text-primary hover:bg-muted justify-center"
              >
                <Icon name="Eye" size={15} className="mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Détails</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovementTimeline;
