import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import QuickActionBar from '../../components/ui/QuickActionBar';
import UserCard from './components/UserCard';
import UserTable from './components/UserTable';
import AddUserModal from './components/AddUserModal';
import EditUserModal from './components/EditUserModal';
import UserDetailsModal from './components/UserDetailsModal';
import BulkActionsBar from './components/BulkActionsBar';
import UserFilters from './components/UserFilters';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { userService } from '../../services/userService';

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentCompany, currentRole, profile, canManageUsers } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter and sort states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    if (currentCompany?.id) {
      loadUsers();
      loadInvitations();
    }
  }, [currentCompany]);

  const loadUsers = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const { data, error } = await userService?.getCompanyUsers(currentCompany?.id);
      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      logger.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!currentCompany?.id) return;

    try {
      const { data, error } = await userService?.getCompanyInvitations(currentCompany?.id);
      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      logger.error('Error loading invitations:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, users, sortBy, sortOrder]);

  const applyFilters = () => {
    let filtered = [...users];

    if (filters?.search) {
      const searchLower = filters?.search?.toLowerCase();
      filtered = filtered?.filter(user =>
        user?.fullName?.toLowerCase()?.includes(searchLower) ||
        user?.email?.toLowerCase()?.includes(searchLower)
      );
    }

    if (filters?.role) {
      filtered = filtered?.filter(user => user?.role === filters?.role);
    }

    if (filters?.status) {
      const isActive = filters?.status === 'active';
      filtered = filtered?.filter(user => user?.isActive === isActive);
    }

    filtered?.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a?.fullName || '';
          bVal = b?.fullName || '';
          break;
        case 'email':
          aVal = a?.email || '';
          bVal = b?.email || '';
          break;
        case 'role':
          aVal = a?.role || '';
          bVal = b?.role || '';
          break;
        case 'date':
          aVal = new Date(a?.createdAt || 0);
          bVal = new Date(b?.createdAt || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: ''
    });
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev?.includes(userId) ?
        prev?.filter((id) => id !== userId) :
        [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers?.length === filteredUsers?.length ?
        [] :
        filteredUsers?.map((user) => user?.id)
    );
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleAddUser = async (userData) => {
    try {
      const { data, error } = await userService?.inviteUser({
        email: userData?.email,
        companyId: currentCompany?.id,
        role: userData?.role,
        invitedBy: profile?.id,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        companyName: currentCompany?.name,
        inviterName: profile?.fullName || profile?.email
      });

      if (error) throw error;

      // Show invitation link (email might not be configured)
      const linkMessage = `Invitation créée !\n\nLien d'acceptation :\n${data?.acceptUrl}\n\nCopie ce lien et envoie-le à ${userData?.email}`;
      alert(linkMessage);

      await loadUsers();
      setIsAddModalOpen(false);
      return { success: true, acceptUrl: data?.acceptUrl };
    } catch (error) {
      logger.error('Error inviting user:', error);
      throw error;
    }
  };

  const handleEditUser = async (userId, updates) => {
    try {
      const { error } = await userService?.updateUser(userId, {
        firstName: updates?.firstName,
        lastName: updates?.lastName,
        fullName: `${updates?.firstName || ''} ${updates?.lastName || ''}`.trim(),
        phone: updates?.phone,
        role: updates?.role
      });
      if (error) throw error;

      if (updates?.role) {
        const { error: roleError } = await userService?.updateUserRole(userId, currentCompany?.id, updates?.role);
        if (roleError) throw roleError;
      }

      await loadUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
      return { ok: true };
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  };

  // Open edit modal with user data
  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userData) => {
    try {
      const { error } = await userService?.updateUser(userData?.id, userData);
      if (error) throw error;
      await loadUsers();
    } catch (error) {
      logger.error('Error updating user:', error);
    }
  };

  const handleToggleStatus = async (userId, isCurrentlyActive) => {
    const confirmMessage = isCurrentlyActive
      ? 'Confirmer la désactivation de cet utilisateur ?'
      : "Confirmer l'activation de cet utilisateur ?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await userService?.toggleUserStatus(userId);
      if (error) throw error;
      await loadUsers();
    } catch (error) {
      logger.error('Error toggling user status:', error);
      window.alert(error?.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer cet utilisateur de l\'entreprise ?')) {
      return;
    }

    try {
      const { error } = await userService?.removeUserFromCompany(userId, currentCompany?.id);
      if (error) throw error;
      await loadUsers();
    } catch (error) {
      logger.error('Error removing user:', error);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleCopyCompanyId = () => {
    if (currentCompany?.id) {
      // Fallback for non-HTTPS contexts
      const textToCopy = currentCompany.id;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => alert(`ID de l'entreprise copié :\n${textToCopy}`))
          .catch(err => {
            console.error('Clipboard error:', err);
            fallbackCopy(textToCopy);
          });
      } else {
        fallbackCopy(textToCopy);
      }
    }
  };

  const handleCopyInviteLink = async () => {
    if (!currentCompany?.id) return;

    try {
      // Create a generic invitation link for the company
      // User will need to enter their email on the acceptance page
      const inviteUrl = `${window.location.origin}/accept-invitation?companyId=${currentCompany.id}&openSignup=true`;
      
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(inviteUrl)
          .then(() => alert(`Lien d'inscription copié :\n${inviteUrl}\n\nLes personnes qui cliquent pourront s'inscrire dans ton entreprise.`))
          .catch(err => {
            console.error('Clipboard error:', err);
            fallbackCopy(inviteUrl);
          });
      } else {
        fallbackCopy(inviteUrl);
      }
    } catch (error) {
      logger.error('Error creating invite link:', error);
      alert('Erreur lors de la création du lien');
    }
  };

  // Fallback copy method for non-HTTPS contexts
  const fallbackCopy = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert(`Copié :\n${text}`);
    } catch (err) {
      console.error('Fallback copy failed:', err);
      prompt('Copiez manuellement :', text);
    }
    document.body.removeChild(textArea);
  };

  const handleBulkAction = async (action) => {
    const selectedUserObjects = users?.filter((user) => selectedUsers?.includes(user?.id));

    switch (action) {
      case 'activate':
        selectedUserObjects?.forEach((user) => {
          handleUpdateUser({ ...user, status: 'active' });
        });
        break;
      case 'deactivate':
        selectedUserObjects?.forEach((user) => {
          handleUpdateUser({ ...user, status: 'inactive' });
        });
        break;
      case 'resend_invitation':
        // Simulate resending invitations
        break;
      case 'delete':
        setUsers((prev) => prev?.filter((user) => !selectedUsers?.includes(user?.id)));
        break;
    }

    setSelectedUsers([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userRole={currentRole}
        currentTenant={currentCompany?.name} 
      />

      <div className={`transition-all duration-200 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-72'} pt-16 lg:pt-0`
      }>
        <PageHeader
          title="Gestion des utilisateurs"
          subtitle="Gérez les comptes utilisateurs et leurs permissions"
          actions={
            <>
              {(['super_admin', 'administrator']?.includes(currentRole)) && (
                <Button
                  variant="default"
                  onClick={() => setIsAddModalOpen(true)}
                  iconName="UserPlus"
                  iconPosition="left"
                  size="sm"
                  className="text-xs lg:text-sm"
                >
                  Ajouter un utilisateur
                </Button>
              )}
            </>
          }
        />

        <div className="p-4 lg:p-6">

          {/* Company Info Card */}
          {currentCompany?.id && (
            <div className="bg-card border border-border rounded-lg p-4 lg:p-5 mb-6 card-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="Building" size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{currentCompany.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted font-mono bg-muted px-2 py-0.5 rounded">
                        {currentCompany.id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCompanyId}
                    iconName="Copy"
                    iconPosition="left"
                    className="text-xs"
                  >
                    Copier l'ID
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopyInviteLink}
                    iconName="Link"
                    iconPosition="left"
                    className="text-xs"
                  >
                    Copier le lien d'invitation
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs lg:text-sm">Total utilisateurs</p>
                  <p className="text-xl lg:text-2xl font-bold text-text-primary">{users?.length}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Users" size={20} className="lg:size-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs lg:text-sm">Utilisateurs actifs</p>
                  <p className="text-xl lg:text-2xl font-bold text-success">
                    {users?.filter((u) => u?.isActive === true)?.length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="UserCheck" size={20} className="lg:size-6 text-success" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs lg:text-sm">Invitations en attente</p>
                  <p className="text-xl lg:text-2xl font-bold text-warning">
                    {invitations?.length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Icon name="Clock" size={20} className="lg:size-6 text-warning" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 lg:p-6 card-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs lg:text-sm">Administrateurs</p>
                  <p className="text-xl lg:text-2xl font-bold text-accent">
                    {users?.filter((u) => u?.role !== 'MEMBRE')?.length}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Icon name="Shield" size={20} className="lg:size-6 text-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <UserFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            currentUserRole={currentRole}
            resultCount={filteredUsers?.length} 
          />

          {/* Bulk Actions */}
          <BulkActionsBar
            selectedCount={selectedUsers?.length}
            onBulkAction={handleBulkAction}
            onClearSelection={handleClearSelection}
            currentUserRole={currentRole} 
          />

          {/* Users List */}
          {viewMode === 'table' ? (
            <UserTable
              users={filteredUsers}
              selectedUsers={selectedUsers}
              onSelectUser={handleSelectUser}
              onSelectAll={handleSelectAll}
              onEdit={openEditModal}
              onToggleStatus={handleToggleStatus}
              onViewDetails={handleViewDetails}
              currentUserRole={currentRole}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort} 
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredUsers?.map((user) => (
                <UserCard
                  key={user?.id}
                  user={user}
                  onEdit={openEditModal}
                  onToggleStatus={handleToggleStatus}
                  onViewDetails={handleViewDetails}
                  currentUserRole={currentRole} 
                />
              ))}
            </div>
          )}

          {filteredUsers?.length === 0 && (
            <div className="text-center py-12">
              <Icon name="Users" size={48} className="text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Aucun utilisateur trouvé
              </h3>
              <p className="text-text-muted">
                Aucun utilisateur ne correspond aux critères de recherche actuels.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddUser}
        currentUserRole={currentRole}
        currentCompany={currentCompany?.name} 
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateUser={handleEditUser}
        user={selectedUser}
        currentUserRole={currentRole} 
      />

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUser} 
      />

      {/* Quick Actions */}
      <QuickActionBar
        variant="floating"
        userRole={currentRole} 
      />
    </div>
  );
};

export default UserManagement;