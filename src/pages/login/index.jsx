import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import LoginForm from './components/LoginForm';
import CredentialsHelper from './components/CredentialsHelper';
import SecurityBadges from './components/SecurityBadges';
import { getStoredLanguage, persistLanguage } from '../../utils/language';

const LoginPage = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getStoredLanguage());
  const [selectedCredentials, setSelectedCredentials] = useState(null);

  useEffect(() => {
    setCurrentLanguage(getStoredLanguage());
  }, []);

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    persistLanguage(language);
  };

  const handleLoginSuccess = () => {
    // Additional login success handling can be added here
  };

  const handleCredentialSelect = (credentials) => {
    setSelectedCredentials(credentials);
  };

  const pageTexts = {
    fr: {
      title: "Connexion - StockFlow Pro",
      description: "Connectez-vous à votre système de gestion d\'inventaire StockFlow Pro. Accès sécurisé avec support multi-entreprises."
    },
    en: {
      title: "Login - StockFlow Pro", 
      description: "Sign in to your StockFlow Pro inventory management system. Secure access with multi-tenant support."
    }
  };

  const t = pageTexts?.[currentLanguage];

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
            {/* Login Form */}
            <div className="bg-surface rounded-2xl border border-border card-shadow p-8">
              <LoginForm
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
                onLoginSuccess={handleLoginSuccess}
                selectedCredentials={selectedCredentials}
              />
            </div>

            {/* Demo Credentials Helper */}
            <CredentialsHelper 
              currentLanguage={currentLanguage}
              onCredentialSelect={handleCredentialSelect}
            />

            {/* Security Badges */}
            <SecurityBadges currentLanguage={currentLanguage} />
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
                  {currentLanguage === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
                </button>
                <span>•</span>
                <button className="hover:text-text-primary transition-colors">
                  {currentLanguage === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service'}
                </button>
                <span>•</span>
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

export default LoginPage;