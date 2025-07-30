const mongoose = require('mongoose');
const Publication = require('../models/publicationModel');
const Article = require('../models/articleModel');
const ViewedPublication = require('../models/viewedPublicationModel');

// @desc    Créer une publication
// @route   POST /api/publications
exports.createPublication = async (req, res) => {
    try {
        // Récupération des champs texte envoyés sous multipart/form-data
        const description = req.body.description;
        const user = req.body.user || req.body.userId; // compatibilité avec le frontend

        // articles arrive sous forme de string JSON, on le parse si besoin
        let articles = req.body.articles || [];
        if (typeof articles === 'string') {
            try {
                articles = JSON.parse(articles);
            } catch (err) {
                console.error('Impossible de parser articles:', err);
                articles = [];
            }
        }

        // Traitement des photos uploadées
        let urlsPhotos = [];
        if (req.files && req.files['publicationPhoto']) {
            // On stocke l'URL relative pour pouvoir servir les images via /uploads
            urlsPhotos = req.files['publicationPhoto'].map(file => `/uploads/${file.filename}`);
        }

        // Facultatif : associer les noms de fichiers des photos d'articles si besoin
        if (req.files && req.files['articlePhotos'] && Array.isArray(articles)) {
            // On suppose que les photos sont envoyées dans le même ordre que les articles côté front
            req.files['articlePhotos'].forEach((file, idx) => {
                if (articles[idx]) {
                    articles[idx].urlPhoto = `/uploads/${file.filename}`;
                }
            });
        }

        // Création de la publication
        const publication = await Publication.create({ description, user, urlsPhotos });

        // Création des articles associés
        let createdArticles = [];
        if (Array.isArray(articles) && articles.length > 0) {
            const articlesToCreate = articles
                .map(a => ({
                    ...a,
                    // titres
                    titre: a.titre || a.title,
                    // prix : assure un nombre valide (0 si vide ou invalide)
                    prix: Number(a.prix) || 0,
                    // lien : accepte `link` ou `lien`
                    lien: a.lien || a.link || '',
                    publicationId: publication._id,
                    user,
                }))
                // on ne garde que ceux qui ont un titre et une photo (urlPhoto) pour respecter les champs required
                .filter(a => a.titre && a.urlPhoto);
            createdArticles = await Article.insertMany(articlesToCreate);
        }

        res.status(201).json({ publication, articles: createdArticles });
    } catch (error) {
        console.error('Erreur dans createPublication:', error);
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

// @desc    Récupérer toutes les publications d'un utilisateur (y compris celles déjà vues)
// @route   GET /api/publications/user/:userId
exports.getPublicationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ message: 'userId manquant dans les paramètres' });
        }

        // Retourne toutes les publications créées par cet utilisateur, sans filtrer celles déjà vues
        const publications = await Publication.find({ user: userId });

        res.status(200).json(publications);
    } catch (err) {
        console.error('Erreur dans getPublicationsByUser:', err);
        res.status(500).json({ message: err.message });
    }
};
