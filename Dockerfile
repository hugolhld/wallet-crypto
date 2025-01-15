# Utiliser l'image officielle de PostGIS
FROM postgis/postgis:17-3.5

# Utilise une image officielle Node.js en tant que base
FROM node:20

# Définit le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie les fichiers package.json et package-lock.json pour installer les dépendances
COPY ./api/package.json ./

# Installe les dépendances
RUN npm install

# Copie tout le reste dans le conteneur
COPY ./api/ .

RUN npm install -g nodemon

# Expose le port sur lequel votre API écoute
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "run", "start"]
