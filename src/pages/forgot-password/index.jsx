import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { getStoredLanguage, persistLanguage } from '../../utils/language';

const ForgotPasswordPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState(
    getStoredLanguage()
  );
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    fr: {
      title: "Réinitialisation du mot de passe - StockFlow Pro",
      description: "Réinitialisez votre mot de passe StockFlow Pro en toute sécurité",
      heading: "Mot de passe oublié ?",
      subtitle: "Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "votre@email.fr",
      sendButton: "Envoyer le lien de réinitialisation",
      backToLogin: "Retour à la connexion",
      successMessage: "Un e-mail de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.",
      errorMessage: "Une erreur s\'est produite. Veuillez réessayer.",
      emailRequired: "L\'adresse e-mail est requise",
      invalidEmail: "Veuillez entrer une adresse e-mail valide"
    },
    en: {
      title: "Password Reset - StockFlow Pro",
      description: "Reset your StockFlow Pro password securely",
      heading: "Forgot Password?",
      subtitle: "Enter your email address and we\'ll send you a link to reset your password.",
      emailLabel: "Email Address",
      emailPlaceholder: "your@email.com",
      sendButton: "Send Reset Link",
      backToLogin: "Back to Login",
      successMessage: "A password reset email has been sent to your address. Please check your inbox.",
      errorMessage: "An error occurred. Please try again.",
      emailRequired: "Email address is required",
      invalidEmail: "Please enter a valid email address"
    }
  };

  const t = texts?.[currentLanguage];

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex?.test(email);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccess(false);

    if (!email?.trim()) {
      setError(t?.emailRequired);
      return;
    }

    if (!validateEmail(email)) {
      setError(t?.invalidEmail);
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`
      });

      if (resetError) {
        setError(resetError?.message || t?.errorMessage);
      } else {
        setSuccess(true);
        setEmail('');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(t?.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
                  <Icon name="Lock" className="w-8 h-8 text-primary" />
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
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t?.emailLabel}
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e?.target?.value)}
                    placeholder={t?.emailPlaceholder}
                    disabled={isLoading || success}
                    className="w-full"
                    leftIcon={<Icon name="Mail" className="w-5 h-5 text-text-muted" />}
                  />
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
                      <span className="ml-2">{currentLanguage === 'fr' ? 'Envoi...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="w-5 h-5" />
                      <span className="ml-2">{t?.sendButton}</span>
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
                  {currentLanguage === 'fr' ?'Lien sécurisé valide pendant 1 heure' :'Secure link valid for 1 hour'}
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

export default ForgotPasswordPage;