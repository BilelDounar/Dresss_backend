// backend/src/api/routes/publicationRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Création d'un storage personnalisé pour enregistrer les fichiers sur disque
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dossier uploads/ à la racine du backend
        cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
        // Récupération du userId si déjà parsé par Multer, sinon "unknown"
        const userId = req.body.userId || 'unknown';
        const type = file.fieldname === 'publicationPhoto' ? 'photo' : 'article';
        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const random = crypto.randomBytes(3).toString('hex'); // 6 caractères
        const ext = path.extname(file.originalname);
        cb(null, `${userId}-${type}-${date}-${random}${ext}`);
    }
});

const upload = multer({ storage });

const {
    getPublications,
    getPublicationById,
    createPublication,
    updatePublication,
    deletePublication,
    getArticlesByPublication,
    markPublicationAsViewed,
    getPublicationsByUser
} = require('../controllers/publicationController');

router
    .route('/')
    .get(getPublications)
    .post(
        upload.fields([
            { name: 'publicationPhoto', maxCount: 10 },
            { name: 'articlePhotos', maxCount: 10 }
        ]),
        createPublication
    );

router.route('/user/:userId').get(getPublicationsByUser);

router
    .route('/:id')
    .get(getPublicationById)
    .put(updatePublication)
    .delete(deletePublication);

router.route('/:id/view').post(markPublicationAsViewed);

router.route('/:id/articles').get(getArticlesByPublication);

// router.post('/publications', createPublication);

module.exports = router;
