# 🚀 Scan Wallet ETH Project

## 📌 Introduction
**Scan Wallet ETH** est une application permettant de suivre et gérer plusieurs portefeuilles Ethereum en temps réel.

---

## 🛠️ Installation et Configuration

### ⚙️ 1 - Configuration du Backend

1. Ouvrir le projet dans un éditeur.
2. Copier le fichier `.env.example` et le renommer en `.env`.
3. Remplir tous les champs nécessaires :
   - **API KEY requises** :
     - [EtherScanAPI](https://etherscan.io/apis)
     - [CryptoCompareAPI](https://www.cryptocompare.com/)
4. Dans un terminal, placez-vous à la racine du projet :
   ```bash
   cp .env.example .env
   ```
5. Remplissez les informations de votre base de données dans le fichier `.env`.
6. Lancez les conteneurs Docker :
   ```bash
   docker compose up --build
   ```
7. Attendez la création des conteneurs.

---

### 🎨 2 - Configuration du Frontend

1. Dans un terminal, à la racine du projet :
   ```bash
   cd front
   ```
2. Copier le fichier `.env.example` et le renommer en `.env` :
   ```bash
   cp .env.example .env
   ```
3. Installer les dépendances :
   ```bash
   npm install
   ```
4. Démarrer l’application :
   ```bash
   npm run start
   ```
5. Vous devriez voir le lien de l'application s'afficher dans le terminal.

---

### 🧪 3 - Tester le Projet

✔️ **Créer un compte**  
✔️ **Ajouter plusieurs portefeuilles à votre profil**  
✔️ **Accéder au tableau de bord pour consulter et sélectionner vos portefeuilles**  