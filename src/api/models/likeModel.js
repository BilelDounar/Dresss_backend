const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
    {
        user: { type: String, required: true },   // qui aime
        postId: { type: String, required: true },   // publication aimée
        postOwner: { type: String, required: true },   // auteur de la publication
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

// Empêche le double-like
likeSchema.index({ user: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
