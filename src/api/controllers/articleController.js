// backend/src/api/controllers/articleController.js

const Article = require('../models/articleModel');

// @desc    Get all articles (optional)
// @route   GET /api/articles
exports.getArticles = async (req, res) => {
    try {
        const articles = await Article.find().sort({ createdAt: -1 });
        res.json(articles);
    } catch (err) {
        console.error('getArticles error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc    Get single article by id
// @route   GET /api/articles/:id
exports.getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Article non trouvé' });
        res.json(article);
    } catch (err) {
        console.error('getArticleById error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
