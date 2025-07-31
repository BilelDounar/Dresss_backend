// backend/src/api/routes/publicationRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const compressImages = require('../../utils/compressImages');

// Stockage en mémoire : les buffers seront compressés puis écrits sur disque par compressImages
const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    getPublications,
    getPublicationById,
    createPublication,
    updatePublication,
    deletePublication,
    getArticlesByPublication,
    markPublicationAsViewed,
    getPublicationsByUser,
    likePublication
} = require('../controllers/publicationController');

router
    .route('/')
    .get(getPublications)
    .post(
        upload.fields([
            { name: 'publicationPhoto', maxCount: 10 },
            { name: 'articlePhotos', maxCount: 10 }
        ]),
        compressImages,
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

router.route('/:id/like').post(likePublication);

// router.post('/publications', createPublication);

module.exports = router;
