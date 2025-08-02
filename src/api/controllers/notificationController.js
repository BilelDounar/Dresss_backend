const Notification = require('../models/notificationModel');

// GET /api/notifications/user/:id
exports.getUserNotifications = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: 'id requis' });

        const notifs = await Notification.find({ user: id }).sort({ createdAt: -1 });
        return res.status(200).json(notifs);
    } catch (err) {
        console.error('getUserNotifications error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// PATCH /api/notifications/:notifId/seen
exports.markAsSeen = async (req, res) => {
    try {
        const { notifId } = req.params;
        const notif = await Notification.findByIdAndUpdate(
            notifId,
            { seen: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ message: 'Notification non trouvée' });
        return res.status(200).json(notif);
    } catch (err) {
        console.error('markAsSeen error', err);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};
