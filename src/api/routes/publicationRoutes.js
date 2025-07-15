// backend/src/api/routes/publicationRoutes.js
const express = require('express');
const router = express.Router();

const {
    getPublications,
    getPublicationById,
    createPublication,
    updatePublication,
    deletePublication,
    getArticlesByPublication,
    markPublicationAsViewed
} = require('../controllers/publicationController');

router
    .route('/')
    .get(getPublications)
    .post(createPublication);

router
    .route('/:id')
    .get(getPublicationById)
    .put(updatePublication)
    .delete(deletePublication);

router.route('/:id/view').post(markPublicationAsViewed);

router.route('/:id/articles').get(getArticlesByPublication);

// router.post('/publications', createPublication);

module.exports = router;
