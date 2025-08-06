const express = require('express');
const router = express.Router();
const multer = require('multer');
const compressImages = require('../../utils/compressImages');

// Compressé avec compressImages
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

module.exports = router;
