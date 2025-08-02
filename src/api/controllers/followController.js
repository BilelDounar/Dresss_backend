const Follow = require('../models/followModel');
const Notification = require('../models/notificationModel');

// POST /api/follows
exports.followUser = async (req, res) => {
    try {
        const { follower, followed } = req.body;
        if (!follower || !followed) {
            return res.status(400).json({ message: 'follower et followed requis' });
        }
        if (follower === followed) {
            return res.status(400).json({ message: 'Impossible de se suivre soi-même' });
        }

        const follow = await Follow.create({ follower, followed });

        // Création d'une notification pour l'utilisateur suivi
        await Notification.create({
            user: followed,
            from: follower,
            kind: 'follow',
            text: 'Nouvel abonné',
        });

        return res.status(201).json({ followed: true, follow });
    } catch (err) {
        if (err.code === 11000) {
            // duplicate key (déjà suivi)
            return res.status(409).json({ message: 'Déjà suivi' });
        }
        console.error('followUser error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// DELETE /api/follows
exports.unfollowUser = async (req, res) => {
    try {
        const { follower, followed } = req.body;
        if (!follower || !followed) {
            return res.status(400).json({ message: 'follower et followed requis' });
        }
        const result = await Follow.deleteOne({ follower, followed });
        return res.status(200).json({ unfollowed: result.deletedCount > 0 });
    } catch (err) {
        console.error('unfollowUser error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// GET /api/follows/status?follower=..&followed=..
exports.isFollowing = async (req, res) => {
    try {
        const { follower, followed } = req.query;
        if (!follower || !followed) {
            return res.status(400).json({ message: 'follower et followed requis' });
        }
        const exists = await Follow.exists({ follower, followed });
        return res.status(200).json({ isFollowing: !!exists });
    } catch (err) {
        console.error('isFollowing error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
