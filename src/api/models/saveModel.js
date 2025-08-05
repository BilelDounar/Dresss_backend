const mongoose = require('mongoose');

const SaveSchema = new mongoose.Schema(
    {
        // Stocke l'identifiant de l'utilisateur qui enregistre. On le laisse en String pour accepter
        // tous types d'ID (UUID, ObjectId, etc.) émanant du frontend.
        user: {
            type: String,
            required: true,
        },
        itemId: {
            type: String,
            required: true,
        },
        itemType: {
            type: String,
            enum: ['publication', 'article'],
            required: true,
        },
        // Propriétaire de l'item (ex : auteur de la publication). Peut être absent.
        itemOwner: {
            type: String,
            required: false,
        },
    },
    { timestamps: true }
);

// Un utilisateur ne peut enregistrer qu'une seule fois un même item
SaveSchema.index({ user: 1, itemId: 1, itemType: 1 }, { unique: true });

module.exports = mongoose.model('Save', SaveSchema);
