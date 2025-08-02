const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        // Destinataire de la notification
        user: { type: String, required: true },
        // Auteur de l'action
        from: { type: String, required: true },

        // Type de notification (sans 'mention')
        kind: {
            type: String,
            enum: ['follow', 'like', 'comment', 'system'],
            required: true
        },

        // Cible optionnelle (post, commentaire, etc.)
        targetId: { type: String, default: null },
        targetType: { type: String, default: null },

        // Texte affiché
        text: { type: String, required: true },

        // Marquage lu / non lu
        seen: { type: Boolean, default: false }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

// Index pour lister rapidement les notifs d'un utilisateur
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
