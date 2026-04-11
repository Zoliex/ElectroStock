# Configuration HTTPS pour le développement local

Pour faire fonctionner le serveur Express en HTTPS en local (et éviter les avertissements "Non sécurisé" bloquants du navigateur), vous devez générer des certificats SSL (`key.pem` et `cert.pem`).

Nous recommandons d'utiliser **mkcert**, un outil qui crée une Autorité de Certification (CA) locale sur votre machine pour que votre navigateur fasse confiance à vos certificats de développement.

---

## 💻 Générer sur Windows

### 1. Installer mkcert
Si vous êtes sur Windows 10/11, utilisez le gestionnaire de paquets intégré `winget`. Ouvrez un terminal (PowerShell ou Invite de commandes) en tant qu'administrateur et tapez :

```bash
winget install mkcert
```
*(Fermez et rouvrez votre terminal après l'installation pour que la commande soit reconnue).*

### 2. Installer l'Autorité de Certification (CA)
Forcez votre machine à faire confiance aux certificats mkcert :

```bash
mkcert -install
```
*Cliquez sur "Oui" dans la fenêtre de sécurité Windows qui apparaît.*

### 3. Générer les certificats
Placez-vous à la racine de votre projet, créez un dossier `certs` et générez les clés :

```bash
mkdir certs
cd certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
```

---

## 🍓 Générer sur Raspberry Pi (Linux / Debian / Ubuntu)

Sur un Raspberry Pi, vous voudrez probablement y accéder depuis un autre ordinateur de votre réseau local (par exemple, via `https://192.168.1.X:3300`). 

### 1. Installer mkcert et les dépendances
Ouvrez le terminal de votre Raspberry Pi (ou connectez-vous en SSH) et installez les paquets nécessaires :

```bash
sudo apt update
sudo apt install libnss3-tools mkcert
```

### 2. Installer l'Autorité de Certification (CA)
```bash
mkcert -install
```

### 3. Générer les certificats (avec IP locale)
Trouvez l'adresse IP locale de votre Raspberry Pi (avec la commande `hostname -I`). Supposons que ce soit `192.168.1.50`. 
Placez-vous à la racine de votre projet, créez le dossier et générez les certificats en incluant l'IP et le nom d'hôte (`raspberrypi.local` par défaut) :

```bash
mkdir -p certs
cd certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1 raspberrypi.local 192.168.1.50
```
*(Remplacez `192.168.1.50` par la vraie IP de votre Raspberry Pi).*

> 💡 **Note pour l'accès en réseau :** Si vous accédez au Raspberry Pi depuis votre PC Windows/Mac, votre navigateur affichera tout de même un avertissement de sécurité. C'est normal, car le PC ne connaît pas l'Autorité de Certification du Raspberry Pi. Vous pouvez simplement ignorer l'avertissement (cliquer sur "Avancé" > "Poursuivre vers le site"). 

---

## 🛠️ Méthode Alternative : OpenSSL (Sans installation de mkcert)

Si vous ne voulez/pouvez pas installer mkcert, vous pouvez utiliser OpenSSL (disponible nativement sur Linux/Raspberry Pi et via Git Bash sur Windows). Le navigateur affichera un avertissement "Connexion non sécurisée" à ignorer manuellement.

**Sur Windows (via Git Bash) ou Raspberry Pi :**
```bash
mkdir -p certs
cd certs
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "//CN=localhost"
```

---

## ⚙️ Étape finale : Mettre à jour le projet

**1. Mettre à jour le fichier `.env`**
Assurez-vous que votre fichier `.env` à la racine pointe bien vers ces fichiers :

```env
HTTP_PORT=3000
HTTPS_PORT=3300
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

**2. Protéger vos clés avec Git**
⚠️ **N'ajoutez jamais vos fichiers `.pem` à votre dépôt Git.** Ajoutez ceci à votre fichier `.gitignore` :

```text
# Configuration SSL locale
certs/
*.pem
```

## 🔒 Faire confiance au certificat sur d'autres appareils (Windows & Android)

Si vous essayez d'accéder à votre serveur local depuis un autre ordinateur ou un smartphone sur le même réseau, le navigateur affichera un avertissement de sécurité. Pour le supprimer, vous devez installer le certificat de sécurité sur cet appareil.

⚠️ **Règle d'or :** Ne partagez **JAMAIS** votre fichier de clé privée (`key.pem` ou `rootCA-key.pem`). Vous ne devez transférer que le certificat public.

### Quel fichier utiliser ?
* **Si vous avez utilisé `mkcert` :** Vous devez installer l'Autorité de Certification (CA) racine de mkcert, et non le `cert.pem` du projet. Pour trouver ce fichier, tapez `mkcert -CAROOT` dans votre terminal. Le fichier à récupérer s'appelle **`rootCA.pem`**.
* **Si vous avez utilisé OpenSSL :** Utilisez simplement le fichier **`cert.pem`** que vous avez généré dans le dossier `certs`.

---

### 🖥️ Installer le certificat sur un autre PC Windows

Si vous transférez le certificat vers un autre PC Windows pour le tester :

1. Transférez le fichier (`rootCA.pem` ou `cert.pem`) sur le PC cible (via clé USB, email, etc.).
2. Double-cliquez sur le fichier. S'il ne s'ouvre pas, renommez l'extension `.pem` en **`.crt`** et double-cliquez à nouveau.
3. Cliquez sur **Installer le certificat...**
4. Choisissez **Ordinateur local** (nécessite les droits administrateur) et faites *Suivant*.
5. Sélectionnez **Placer tous les certificats dans le magasin suivant**, puis cliquez sur **Parcourir**.
6. Choisissez **Autorités de certification racines de confiance** (Trusted Root Certification Authorities) et faites *OK*.
7. Cliquez sur *Suivant* puis *Terminer*.
8. Redémarrez votre navigateur web pour qu'il prenne en compte le certificat.

---

### 📱 Installer le certificat sur Android

*Note : Les noms exacts des menus peuvent varier légèrement selon la marque de votre téléphone (Samsung, Pixel, Xiaomi, etc.).*

1. **Transférez le fichier** (`rootCA.pem` ou `cert.pem`) sur votre téléphone (via Google Drive, email, ou câble USB). 
   *💡 Astuce : Renommez le fichier avec l'extension `.crt` avant de le transférer, Android le reconnaît plus facilement.*
2. Allez dans les **Paramètres** de votre téléphone.
3. Cherchez la section **Sécurité et confidentialité** (ou *Données biométriques et sécurité*).
4. Allez dans **Autres paramètres de sécurité** > **Chiffrement et identifiants** (ou *Identifiants*).
5. Appuyez sur **Installer un certificat** > **Certificat CA** (ou *Certificat d'Autorité de Certification*).
6. Un message d'avertissement sévère va apparaître (c'est normal, Android vous prévient). Appuyez sur **Installer quand même**.
7. Vérifiez votre identité (empreinte ou code PIN) et naviguez dans vos fichiers pour sélectionner le `.crt` ou `.pem`.
8. Une fois installé, vous pourrez accéder à votre serveur (ex: `https://192.168.x.x:3300`) depuis Chrome Mobile sans avertissement bloquant !