import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const UserTable = ({ 
  users, 
  selectedUsers, 
  onSelectUser, 
  onSelectAll, 
  onEdit, 
  onToggleStatus, 
  onViewDetails,
  currentUserRole,
  sortBy,
  sortOrder,
  onSort
}) => {
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

  const getRoleLabel = (role) => {
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrateur',
      manager: 'Gestionnaire',
      employee: 'Employé'
    };
    return labels?.[role] || role;
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-success/10 text-success border-success/20' :'bg-error/10 text-error border-error/20';
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Jamais connecté';
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor((now - loginDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return loginDate?.toLocaleDateString('fr-FR');
  };

  const canEdit = (user) => {
    return currentUserRole === 'super_admin' || 
      (currentUserRole === 'administrator' && user?.role !== 'super_admin') ||
      (currentUserRole === 'manager' && user?.role === 'employee');
  };

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'ArrowUpDown';
    return sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedUsers?.length === users?.length && users?.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('name')}
                  className="font-semibold text-text-primary hover:text-text-primary"
                >
                  Utilisateur
                  <Icon name={getSortIcon('name')} size={16} className="ml-2" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('role')}
                  className="font-semibold text-text-primary hover:text-text-primary"
                >
                  Rôle
                  <Icon name={getSortIcon('role')} size={16} className="ml-2" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('company')}
                  className="font-semibold text-text-primary hover:text-text-primary"
                >
                  Société
                  <Icon name={getSortIcon('company')} size={16} className="ml-2" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('lastLogin')}
                  className="font-semibold text-text-primary hover:text-text-primary"
                >
                  Dernière connexion
                  <Icon name={getSortIcon('lastLogin')} size={16} className="ml-2" />
                </Button>
              </th>
              <th className="text-left p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="font-semibold text-text-primary hover:text-text-primary"
                >
                  Statut
                  <Icon name={getSortIcon('status')} size={16} className="ml-2" />
                </Button>
              </th>
              <th className="text-right p-4 font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user) => (
              <tr key={user?.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers?.includes(user?.id)}
                    onChange={() => onSelectUser(user?.id)}
                    className="rounded border-border"
                  />
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Image
                        src={user?.avatar}
                        alt={user?.avatarAlt}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                        user?.isActive ? 'bg-success' : 'bg-error'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                    {(user?.firstName || user?.fullName || user?.name) 
                      ? (user?.firstName && user?.lastName 
                          ? user.firstName + ' ' + user.lastName 
                          : user?.fullName || user?.name || '')
                      : ''}
                  </p>
                      <p className="text-sm text-text-muted">{user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user?.role)}`}>
                    {getRoleLabel(user?.role)}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-text-primary">{user?.company}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-text-secondary">{formatLastLogin(user?.lastLogin)}</span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user?.isActive)}`}>
                    {user?.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(user)}
                      className="text-text-secondary hover:text-text-primary"
                      title="Voir les détails"
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                    {canEdit(user) && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user)}
                          className="text-text-secondary hover:text-text-primary"
                          title="Modifier"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onToggleStatus(user?.id, user?.isActive)}
                          className="text-text-secondary hover:text-text-primary"
                          title={user?.isActive ? 'Désactiver' : 'Activer'}
                        >
                          <Icon name={user?.isActive ? 'UserX' : 'UserCheck'} size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;