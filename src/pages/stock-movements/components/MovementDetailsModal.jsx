import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MovementDetailsModal = ({ isOpen, onClose, movement }) => {
  if (!isOpen || !movement) return null;

  const getMovementTypeIcon = (type) => {
    switch (type) {
      case 'receipt': return 'ArrowDown';
      case 'issue': return 'ArrowUp';
      case 'adjustment': return 'Edit';
      case 'transfer': return 'ArrowLeftRight';
      default: return 'Package';
    }
  };

  const getMovementTypeLabel = (type) => {
    switch (type) {
      case 'receipt': return 'Réception';
      case 'issue': return 'Sortie';
      case 'adjustment': return 'Ajustement';
      case 'transfer': return 'Transfert';
      default: return 'Inconnu';
    }
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'receipt': return 'text-success bg-success/10';
      case 'issue': return 'text-error bg-error/10';
      case 'adjustment': return 'text-warning bg-warning/10';
      case 'transfer': return 'text-accent bg-accent/10';
      default: return 'text-text-secondary bg-muted';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getMovementTypeColor(movement?.type)}`}>
              <Icon 
                name={getMovementTypeIcon(movement?.type)} 
                size={20} 
                className={getMovementTypeColor(movement?.type)?.split(' ')?.[0]}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Détails du mouvement
              </h2>
              <p className="text-text-muted text-sm">
                {getMovementTypeLabel(movement?.type)} • {movement?.id}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Product Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Package" size={20} className="mr-2" />
              Informations produit
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <img
                  src={movement?.product?.image}
                  alt={movement?.product?.imageAlt}
                  className="w-20 h-20 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary text-lg mb-2">
                    {movement?.product?.name}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text-muted">SKU:</span>
                      <p className="font-medium text-text-primary">{movement?.product?.sku}</p>
                    </div>
                    <div>
                      <span className="text-text-muted">ID Produit:</span>
                      <p className="font-medium text-text-primary">{movement?.product?.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Activity" size={20} className="mr-2" />
              Informations du mouvement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <span className="text-text-muted text-sm">Type de mouvement</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getMovementTypeColor(movement?.type)}`}>
                      <Icon 
                        name={getMovementTypeIcon(movement?.type)} 
                        size={14} 
                        className={getMovementTypeColor(movement?.type)?.split(' ')?.[0]}
                      />
                    </div>
                    <span className="font-medium text-text-primary">{getMovementTypeLabel(movement?.type)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted text-sm">Quantité</span>
                  <p className={`font-bold text-lg ${
                    movement?.quantity > 0 ? 'text-success' : 'text-error'
                  }`}>
                    {movement?.quantity > 0 ? '+' : ''}{movement?.quantity}
                  </p>
                </div>

                <div>
                  <span className="text-text-muted text-sm">Solde après mouvement</span>
                  <p className="font-medium text-text-primary text-lg">{movement?.runningBalance}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <span className="text-text-muted text-sm">Emplacement</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Icon name="MapPin" size={16} className="text-text-muted" />
                    <span className="font-medium text-text-primary">{movement?.location?.name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted text-sm">Utilisateur</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Icon name="User" size={16} className="text-text-muted" />
                    <span className="font-medium text-text-primary">{movement?.user?.name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted text-sm">ID Mouvement</span>
                  <p className="font-mono text-text-primary bg-muted px-2 py-1 rounded text-sm">
                    {movement?.id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Clock" size={20} className="mr-2" />
              Horodatage
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-text-muted text-sm">Date de création</span>
                <p className="font-medium text-text-primary">
                  {new Date(movement?.createdAt)?.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-text-secondary text-sm">
                  à {new Date(movement?.createdAt)?.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <span className="text-text-muted text-sm">Dernière modification</span>
                <p className="font-medium text-text-primary">
                  {new Date(movement?.updatedAt)?.toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-text-secondary text-sm">
                  à {new Date(movement?.updatedAt)?.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Reason */}
          {movement?.reason && (
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
                <Icon name="FileText" size={20} className="mr-2" />
                Motif
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-text-primary leading-relaxed">{movement?.reason}</p>
              </div>
            </div>
          )}

          {/* Additional Metadata */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
              <Icon name="Info" size={20} className="mr-2" />
              Informations techniques
            </h3>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">ID Produit</span>
                  <p className="font-mono text-text-primary">{movement?.product?.id}</p>
                </div>
                <div>
                  <span className="text-text-muted">ID Emplacement</span>
                  <p className="font-mono text-text-primary">{movement?.location?.id}</p>
                </div>
                <div>
                  <span className="text-text-muted">ID Utilisateur</span>
                  <p className="font-mono text-text-primary">{movement?.user?.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-text-muted">
              <Icon name="Shield" size={16} />
              <span>Données protégées par audit trail</span>
            </div>
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetailsModal;