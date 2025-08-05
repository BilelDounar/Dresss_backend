const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        user: { type: String, required: true },      // auteur du commentaire
        postId: { type: String, required: true },    // publication concernée
        text: { type: String, required: true },      // contenu du commentaire
        postOwner: { type: String, required: true }, // auteur de la publication (pour notifications)
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

module.exports = mongoose.model('Comment', commentSchema);
