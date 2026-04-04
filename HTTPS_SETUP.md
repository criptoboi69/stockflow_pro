# 🔒 Configuration HTTPS pour StockFlow Pro

## ✅ HTTPS Activé via Tailscale

**URL HTTPS StockFlow :** https://jordan-1.tail519d0c.ts.net/stock

**URL HTTPS OpenClaw :** https://jordan-1.tail519d0c.ts.net/

StockFlow est accessible via le path `/stock` pour coexister avec OpenClaw.

---

## 🎯 Pourquoi HTTPS ?

### Problème résolu : **Caméra QR Scanner sur mobile**

L'API `getUserMedia()` (accès caméra) nécessite **HTTPS** en production :
- ❌ `http://100.66.171.51:4028` → Caméra bloquée sur mobile
- ✅ `https://jordan-1.tail519d0c.ts.net` → Caméra fonctionne ✅

---

## 📱 Comment accéder à StockFlow

### Sur Mobile (Android/iOS)

1. **Ouvre Tailscale** sur ton mobile
2. **Connecte-toi** à ton tailnet
3. **Ouvre le navigateur** et va sur :
   ```
   https://jordan-1.tail519d0c.ts.net/
   ```
4. **Accepte le certificat** si demandé (certificat Tailscale auto-signé)

### Sur Desktop

**Option 1 : Via Tailscale (HTTPS)**
```
https://jordan-1.tail519d0c.ts.net/
```

**Option 2 : En local (HTTP)**
```
http://localhost:4028/
```

---

## ⚙️ Configuration Tailscale

### Commande actuelle
```bash
tailscale serve --bg 4028
```

### Vérifier le statut
```bash
tailscale serve status --json
```

### Reset (si besoin)
```bash
tailscale serve reset
tailscale serve --bg 4028
```

### Désactiver
```bash
tailscale serve --https=443 off
```

---

## 🔄 Démarrage automatique

Pour que HTTPS reste actif après redémarrage, ajoute au systemd :

### Option 1 : Systemd user service

Crée `/home/jordan/.config/systemd/user/stockflow-https.service` :

```ini
[Unit]
Description=StockFlow HTTPS via Tailscale
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/tailscale serve --bg 4028
ExecStop=/usr/bin/tailscale serve --https=443 off
RemainAfterExit=yes

[Install]
WantedBy=default.target
```

Puis :
```bash
systemctl --user daemon-reload
systemctl --user enable stockflow-https.service
systemctl --user start stockflow-https.service
```

---

## 🛡️ Sécurité

- ✅ **Certificat Tailscale** auto-signé (valide dans le tailnet)
- ✅ **Chiffrement TLS** actif
- ✅ **Accès limité** au tailnet uniquement
- ⚠️ **Pas exposé sur internet** (sauf si `tailscale funnel` activé)

---

## 📝 Notes

- L'URL HTTPS peut changer si ton nom de machine change
- Le certificat est automatiquement géré par Tailscale
- Pas besoin de renouvellement manuel

---

*Configuration réalisée le 4 avril 2026*
