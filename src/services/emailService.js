

export const emailService = {
  async sendInvitation(invitationData) {
    try {
      const { email, companyName, role, inviterName, token } = invitationData;
      
      const invitationLink = `${window.location?.origin}/accept-invitation?token=${token}`;
      
      const emailPayload = {
        to: email,
        subject: `Invitation à rejoindre ${companyName} sur StockFlow Pro`,
        html: this.getInvitationEmailTemplate({
          companyName,
          role,
          inviterName,
          invitationLink
        })
      };

      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response?.ok) {
        throw new Error('Failed to send invitation email');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error sending invitation:', error);
      return { success: false, error: error?.message };
    }
  },

  getInvitationEmailTemplate({ companyName, role, inviterName, invitationLink }) {
    const roleLabels = {
      super_admin: 'Super Administrateur',
      administrator: 'Administrateur',
      manager: 'Gestionnaire',
      user: 'Utilisateur'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Invitation à StockFlow Pro</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p><strong>${inviterName}</strong> vous invite à rejoindre <strong>${companyName}</strong> sur StockFlow Pro.</p>
            
            <div class="info-box">
              <strong>Votre rôle :</strong> ${roleLabels?.[role] || role}
            </div>

            <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :</p>
            
            <div style="text-align: center;">
              <a href="${invitationLink}" class="button">Accepter l'invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">Ce lien est valable pendant 7 jours.</p>
            
            <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>© 2026 StockFlow Pro - Système de gestion d'inventaire</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  async sendLowStockAlert(alertData) {
    try {
      const { email, productName, currentStock, minStock } = alertData;
      
      const emailPayload = {
        to: email,
        subject: `⚠️ Alerte stock faible : ${productName}`,
        html: this.getLowStockEmailTemplate({ productName, currentStock, minStock })
      };

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      });

      if (!response?.ok) {
        throw new Error('Failed to send alert email');
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error sending alert:', error);
      return { success: false, error: error?.message };
    }
  },

  getLowStockEmailTemplate({ productName, currentStock, minStock }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat { text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #dc2626; }
          .stat-label { color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerte Stock Faible</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Attention :</strong> Le stock du produit <strong>${productName}</strong> est en dessous du seuil minimum.
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-value">${currentStock}</div>
                <div class="stat-label">Stock actuel</div>
              </div>
              <div class="stat">
                <div class="stat-value">${minStock}</div>
                <div class="stat-label">Stock minimum</div>
              </div>
            </div>

            <p>Veuillez prendre les mesures nécessaires pour réapprovisionner ce produit.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};