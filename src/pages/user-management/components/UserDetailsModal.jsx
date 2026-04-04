import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manager':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'inactive':
        return 'bg-error/10 text-error border-error/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    return new Date(dateString)?.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activityLog = [];

  const permissions = [
    { name: 'Voir les produits', granted: true },
    { name: 'Modifier les produits', granted: ['manager', 'admin', 'super_admin']?.includes(user?.role) },
    { name: 'Supprimer les produits', granted: ['admin', 'super_admin']?.includes(user?.role) },
    { name: 'Gérer les catégories', granted: ['manager', 'admin', 'super_admin']?.includes(user?.role) },
    { name: 'Gérer les emplacements', granted: ['manager', 'admin', 'super_admin']?.includes(user?.role) },
    { name: 'Scanner les QR codes', granted: true },
    { name: 'Voir les mouvements de stock', granted: true },
    { name: 'Créer des mouvements', granted: true },
    { name: 'Importer/Exporter des données', granted: ['manager', 'admin', 'super_admin']?.includes(user?.role) },
    { name: 'Gérer les utilisateurs', granted: ['admin', 'super_admin']?.includes(user?.role) },
    { name: 'Accès aux paramètres', granted: ['admin', 'super_admin']?.includes(user?.role) }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-200 p-4">
      <div className="bg-card rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden modal-shadow">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Détails de l'utilisateur</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* User Profile Header */}
            <div className="flex items-start space-x-6 mb-8">
              <div className="relative">
                <Image
                  src={user?.avatar}
                  alt={user?.avatarAlt}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white ${
                  user?.status === 'active' ? 'bg-success' : 
                  user?.status === 'pending' ? 'bg-warning' : 'bg-error'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-text-primary mb-2">{user?.name}</h3>
                <p className="text-text-muted mb-4">{user?.email}</p>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user?.role)}`}>
                    {user?.role === 'SUPER_ADMIN' ? 'Super Admin' :
                     user?.role === 'ADMIN_SOCIETE' ? 'Admin Société' : 'Membre'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(user?.status)}`}>
                    {user?.status === 'active' ? 'Actif' :
                     user?.status === 'pending' ? 'En attente' : 'Inactif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* User Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Informations générales</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-text-secondary">Société</span>
                      <span className="font-medium text-text-primary">{user?.company}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-text-secondary">Date de création</span>
                      <span className="font-medium text-text-primary">{formatDate(user?.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-text-secondary">Dernière connexion</span>
                      <span className="font-medium text-text-primary">{formatDate(user?.lastLogin)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-text-secondary">Dernière modification</span>
                      <span className="font-medium text-text-primary">{formatDate(user?.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-4">Permissions</h4>
                  <div className="space-y-2">
                    {permissions?.map((permission, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <span className="text-text-secondary">{permission?.name}</span>
                        <div className="flex items-center">
                          {permission?.granted ? (
                            <Icon name="Check" size={16} className="text-success" />
                          ) : (
                            <Icon name="X" size={16} className="text-error" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-4">Activité récente</h4>
                <div className="space-y-4">
                  {activityLog?.map((activity) => (
                    <div key={activity?.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                      <div className={`w-8 h-8 rounded-full bg-background flex items-center justify-center ${activity?.color}`}>
                        <Icon name={activity?.icon} size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{activity?.action}</p>
                        <p className="text-sm text-text-muted">{activity?.details}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {formatDate(activity?.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                >
                  <Icon name="History" size={16} className="mr-2" />
                  Voir l'historique complet
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;