const Save = require('../models/saveModel');
const Publication = require('../models/publicationModel');
const Article = require('../models/articleModel');

// @desc   Save (bookmark) an item (publication or article)
// @route  POST /api/saves
// @access Private (user id in body or auth middleware)
exports.createSave = async (req, res) => {
    try {
        const { user, itemId, itemType, itemOwner } = req.body;
        if (!user || !itemId || !itemType) {
            return res.status(400).json({ message: 'user, itemId et itemType requis' });
        }

        const save = await Save.create({ user, itemId, itemType, itemOwner });

        // Optionnel: incrémenter un compteur sur l'objet sauvegardé
        if (itemType === 'publication') {
            await Publication.findByIdAndUpdate(itemId, { $inc: { savesCount: 1 } });
        } else if (itemType === 'article') {
            await Article.findByIdAndUpdate(itemId, { $inc: { savesCount: 1 } });
        }

        res.status(201).json({ save });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate => already saved
            return res.status(200).json({ message: 'Déjà enregistré' });
        }
        console.error('createSave error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc   Remove save (unsave)
// @route  DELETE /api/saves
exports.deleteSave = async (req, res) => {
    try {
        const { user, itemId, itemType } = req.body;
        const deleted = await Save.findOneAndDelete({ user, itemId, itemType });

        if (!deleted) return res.status(404).json({ message: 'Save non trouvée' });

        if (itemType === 'publication') {
            await Publication.findByIdAndUpdate(itemId, { $inc: { savesCount: -1 } });
        } else if (itemType === 'article') {
            await Article.findByIdAndUpdate(itemId, { $inc: { savesCount: -1 } });
        }

        res.json({ message: 'Supprimé' });
    } catch (err) {
        console.error('deleteSave error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc   Check if user saved item
// @route  GET /api/saves/status/:userId/:itemId/:itemType
exports.checkSaved = async (req, res) => {
    try {
        const { userId, itemId, itemType } = req.params;
        const saved = await Save.exists({ user: userId, itemId, itemType });
        res.json({ saved: !!saved });
    } catch (err) {
        console.error('checkSaved error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// @desc   Get saved items of a user (optionally filter by type)
// @route  GET /api/saves/user/:userId
exports.getSavedItems = async (req, res) => {
    try {
        const { userId } = req.params;
        const { itemType } = req.query; // optional
        const query = { user: userId };
        if (itemType) query.itemType = itemType;

        const saves = await Save.find(query).sort({ createdAt: -1 });
        res.json(saves);
    } catch (err) {
        console.error('getSavedItems error', err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
