const mongoose = require('mongoose');
const Publication = require('../models/publicationModel');
const Article = require('../models/articleModel');
const ViewedPublication = require('../models/viewedPublicationModel');
const fs = require('fs');
const path = require('path');

// @desc    Créer une publication
// @route   POST /api/publications
exports.createPublication = async (req, res) => {
    try {
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

        // 1. Créer une publication vide pour obtenir son _id (urlsPhotos sera mis à jour après renommage)
        const publication = await Publication.create({ description, user, urlsPhotos: [] });

        // Helper pour ajouter l'id de la publication en préfixe des fichiers
        const prefixFilesWithPubId = async (filesArr) => {
            if (!filesArr) return;
            const uploadsDir = path.join(process.cwd(), 'uploads');
            await Promise.all(
                filesArr.map(async (file) => {
                    // Découpe le nom en segments séparés par « - »
                    const segments = file.filename.split('-');
                    // Remplace le premier segment (tmp ou ancien id) par le vrai id de la publication
                    segments[0] = publication._id.toString();
                    const newFilename = segments.join('-');
                    const newPath = path.join(uploadsDir, newFilename);
                    try {
                        // Renomme seulement si le nom change
                        if (newFilename !== file.filename) {
                            await fs.promises.rename(file.path, newPath);
                        }
                        file.filename = newFilename;
                        file.path = newPath;
                    } catch (err) {
                        console.error(`Erreur renommage fichier ${file.filename}`, err);
                    }
                })
            );
        };

        // 2. Renommer les photos de publication et d'articles
        await prefixFilesWithPubId(req.files && req.files['publicationPhoto']);
        await prefixFilesWithPubId(req.files && req.files['articlePhotos']);

        // 3. Générer les nouvelles URLs des photos de publication
        let urlsPhotos = [];
        if (req.files && req.files['publicationPhoto']) {
            urlsPhotos = req.files['publicationPhoto'].map((file) => `/uploads/${file.filename}`);
        }

        // 4. Mettre à jour la publication avec les urlsPhotos renommées
        publication.urlsPhotos = urlsPhotos;
        await publication.save();

        // 5. Préparer et créer les articles (en injectant la bonne urlPhoto)
        let createdArticles = [];
        if (Array.isArray(articles) && articles.length > 0) {
            if (req.files && req.files['articlePhotos']) {
                req.files['articlePhotos'].forEach((file, idx) => {
                    if (articles[idx]) {
                        articles[idx].urlPhoto = `/uploads/${file.filename}`;
                    }
                });
            }

            const articlesToCreate = articles
                .map((a) => ({
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
                .filter((a) => a.titre && a.urlPhoto);

            createdArticles = await Article.insertMany(articlesToCreate);
        }

        return res.status(201).json({ publication, articles: createdArticles });
    } catch (error) {
        console.error('Erreur dans createPublication:', error);
        return res.status(500).json({ message: error.message });
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
        const { id } = req.params;

        // Vérifier l'existence de la publication
        const publication = await Publication.findById(id);
        if (!publication) {
            return res.status(404).json({ message: 'Publication non trouvée' });
        }

        // TODO : Vérifier que l'utilisateur authentifié est bien propriétaire ou admin

        // 1. Récupérer les chemins des photos liés à la publication et à ses articles
        const filesToDelete = [];

        if (Array.isArray(publication.urlsPhotos)) {
            filesToDelete.push(...publication.urlsPhotos);
        }

        // Récupère les articles liés pour supprimer leurs éventuelles photos
        const relatedArticles = await Article.find({ publication: id });
        relatedArticles.forEach((art) => {
            if (art.urlPhoto) filesToDelete.push(art.urlPhoto);
        });

        // 2. Supprimer les fichiers du disque
        const uploadsDir = path.join(process.cwd(), 'uploads');
        filesToDelete.forEach((relativePath) => {
            try {
                const absolutePath = path.join(uploadsDir, path.basename(relativePath));
                if (fs.existsSync(absolutePath)) {
                    fs.unlinkSync(absolutePath);
                }
            } catch (err) {
                console.error('Erreur suppression fichier', relativePath, err);
            }
        });

        // 3. Supprimer la publication et ses articles associés
        await Publication.findByIdAndDelete(id);
        await Article.deleteMany({ publication: id });

        // 4. Réponse OK
        return res.status(204).end();
    } catch (err) {
        console.error('Erreur suppression publication :', err);
        return res.status(500).json({ message: 'Erreur serveur' });
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

// @desc    Ajouter ou retirer un like à une publication
// @route   POST /api/publications/:id/like
exports.likePublication = async (req, res) => {
    try {
        const { increment } = req.body;
        const incValue = parseInt(increment, 10);
        if (![1, -1].includes(incValue)) {
            return res.status(400).json({ message: 'increment must be 1 or -1' });
        }

        const publication = await Publication.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: incValue } },
            { new: true }
        );

        if (!publication) {
            return res.status(404).json({ message: 'Publication non trouvée' });
        }
        res.status(200).json({ likes: publication.likes });
    } catch (err) {
        console.error('Erreur dans likePublication:', err);
        res.status(500).json({ message: err.message });
    }
};
