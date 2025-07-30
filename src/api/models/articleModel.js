const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    publicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true },
    urlPhoto: { type: String, required: true },
    titre: { type: String, required: true },
    description: { type: String },
    prix: { type: Number },
    lien: { type: String },
    user: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Article', articleSchema);