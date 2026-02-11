import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityBadges = ({ currentLanguage = 'fr' }) => {
  const texts = {
    fr: {
      gdprCompliant: "Conforme RGPD",
      sslSecured: "Sécurisé SSL",
      frenchCertified: "Certifié France",
      dataProtection: "Protection des données européenne"
    },
    en: {
      gdprCompliant: "GDPR Compliant",
      sslSecured: "SSL Secured", 
      frenchCertified: "French Certified",
      dataProtection: "European data protection"
    }
  };

  const t = texts?.[currentLanguage];

  const badges = [
    {
      icon: "Shield",
      label: t?.gdprCompliant,
      color: "success"
    },
    {
      icon: "Lock",
      label: t?.sslSecured,
      color: "primary"
    },
    {
      icon: "Award",
      label: t?.frenchCertified,
      color: "accent"
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <div className="text-center mb-4">
        <p className="text-xs text-text-muted">
          {t?.dataProtection}
        </p>
      </div>
      <div className="flex items-center justify-center space-x-6">
        {badges?.map((badge, index) => (
          <div key={index} className="flex flex-col items-center space-y-1">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${badge?.color === 'success' ? 'bg-success/10 text-success' :
                badge?.color === 'primary'? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
              }
            `}>
              <Icon name={badge?.icon} size={16} />
            </div>
            <span className="text-xs text-text-muted text-center leading-tight">
              {badge?.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBadges;