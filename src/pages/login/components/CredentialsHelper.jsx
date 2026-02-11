import React, { useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CredentialsHelper = ({ onCredentialSelect, currentLanguage = 'fr' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);

  const demoHelperEnabled = import.meta.env?.VITE_ENABLE_DEMO_HELPER === 'true';

  const texts = {
    fr: {
      title: 'Comptes de démonstration',
      subtitle: 'Cliquez pour copier les identifiants',
      showCredentials: 'Afficher les comptes de démonstration',
      hideCredentials: 'Masquer les comptes de démonstration',
      copy: 'Copier',
      copied: 'Copié !',
      use: 'Utiliser',
      useAccount: 'Utiliser ce compte',
      email: 'E-mail',
      password: 'Mot de passe',
      superAdmin: 'Super Admin',
      companyAdmin: 'Administrateur',
      manager: 'Manager',
      teamMember: 'Utilisateur',
      fullAccess: 'Accès complet à toutes les entreprises',
      companyAccess: 'Gestion complète de l\'entreprise',
      managerAccess: 'Gestion des produits et des stocks',
      limitedAccess: 'Consultation et mouvements de stock',
      credentialsNotConfigured: 'Comptes de démo non configurés dans les variables d’environnement.',
      showDiagnostic: 'Diagnostiquer les problèmes de connexion',
      hideDiagnostic: 'Masquer le diagnostic',
      diagnosticTitle: 'Diagnostic d\'authentification',
      checkingAuth: 'Vérification de l\'authentification...',
      authStatus: 'État de l\'authentification',
      usersInDb: 'Utilisateurs dans la base de données',
      profilesCreated: 'Profils créés',
      rolesAssigned: 'Rôles assignés',
      troubleshooting: 'Dépannage',
      issue1: 'Si vous voyez 0 utilisateurs :',
      solution1:
        'Les utilisateurs doivent être créés via le tableau de bord Supabase (Authentication → Users). IMPORTANT : Cochez \'Auto Confirm User\' lors de la création.',
      issue2: 'Si les utilisateurs existent mais la connexion échoue :',
      solution2a: 'Vérifiez que les emails sont confirmés dans le tableau de bord Supabase.',
      solution2b: 'Vérifiez que les mots de passe correspondent exactement (sensible à la casse).',
      solution2c: 'Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées.',
      issue3: 'Si les profils ne sont pas créés :',
      solution3: 'Exécutez la migration 20260211160000_fix_auth_and_setup.sql dans l\'éditeur SQL Supabase.'
    },
    en: {
      title: 'Demo Accounts',
      subtitle: 'Click to copy credentials',
      showCredentials: 'Show demo accounts',
      hideCredentials: 'Hide demo accounts',
      copy: 'Copy',
      copied: 'Copied!',
      use: 'Use',
      useAccount: 'Use this account',
      email: 'Email',
      password: 'Password',
      superAdmin: 'Super Admin',
      companyAdmin: 'Administrator',
      manager: 'Manager',
      teamMember: 'User',
      fullAccess: 'Full access across all companies',
      companyAccess: 'Full company administration access',
      managerAccess: 'Product and stock management',
      limitedAccess: 'Read-only and stock movements',
      credentialsNotConfigured: 'Demo accounts are not configured in environment variables.',
      showDiagnostic: 'Diagnose login issues',
      hideDiagnostic: 'Hide diagnostic',
      diagnosticTitle: 'Authentication Diagnostic',
      checkingAuth: 'Checking authentication...',
      authStatus: 'Authentication Status',
      usersInDb: 'Users in database',
      profilesCreated: 'Profiles created',
      rolesAssigned: 'Roles assigned',
      troubleshooting: 'Troubleshooting',
      issue1: 'If you see 0 users:',
      solution1:
        "Users must be created via Supabase Dashboard (Authentication → Users). IMPORTANT: Check 'Auto Confirm User' when creating.",
      issue2: 'If users exist but login fails:',
      solution2a: 'Verify emails are confirmed in Supabase Dashboard.',
      solution2b: 'Verify passwords match exactly (case-sensitive).',
      solution2c: 'Open browser console (F12) to see detailed errors.',
      issue3: 'If profiles are not created:',
      solution3: 'Run migration 20260211160000_fix_auth_and_setup.sql in Supabase SQL Editor.'
    }
  };

  const t = texts?.[currentLanguage];

  const credentials = useMemo(() => {
    const configuredCredentials = [
      {
        role: t?.superAdmin,
        email: import.meta.env?.VITE_DEMO_SUPERADMIN_EMAIL,
        password: import.meta.env?.VITE_DEMO_SUPERADMIN_PASSWORD,
        access: t?.fullAccess,
        color: 'primary'
      },
      {
        role: t?.companyAdmin,
        email: import.meta.env?.VITE_DEMO_ADMIN_EMAIL,
        password: import.meta.env?.VITE_DEMO_ADMIN_PASSWORD,
        access: t?.companyAccess,
        color: 'accent'
      },
      {
        role: t?.manager,
        email: import.meta.env?.VITE_DEMO_MANAGER_EMAIL,
        password: import.meta.env?.VITE_DEMO_MANAGER_PASSWORD,
        access: t?.managerAccess,
        color: 'warning'
      },
      {
        role: t?.teamMember,
        email: import.meta.env?.VITE_DEMO_USER_EMAIL,
        password: import.meta.env?.VITE_DEMO_USER_PASSWORD,
        access: t?.limitedAccess,
        color: 'secondary'
      }
    ];

    return configuredCredentials?.filter((cred) => cred?.email && cred?.password);
  }, [t]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedEmail(id);
    } catch (error) {
      console.warn('[CredentialsHelper] Failed to copy to clipboard:', error);
    }
  };

  const handleUseAccount = (email, password) => {
    onCredentialSelect?.({ email, password });
    setIsExpanded(false);
  };

  const runDiagnostic = async () => {
    setShowDiagnostic(true);
    setDiagnosticInfo({ loading: true });

    try {
      const { supabase } = await import('../../../lib/supabase');

      const { count: authCount, error: authError } = await supabase
        ?.from('user_company_roles')
        ?.select('user_id', { count: 'exact', head: true });

      const { count: profileCount, error: profileError } = await supabase
        ?.from('user_profiles')
        ?.select('*', { count: 'exact', head: true });

      const { count: rolesCount, error: rolesError } = await supabase
        ?.from('user_company_roles')
        ?.select('*', { count: 'exact', head: true });

      const {
        data: { session },
        error: sessionError
      } = await supabase?.auth?.getSession();

      setDiagnosticInfo({
        loading: false,
        authUsers: authError ? 'Error' : authCount || 0,
        profiles: profileError ? 'Error' : profileCount || 0,
        roles: rolesError ? 'Error' : rolesCount || 0,
        currentSession: session ? session?.user?.email : 'None',
        errors: {
          auth: authError?.message,
          profile: profileError?.message,
          roles: rolesError?.message,
          session: sessionError?.message
        }
      });
    } catch (error) {
      setDiagnosticInfo({
        loading: false,
        error: error?.message
      });
    }
  };

  if (!demoHelperEnabled) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-gray-700">
        <div className="w-full max-w-md mx-auto mt-6">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            fullWidth
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            iconPosition="right"
            className="text-text-muted hover:text-text-primary"
          >
            {isExpanded ? t?.hideCredentials : t?.showCredentials}
          </Button>

          {isExpanded && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-text-primary mb-1">{t?.title}</h3>
                <p className="text-xs text-text-muted">{t?.subtitle}</p>
              </div>

              {credentials?.length === 0 ? (
                <p className="text-xs text-text-muted text-center">{t?.credentialsNotConfigured}</p>
              ) : (
                <div className="space-y-4">
                  {credentials?.map((cred, index) => (
                    <div key={index} className="bg-surface rounded-lg p-3 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${
                          cred?.color === 'primary'
                            ? 'bg-primary/10 text-primary'
                            : cred?.color === 'accent'
                            ? 'bg-accent/10 text-accent'
                            : 'bg-secondary/10 text-secondary'
                        }
                      `}
                        >
                          {cred?.role}
                        </div>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-text-muted mb-1">{t?.email}</p>
                            <p className="text-sm text-text-primary font-mono">{cred?.email}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(cred?.email, `email-${index}`)}
                            className="ml-2 p-1.5 hover:bg-muted rounded transition-colors"
                            title="Copy email"
                          >
                            <Icon
                              name={copiedEmail === `email-${index}` ? 'Check' : 'Copy'}
                              size={14}
                              className={copiedEmail === `email-${index}` ? 'text-success' : 'text-text-muted'}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-text-muted mb-1">{t?.password}</p>
                            <p className="text-sm text-text-primary font-mono">••••••••</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-text-muted">{t?.access}</p>
                        <p className="text-xs text-text-primary mt-0.5">{cred?.access}</p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => handleUseAccount(cred?.email, cred?.password)}
                        iconName="LogIn"
                        iconPosition="left"
                        className="text-xs"
                      >
                        {t?.useAccount}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            if (!showDiagnostic) {
              runDiagnostic();
            } else {
              setShowDiagnostic(false);
            }
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
        >
          {showDiagnostic ? t?.hideDiagnostic : t?.showDiagnostic}
        </button>
      </div>

      {showDiagnostic && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="Activity" className="w-5 h-5" />
            {t?.diagnosticTitle}
          </h3>

          {diagnosticInfo?.loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t?.checkingAuth}</p>
            </div>
          ) : diagnosticInfo?.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{diagnosticInfo?.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t?.authStatus}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t?.usersInDb}:</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {diagnosticInfo?.authUsers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t?.profilesCreated}:</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {diagnosticInfo?.profiles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t?.rolesAssigned}:</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">
                      {diagnosticInfo?.roles}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-3">{t?.troubleshooting}</h4>
                <div className="space-y-3 text-sm text-yellow-800 dark:text-yellow-300">
                  <div>
                    <p className="font-medium mb-1">{t?.issue1}</p>
                    <p className="text-xs">{t?.solution1}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">{t?.issue2}</p>
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>{t?.solution2a}</li>
                      <li>{t?.solution2b}</li>
                      <li>{t?.solution2c}</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">{t?.issue3}</p>
                    <p className="text-xs">{t?.solution3}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CredentialsHelper;
