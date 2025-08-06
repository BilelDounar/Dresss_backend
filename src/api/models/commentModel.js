const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        user: { type: String, required: true },      // auteur
        postId: { type: String, required: true },    // publication
        text: { type: String, required: true },      // contenu
        postOwner: { type: String, required: true }, // auteur de la publication (notifications)
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

module.exports = mongoose.model('Comment', commentSchema);
