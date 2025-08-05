const Comment = require('../models/commentModel');
const Publication = require('../models/publicationModel');
const Notification = require('../models/notificationModel');

/**
 * POST /api/comments
 * Body: { user, postId, text }
 */
exports.createComment = async (req, res) => {
    try {
        const { user, postId, text } = req.body;
        if (!user || !postId || !text?.trim()) {
            return res.status(400).json({ message: 'user, postId et text requis' });
        }

        // vérifier publication
        const publication = await Publication.findById(postId);
        if (!publication) {
            return res.status(404).json({ message: 'Publication non trouvée' });
        }

        const postOwner = publication.user;

        // créer le commentaire
        const comment = await Comment.create({ user, postId, text: text.trim(), postOwner });

        // incrémenter le compteur de commentaires
        publication.comments += 1;
        await publication.save();

        // notifier l'auteur sauf auto-comment
        if (user !== postOwner) {
            await Notification.create({
                user: postOwner,
                from: user,
                kind: 'comment',
                targetId: postId,
                targetType: 'post',
                text: ' a commenté votre look',
            });
        }

        return res.status(201).json({ comment });
    } catch (err) {
        console.error('createComment error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * GET /api/comments/:postId
 */
exports.getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) {
            return res.status(400).json({ message: 'postId requis' });
        }

        // retourner commentaires les plus récents d'abord
        const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
        return res.status(200).json(comments);
    } catch (err) {
        console.error('getComments error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
