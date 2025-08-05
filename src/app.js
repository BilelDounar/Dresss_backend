const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

const publicationRoutes = require('./api/routes/publicationRoutes');
const followRoutes = require('./api/routes/followRoutes');
const notificationRoutes = require('./api/routes/notificationRoutes');
const likeRoutes = require('./api/routes/likeRoutes');
const commentRoutes = require('./api/routes/commentRoutes');

// --- Middlewares ---

// Middleware pour parser les requêtes JSON
app.use(express.json());

// Middleware pour parser les données de formulaire URL-encoded
app.use(express.urlencoded({ extended: true }));

// Active CORS pour autoriser les requêtes cross-origin (depuis votre frontend)
app.use(cors());

// --- Ensure uploads directory exists (for Multer diskStorage) ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Expose le dossier uploads pour servir les images
app.use('/uploads', express.static(uploadsDir));

// Sécurise l'application en configurant divers en-têtes HTTP
app.use(helmet());

// Logger pour les requêtes HTTP en mode développement
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- Routes ---
app.use('/api/publications', publicationRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API is running successfully!' });
});

// --- Gestion des erreurs ---

// Middleware pour les routes non trouvées (404)
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});

module.exports = app;
