const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// Middleware pour le logging, le parsing et les fichiers statiques
app.use(logger('dev')); // Logger des requêtes
app.use(express.json()); // Parser le JSON des requêtes
app.use(express.urlencoded({ extended: false })); // Parser les requêtes URL-encodées
app.use(cookieParser()); // Parser les cookies
app.use(express.static(path.join(__dirname, 'public'))); // Fichiers statiques
app.use(helmet()); // Sécurité
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    // origin: 'http://0.0.0.0',
    credentials: true,
  })
)

app.use('/api/v1/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth/signup', require('./routes/auth/signup'));
app.use('/api/v1/auth/activate', require('./routes/auth/activate'));
app.use('/api/v1/auth/resend', require('./routes/auth/resend'));
app.use('/api/v1/auth/signin', require('./routes/auth/signin'));
app.use('/api/v1/auth/refresh', require('./routes/auth/refresh'));
app.use('/api/v1/auth/me', require('./routes/auth/me'));
app.use('/api/v1/auth/logout', require('./routes/auth/logout'));
app.use('/api/v1/auth/forgot', require('./routes/auth/forgot'));
app.use('/api/v1/auth/reset', require('./routes/auth/reset'));
app.use('/api/v1/profile/wallet', require('./routes/profile/wallet'));
app.use('/api/v1/profile/favorite_currency', require('./routes/profile/favorite_currency'));
app.use('/api/v1/wallet/get_data', require('./routes/wallet/get_data'));

// Middleware pour gérer les erreurs 404
app.use(handle404);

// Middleware pour gérer les autres erreurs
app.use(handleErrors);

// Fonction pour gérer les erreurs 404
function handle404(req, res, next) {
  next(createError(404));
}

// Fonction pour gérer les erreurs générales
function handleErrors(err, req, res, next) {
  // Définir les variables locales pour l'affichage des erreurs
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Renvoyer la réponse d'erreur
  res.status(err.status || 500);
  res.send({
    error: res.locals.error,
    message: res.locals.message,
  });
}

// Exporter l'application
module.exports = app;
