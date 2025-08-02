const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
    {
        follower: { type: String, required: true },
        followed: { type: String, required: true }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false }
    }
);

// Empêche les doublons (un même follower ne peut suivre plusieurs fois le même user)
followSchema.index({ follower: 1, followed: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
