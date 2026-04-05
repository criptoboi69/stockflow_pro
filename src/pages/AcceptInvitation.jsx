import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/AppIcon';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { userService } from '../services/userService';

const AcceptInvitation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const companyId = searchParams.get('companyId');
  const openSignup = searchParams.get('openSignup') === 'true';

  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    if (token) {
      checkInvitation();
    } else if (companyId && openSignup) {
      // Open signup mode - user can register directly
      loadCompanyInfo();
    } else {
      setError('Lien d\'invitation invalide');
      setLoading(false);
    }
  }, [token, companyId, openSignup]);

  const checkInvitation = async () => {
    try {
      const { data, error } = await userService?.checkInvitation(token);
      if (error) throw error;

      if (!data?.isValid) {
        if (data?.isExpired) {
          setError('Cette invitation a expiré');
        } else if (data?.status === 'accepted') {
          setError('Cette invitation a déjà été acceptée');
        } else {
          setError('Invitation invalide');
        }
      } else {
        setInvitation(data);
      }
    } catch (err) {
      setError('Erreur lors de la vérification de l\'invitation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyInfo = async () => {
    try {
      // Fetch company info to show user which company they're joining
      const { data, error } = await userService?.getCompanyInfo(companyId);
      if (error) throw error;
      setCompany(data);
    } catch (err) {
      setError('Entreprise non trouvée');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (formData?.password !== formData?.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData?.password?.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setAccepting(true);
    try {
      if (token) {
        // Token-based invitation flow
        const { data, error } = await userService?.acceptInvitation(token, formData?.password);
        if (error) throw error;
        setSuccess(true);
      } else if (companyId && openSignup) {
        // Open signup flow - create user and add to company
        const { data, error } = await userService?.openSignup({
          email: formData?.email,
          password: formData?.password,
          firstName: formData?.firstName,
          lastName: formData?.lastName,
          companyId
        });
        if (error) throw error;
        setSuccess(true);
      }
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err?.message || 'Erreur lors de l\'inscription');
      console.error(err);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Icon name="Loader" size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-text-muted">Vérification de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-error" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">Invitation invalide</h1>
          <p className="text-text-muted mb-4">{error}</p>
          <Button onClick={() => navigate('/login')} variant="default">
            Retour à la connexion
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <Icon name="CheckCircle" size={48} className="mx-auto mb-4 text-success" />
          <h1 className="text-xl font-semibold text-text-primary mb-2">Compte créé !</h1>
          <p className="text-text-muted mb-4">
            Votre compte a été créé avec succès. Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <div className="bg-card border border-border rounded-lg p-6 modal-shadow">
          <div className="text-center mb-6">
            <Icon name={token ? "Mail" : "Building"} size={48} className="mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-semibold text-text-primary">
              {token ? "Accepter l'invitation" : "Rejoindre l'entreprise"}
            </h1>
            <p className="text-text-muted mt-2">
              {token ? (
                invitation?.first_name && invitation?.last_name 
                  ? `Invitation pour ${invitation.first_name} ${invitation.last_name}`
                  : 'Invitation pour ' + invitation?.email
              ) : company ? (
                `Rejoindre ${company?.name}`
              ) : (
                'Chargement...'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Open signup fields */}
            {!token && (
              <>
                <Input
                  label="Email"
                  type="email"
                  value={formData?.email}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                  placeholder="ton@email.com"
                  required
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prénom"
                    type="text"
                    value={formData?.firstName}
                    onChange={(e) => handleInputChange('firstName', e?.target?.value)}
                    placeholder="Jean"
                    required
                  />
                  
                  <Input
                    label="Nom"
                    type="text"
                    value={formData?.lastName}
                    onChange={(e) => handleInputChange('lastName', e?.target?.value)}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </>
            )}
            
            <Input
              label="Mot de passe"
              type="password"
              value={formData?.password}
              onChange={(e) => handleInputChange('password', e?.target?.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={formData?.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <div className="flex items-center gap-2 text-error text-sm bg-error/10 p-3 rounded">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full"
              loading={accepting}
              disabled={accepting}
            >
              {accepting ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>

          <p className="text-xs text-text-muted text-center mt-4">
            En créant votre compte, vous acceptez l'invitation à rejoindre l'organisation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitation;
