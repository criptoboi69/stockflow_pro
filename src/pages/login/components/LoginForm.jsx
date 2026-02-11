import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useAuth } from '../../../contexts/AuthContext';

const LoginForm = ({ 
  onLanguageChange, 
  currentLanguage = 'fr',
  onLoginSuccess,
  selectedCredentials
}) => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, loading: authLoading, user, currentCompany } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill form when demo credentials are selected
  useEffect(() => {
    if (selectedCredentials?.email && selectedCredentials?.password) {
      setFormData(prev => ({
        ...prev,
        email: selectedCredentials?.email,
        password: selectedCredentials?.password
      }));
      // Switch to sign-in mode if in sign-up mode
      if (isSignUpMode) {
        setIsSignUpMode(false);
      }
    }
  }, [selectedCredentials]);

  // Demo credentials for easy testing
  const demoCredentials = [
    {
      email: "superadmin@stockflow.fr",
      password: "SuperAdmin123!",
      role: "Super Admin",
      description: "Accès complet à toutes les entreprises"
    },
    {
      email: "admin@techcorp.fr",
      password: "Admin123!",
      role: "Administrateur",
      description: "Gestion complète de TechCorp Solutions"
    },
    {
      email: "manager@techcorp.fr",
      password: "Manager123!",
      role: "Gestionnaire",
      description: "Gestion des produits et stocks"
    },
    {
      email: "user@techcorp.fr",
      password: "User123!",
      role: "Utilisateur",
      description: "Consultation et mouvements de stock"
    }
  ];

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' }
  ];

  const texts = {
    fr: {
      title: "Connexion à StockFlow Pro",
      subtitle: "Accédez à votre système de gestion d\'inventaire",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "votre@email.fr",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "Votre mot de passe",
      fullNameLabel: "Nom complet",
      fullNamePlaceholder: "Votre nom complet",
      rememberMe: "Se souvenir de moi",
      loginButton: "Se connecter",
      signUpButton: "S\'inscrire",
      googleButton: "Continuer avec Google",
      forgotPassword: "Mot de passe oublié ?",
      demoTitle: "Comptes de démonstration",
      invalidCredentials: "E-mail ou mot de passe incorrect",
      emailRequired: "L\'adresse e-mail est requise",
      passwordRequired: "Le mot de passe est requis",
      fullNameRequired: "Le nom complet est requis",
      signUpTitle: "Créer un compte",
      signUpSubtitle: "Inscrivez-vous pour commencer",
      alreadyHaveAccount: "Vous avez déjà un compte ?",
      signInLink: "Se connecter",
      noAccount: "Pas encore de compte ?",
      signUpLink: "S\'inscrire",
      orDivider: "OU",
      checkEmail: "Vérifiez votre e-mail pour confirmer votre inscription"
    },
    en: {
      title: "Login to StockFlow Pro",
      subtitle: "Access your inventory management system",
      emailLabel: "Email Address",
      emailPlaceholder: "your@email.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Your password",
      fullNameLabel: "Full Name",
      fullNamePlaceholder: "Your full name",
      rememberMe: "Remember me",
      loginButton: "Sign In",
      signUpButton: "Sign Up",
      googleButton: "Continue with Google",
      forgotPassword: "Forgot password?",
      demoTitle: "Demo Accounts",
      invalidCredentials: "Invalid email or password",
      emailRequired: "Email address is required",
      passwordRequired: "Password is required",
      fullNameRequired: "Full name is required",
      signUpTitle: "Create Account",
      signUpSubtitle: "Sign up to get started",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in",
      noAccount: "Don\'t have an account?",
      signUpLink: "Sign up",
      orDivider: "OR",
      checkEmail: "Check your email to confirm your registration"
    }
  };

  const t = texts?.[currentLanguage];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email?.trim()) {
      newErrors.email = t?.emailRequired;
    }

    if (!formData?.password) {
      newErrors.password = t?.passwordRequired;
    }

    if (isSignUpMode && !formData?.fullName?.trim()) {
      newErrors.fullName = t?.fullNameRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      if (isSignUpMode) {
        // Sign up flow
        const { data, error } = await signUp(
          formData?.email, 
          formData?.password, 
          formData?.fullName
        );

        if (error) {
          console.error('[LoginForm] Sign up error:', error);
          setErrors({ submit: error?.message || t?.invalidCredentials });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          setErrors({ success: t?.checkEmail });
          // Clear form
          setFormData({ email: '', password: '', fullName: '', rememberMe: false });
          setIsLoading(false);
        }
      } else {
        // Sign in flow
        console.log('[LoginForm] Attempting sign in with:', formData?.email);
        const { data, error } = await signIn(formData?.email, formData?.password);

        if (error) {
          console.error('[LoginForm] Sign in error:', error);
          
          // Provide user-friendly error messages
          let errorMessage = t?.invalidCredentials;
          
          if (error?.message?.includes('Email not confirmed')) {
            errorMessage = 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
          } else if (error?.message?.includes('Invalid login credentials')) {
            errorMessage = 'E-mail ou mot de passe incorrect. Veuillez réessayer.';
          }
          
          setErrors({ submit: errorMessage });
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          console.log('[LoginForm] Sign in successful, user:', data?.user?.email);
          console.log('[LoginForm] Current company:', currentCompany?.name);
          
          // Auth context has already loaded user data, navigate immediately
          if (currentCompany) {
            console.log('[LoginForm] Navigating to dashboard');
            onLoginSuccess?.();
            navigate('/dashboard');
          } else {
            console.warn('[LoginForm] No company assigned, but navigating anyway');
            onLoginSuccess?.();
            navigate('/dashboard');
          }
          
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('[LoginForm] Auth exception:', error);
      setErrors({ submit: error?.message || t?.invalidCredentials });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setErrors({ submit: error?.message });
      }
      // OAuth redirect happens automatically
    } catch (error) {
      console.error('Google sign-in error:', error);
      setErrors({ submit: error?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email, password) => {
    setFormData(prev => ({ ...prev, email, password }));
  };

  const handleMagicLink = async () => {
    // Placeholder for magic link functionality
    console.log('Magic link requested for:', formData?.email);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
            <Icon name="Package" size={24} className="text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">
          {isSignUpMode ? t?.signUpTitle : t?.title}
        </h1>
        <p className="text-text-muted">
          {isSignUpMode ? t?.signUpSubtitle : t?.subtitle}
        </p>
      </div>
      {/* Error/Success Messages */}
      {errors?.submit && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-error" />
            <p className="text-sm text-error">{errors?.submit}</p>
          </div>
        </div>
      )}
      {errors?.success && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <p className="text-sm text-success">{errors?.success}</p>
          </div>
        </div>
      )}
      {/* Google Sign-In Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        loading={isLoading}
        fullWidth
        className="h-12 mb-4"
      >
        <Icon name="Chrome" size={20} className="mr-2" />
        {t?.googleButton}
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface text-text-muted">{t?.orDivider}</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUpMode && (
          <Input
            type="text"
            label={t?.fullNameLabel}
            placeholder={t?.fullNamePlaceholder}
            value={formData?.fullName}
            onChange={(e) => handleInputChange('fullName', e?.target?.value)}
            error={errors?.fullName}
            required
            disabled={isLoading}
          />
        )}

        <Input
          type="email"
          label={t?.emailLabel}
          placeholder={t?.emailPlaceholder}
          value={formData?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          required
          disabled={isLoading}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label={t?.passwordLabel}
            placeholder={t?.passwordPlaceholder}
            value={formData?.password}
            onChange={(e) => handleInputChange('password', e?.target?.value)}
            error={errors?.password}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-text-muted hover:text-text-primary transition-colors"
            disabled={isLoading}
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={20} />
          </button>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between">
          {!isSignUpMode && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData?.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e?.target?.checked)}
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm text-text-secondary">{t?.rememberMe}</span>
            </label>
          )}
          
          {!isSignUpMode && (
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
              disabled={isLoading}
            >
              {t?.forgotPassword}
            </button>
          )}
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          variant="default"
          loading={isLoading}
          fullWidth
          className="h-12"
        >
          {isSignUpMode ? t?.signUpButton : t?.loginButton}
        </Button>

        {/* Toggle Sign Up/Sign In */}
        <div className="text-center">
          <p className="text-sm text-text-muted">
            {isSignUpMode ? t?.alreadyHaveAccount : t?.noAccount}
            {' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                setErrors({});
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
              disabled={isLoading}
            >
              {isSignUpMode ? t?.signInLink : t?.signUpLink}
            </button>
          </p>
        </div>

        {/* Forgot Password Link */}
        {!isSignUpMode && (
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-primary-dark transition-colors inline-flex items-center"
            >
              <Icon name="help-circle" className="w-4 h-4 mr-1" />
              {t?.forgotPassword}
            </Link>
          </div>
        )}
      </form>
      {/* Magic Link Section */}
      {/* <div className="mt-8 pt-6 border-t border-border">
        <div className="text-center mb-4">
          <h3 className="text-sm font-medium text-text-primary mb-1">
            {t?.magicLinkTitle}
          </h3>
          <p className="text-xs text-text-muted">
            {t?.magicLinkDescription}
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleMagicLink}
          loading={isLoading}
          fullWidth
          iconName="Mail"
          iconPosition="left"
        >
          {t?.sendMagicLink}
        </Button>
      </div> */}
      {/* Registration Link */}
      {/* <div className="mt-6 text-center">
        <span className="text-sm text-text-muted">{t?.noAccount} </span>
        <button
          type="button"
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          disabled={isLoading}
        >
          {t?.register}
        </button>
      </div> */}
      {/* Language Toggle */}
      <div className="mt-8 pt-4 border-t border-border">
        <Select
          options={languageOptions}
          value={currentLanguage}
          onChange={onLanguageChange}
          placeholder="Language"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default LoginForm;