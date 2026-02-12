import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { getStoredLanguage, persistLanguage } from '../../utils/language';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [currentLanguage, setCurrentLanguage] = useState(
    getStoredLanguage()
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  const texts = {
    fr: {
      title: "Nouveau mot de passe - StockFlow Pro",
      description: "Créez un nouveau mot de passe pour votre compte StockFlow Pro",
      heading: "Créer un nouveau mot de passe",
      subtitle: "Choisissez un mot de passe sécurisé pour protéger votre compte.",
      passwordLabel: "Nouveau mot de passe",
      passwordPlaceholder: "Entrez votre nouveau mot de passe",
      confirmPasswordLabel: "Confirmer le mot de passe",
      confirmPasswordPlaceholder: "Confirmez votre nouveau mot de passe",
      resetButton: "Réinitialiser le mot de passe",
      backToLogin: "Retour à la connexion",
      successMessage: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
      errorMessage: "Une erreur s\'est produite. Veuillez réessayer.",
      passwordRequired: "Le mot de passe est requis",
      passwordTooShort: "Le mot de passe doit contenir au moins 8 caractères",
      passwordsNoMatch: "Les mots de passe ne correspondent pas",
      invalidToken: "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.",
      checkingToken: "Vérification du lien...",
      passwordStrength: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
      requirements: "Exigences du mot de passe :",
      req1: "Au moins 8 caractères",
      req2: "Une lettre majuscule",
      req3: "Une lettre minuscule",
      req4: "Un chiffre"
    },
    en: {
      title: "New Password - StockFlow Pro",
      description: "Create a new password for your StockFlow Pro account",
      heading: "Create New Password",
      subtitle: "Choose a secure password to protect your account.",
      passwordLabel: "New Password",
      passwordPlaceholder: "Enter your new password",
      confirmPasswordLabel: "Confirm Password",
      confirmPasswordPlaceholder: "Confirm your new password",
      resetButton: "Reset Password",
      backToLogin: "Back to Login",
      successMessage: "Your password has been reset successfully. You can now log in.",
      errorMessage: "An error occurred. Please try again.",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must be at least 8 characters",
      passwordsNoMatch: "Passwords do not match",
      invalidToken: "The reset link is invalid or has expired. Please request a new link.",
      checkingToken: "Verifying link...",
      passwordStrength: "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
      requirements: "Password requirements:",
      req1: "At least 8 characters",
      req2: "One uppercase letter",
      req3: "One lowercase letter",
      req4: "One number"
    }
  };

  const t = texts?.[currentLanguage];

  useEffect(() => {
    // Check if user has a valid recovery token
    const checkRecoveryToken = async () => {
      try {
        const { data: { session }, error } = await supabase?.auth?.getSession();
        
        if (error || !session) {
          setValidToken(false);
          setError(t?.invalidToken);
        } else {
          setValidToken(true);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setValidToken(false);
        setError(t?.invalidToken);
      } finally {
        setCheckingToken(false);
      }
    };

    checkRecoveryToken();
  }, []);

  const validatePassword = (password) => {
    if (password?.length < 8) return false;
    const hasUpperCase = /[A-Z]/?.test(password);
    const hasLowerCase = /[a-z]/?.test(password);
    const hasNumber = /[0-9]/?.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
  };

  const getPasswordStrength = (password) => {
    const checks = [
      password?.length >= 8,
      /[A-Z]/?.test(password),
      /[a-z]/?.test(password),
      /[0-9]/?.test(password)
    ];
    return checks?.filter(Boolean)?.length;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!password?.trim()) {
      setError(t?.passwordRequired);
      return;
    }

    if (password?.length < 8) {
      setError(t?.passwordTooShort);
      return;
    }

    if (!validatePassword(password)) {
      setError(t?.passwordStrength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t?.passwordsNoMatch);
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase?.auth?.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError?.message || t?.errorMessage);
      } else {
        setSuccess(true);
        navigate('/login');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(t?.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-muted">{t?.checkingToken}</p>
        </div>
      </div>
    );
  }

  if (!validToken && !checkingToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl border border-border card-shadow p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <Icon name="AlertCircle" className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              {currentLanguage === 'fr' ? 'Lien invalide' : 'Invalid Link'}
            </h1>
            <p className="text-sm text-text-muted mb-6">{error}</p>
            <Link to="/forgot-password">
              <Button variant="primary" className="w-full">
                {currentLanguage === 'fr' ? 'Demander un nouveau lien' : 'Request New Link'}
              </Button>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center mt-4 text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              {t?.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t?.title}</title>
        <meta name="description" content={t?.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        
        {/* Main Content */}
        <div className="relative flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Reset Form */}
            <div className="bg-surface rounded-2xl border border-border card-shadow p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Icon name="Key" className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {t?.heading}
                </h1>
                <p className="text-sm text-text-muted">
                  {t?.subtitle}
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-3">
                  <Icon name="CheckCircle" className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {t?.successMessage}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                  <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t?.passwordLabel}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e?.target?.value)}
                      placeholder={t?.passwordPlaceholder}
                      disabled={isLoading || success}
                      className="w-full pr-10"
                      leftIcon={<Icon name="Lock" className="w-5 h-5 text-text-muted" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Icon name={showPassword ? 'EyeOff' : 'Eye'} className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex space-x-1 mb-2">
                        {[1, 2, 3, 4]?.map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              passwordStrength >= level
                                ? passwordStrength === 4
                                  ? 'bg-green-500'
                                  : passwordStrength === 3
                                  ? 'bg-yellow-500' :'bg-red-500' :'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-text-muted">
                        {passwordStrength === 4
                          ? currentLanguage === 'fr' ?'Mot de passe fort' :'Strong password'
                          : passwordStrength === 3
                          ? currentLanguage === 'fr' ?'Mot de passe moyen' :'Medium password'
                          : currentLanguage === 'fr' ?'Mot de passe faible' :'Weak password'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t?.confirmPasswordLabel}
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e?.target?.value)}
                      placeholder={t?.confirmPasswordPlaceholder}
                      disabled={isLoading || success}
                      className="w-full pr-10"
                      leftIcon={<Icon name="Lock" className="w-5 h-5 text-text-muted" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                    >
                      <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-text-primary mb-2">{t?.requirements}</p>
                  <ul className="space-y-1">
                    <li className="flex items-center text-xs text-text-muted">
                      <Icon
                        name={password?.length >= 8 ? 'CheckCircle' : 'Circle'}
                        className={`w-4 h-4 mr-2 ${
                          password?.length >= 8 ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                      {t?.req1}
                    </li>
                    <li className="flex items-center text-xs text-text-muted">
                      <Icon
                        name={/[A-Z]/?.test(password) ? 'CheckCircle' : 'Circle'}
                        className={`w-4 h-4 mr-2 ${
                          /[A-Z]/?.test(password) ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                      {t?.req2}
                    </li>
                    <li className="flex items-center text-xs text-text-muted">
                      <Icon
                        name={/[a-z]/?.test(password) ? 'CheckCircle' : 'Circle'}
                        className={`w-4 h-4 mr-2 ${
                          /[a-z]/?.test(password) ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                      {t?.req3}
                    </li>
                    <li className="flex items-center text-xs text-text-muted">
                      <Icon
                        name={/[0-9]/?.test(password) ? 'CheckCircle' : 'Circle'}
                        className={`w-4 h-4 mr-2 ${
                          /[0-9]/?.test(password) ? 'text-green-500' : 'text-gray-400'
                        }`}
                      />
                      {t?.req4}
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || success}
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader" className="w-5 h-5 animate-spin" />
                      <span className="ml-2">{currentLanguage === 'fr' ? 'Réinitialisation...' : 'Resetting...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="Check" className="w-5 h-5" />
                      <span className="ml-2">{t?.resetButton}</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
                  {t?.backToLogin}
                </Link>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-xs text-text-muted">
                <Icon name="ShieldCheck" className="w-4 h-4" />
                <span>
                  {currentLanguage === 'fr' ?'Connexion sécurisée SSL/TLS' :'Secure SSL/TLS connection'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative bg-surface border-t border-border py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-center sm:text-left">
                <p className="text-sm text-text-muted">
                  © {new Date()?.getFullYear()} StockFlow Pro.
                  {currentLanguage === 'fr' ? ' Tous droits réservés.' : ' All rights reserved.'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-text-muted">
                <button className="hover:text-text-primary transition-colors">
                  {currentLanguage === 'fr' ? 'Support' : 'Support'}
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ResetPasswordPage;