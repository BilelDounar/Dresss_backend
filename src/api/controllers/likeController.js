const Like = require('../models/likeModel');
const Notification = require('../models/notificationModel');
const Publication = require('../models/publicationModel');

// POST /api/likes
exports.likePost = async (req, res) => {
    try {
        const { user, postId } = req.body;
        if (!user || !postId) {
            return res.status(400).json({ message: 'user et postId requis' });
        }

        // Récupérer la publication pour connaître l'auteur et mettre à jour le compteur
        const publication = await Publication.findById(postId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication non trouvée' });
        }

        const postOwner = publication.user;

        const like = await Like.create({ user, postId, postOwner });

        // Créer une notification pour l'auteur, sauf si l'auteur like son propre post
        if (user !== postOwner) {
            await Notification.create({
                user: postOwner,
                from: user,
                kind: 'like',
                targetId: postId,
                targetType: 'post',
                text: ' a aimé votre look',
            });
        }

        // Incrémenter le compteur de likes
        publication.likes += 1;
        await publication.save();

        return res.status(201).json({ liked: true, like });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Déjà liké' });
        }
        console.error('likePost error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/likes
exports.unlikePost = async (req, res) => {
    try {
        const { user, postId } = req.body;
        if (!user || !postId) {
            return res.status(400).json({ message: 'user et postId requis' });
        }

        const result = await Like.deleteOne({ user, postId });

        if (result.deletedCount > 0) {
            // décrémenter le compteur de likes de la publication
            await Publication.findByIdAndUpdate(postId, { $inc: { likes: -1 } });
        }

        return res.status(200).json({ unliked: result.deletedCount > 0 });
    } catch (err) {
        console.error('unlikePost error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/likes/status?user=..&postId=..
exports.isLiked = async (req, res) => {
    try {
        const { user, postId } = req.query;
        if (!user || !postId) {
            return res.status(400).json({ message: 'user et postId requis' });
        }
        const exists = await Like.exists({ user, postId });
        return res.status(200).json({ isLiked: !!exists });
    } catch (err) {
        console.error('isLiked error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/likes/count?postId=..
exports.countLikes = async (req, res) => {
    try {
        const { postId } = req.query;
        if (!postId) {
            return res.status(400).json({ message: 'postId requis' });
        }
        const count = await Like.countDocuments({ postId });
        return res.status(200).json({ count });
    } catch (err) {
        console.error('countLikes error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
