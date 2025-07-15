const mongoose = require('mongoose');
const Publication = require('../models/publicationModel');
const Article = require('../models/articleModel');
const ViewedPublication = require('../models/viewedPublicationModel');

// @desc    Créer une publication
// @route   POST /api/publications
exports.createPublication = async (req, res) => {
    try {
        const { description, articles, user, urlsPhotos } = req.body;
        const publication = await Publication.create({ description, user, urlsPhotos });
        let createdArticles = [];
        if (Array.isArray(articles) && articles.length > 0) {
            const articlesToCreate = articles.map(article => ({
                ...article,
                publicationId: publication._id,
                user
            }));
            createdArticles = await Article.insertMany(articlesToCreate);
        }
        res.status(201).json({ publication, articles: createdArticles });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer toutes les publications non vues par l'utilisateur
// @route   GET /api/publications
exports.getPublications = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            // Si aucun userId n'est fourni, on renvoie toutes les publications
            const allPublications = await Publication.find({});
            return res.status(200).json(allPublications);
        }

        // 1. Récupérer les publications vues par cet userId
        const viewedPublications = await ViewedPublication.find({ user: userId });
        const viewedPublicationIds = viewedPublications.map(vp => vp.publication);

        // 2. Récupérer les publications non vues
        const publications = await Publication.find({ _id: { $nin: viewedPublicationIds } });

        res.status(200).json(publications);
    } catch (err) {
        console.error('Erreur dans getPublications:', err);
        res.status(500).json({ message: err.message });
    }
};

// @desc    Récupérer une publication par ID
// @route   GET /api/publications/:id
exports.getPublicationById = async (req, res) => {
    try {
        const publication = await Publication.findById(req.params.id);
        if (!publication) {
            res.status(404).json({ message: 'Publication non trouvée' });
        } else {
            res.status(200).json(publication);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Mettre à jour une publication
// @route   PUT /api/publications/:id
exports.updatePublication = async (req, res) => {
    try {
        const publication = await Publication.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!publication) {
            res.status(404).json({ message: 'Publication non trouvée' });
        } else {
            res.status(200).json(publication);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Supprimer une publication
// @route   DELETE /api/publications/:id
exports.deletePublication = async (req, res) => {
    try {
        await Publication.findByIdAndRemove(req.params.id);
        res.status(200).json({ message: 'Publication supprimée' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Marquer une publication comme vue
// @route   POST /api/publications/:id/view
exports.markPublicationAsViewed = async (req, res) => {
    try {
        const { userId } = req.body;
        const publicationId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: 'userId manquant' });
        }

        // Vérifier si la publication a déjà été vue par cet utilisateur
        const existingView = await ViewedPublication.findOne({ user: userId, publication: publicationId });

        if (existingView) {
            return res.status(200).json({ message: 'Publication déjà marquée comme vue.' });
        }

        // Créer une nouvelle entrée avec l'ID de l'utilisateur (String)
        await ViewedPublication.create({ user: userId, publication: publicationId });

        res.status(201).json({ message: 'Publication marquée comme vue.' });
    } catch (error) {
        console.error('Erreur dans markPublicationAsViewed:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Récupérer les articles d'une publication
// @route   GET /api/publications/:id/articles
exports.getArticlesByPublication = async (req, res) => {
    try {
        const articles = await Article.find({ publicationId: req.params.id });
        if (!articles || articles.length === 0) {
            return res.status(404).json({ message: 'Aucun article trouvé pour cette publication' });
        }
        res.status(200).json(articles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
