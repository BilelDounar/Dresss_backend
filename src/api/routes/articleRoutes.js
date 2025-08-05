// backend/src/api/routes/articleRoutes.js

const express = require('express');
const router = express.Router();

const { getArticles, getArticleById } = require('../controllers/articleController');

// GET /api/articles
router.route('/').get(getArticles);

// GET /api/articles/:id
router.route('/:id').get(getArticleById);

module.exports = router;
