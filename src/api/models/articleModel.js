const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    publicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication', required: true },
    urlPhoto: { type: String },
    titre: { type: String, required: true },
    description: { type: String },
    prix: { type: Number, required: true },
    lien: { type: String },
    user: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Article', articleSchema);